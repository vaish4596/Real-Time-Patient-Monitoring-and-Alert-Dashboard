import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContextValue';
import { useTheme } from '../contexts/ThemeContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, HeartPulse, LogOut, AlertTriangle, MonitorPlay } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { playRiskAlertSoundDebounced } from '../utils/alertSound';

function alertBody(a) {
  return a.alertMessage ?? a.message ?? '';
}

function patientLabel(a) {
  const p = a.patient;
  if (!p) return 'Patient';
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return name || `Patient #${p.id}`;
}

function parseBackendDateTime(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(value)) {
    const [y, mo = 1, d = 1, h = 0, mi = 0, se = 0, nano = 0] = value;
    const ms = typeof nano === 'number' ? Math.floor(nano / 1e6) : 0;
    return new Date(Date.UTC(y, mo - 1, d, h, mi, Math.floor(se), ms));
  }
  if (typeof value === 'string') {
    const s = value.trim();
    const naiveIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
    if (naiveIso.test(s) && !/[zZ+]/.test(s)) {
      const d = new Date(`${s}Z`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatAlertTime(value) {
  const d = parseBackendDateTime(value);
  if (!d) return '';
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return '';
  }
}

function severityCardClasses(sev) {
  switch (sev) {
    case 'CRITICAL':
      return [
        'border-l-[6px] border-red-600 bg-red-50/95 text-red-950',
        'dark:bg-black dark:text-red-100 dark:border-red-500 dark:ring-1 dark:ring-red-500/35 alert-critical-live',
      ].join(' ');
    case 'HIGH':
      return [
        'border-l-[6px] border-orange-600 bg-orange-50 text-orange-950',
        'dark:bg-black dark:text-orange-100 dark:border-orange-500 dark:ring-1 dark:ring-orange-500/25',
      ].join(' ');
    case 'MEDIUM':
      return [
        'border-l-[6px] border-amber-500 bg-amber-50 text-amber-950',
        'dark:bg-black dark:text-amber-100 dark:border-amber-400 dark:ring-1 dark:ring-amber-400/25',
      ].join(' ');
    case 'LOW':
      return [
        'border-l-[6px] border-slate-400 bg-slate-100 text-slate-900',
        'dark:bg-black dark:text-zinc-200 dark:border-zinc-600 dark:ring-1 dark:ring-white/10',
      ].join(' ');
    default:
      return [
        'border-l-[6px] border-slate-300 bg-slate-50 text-slate-800',
        'dark:bg-black dark:text-zinc-200 dark:border-zinc-600 dark:ring-1 dark:ring-white/10',
      ].join(' ');
  }
}

function severityBadgeClasses(sev) {
  switch (sev) {
    case 'CRITICAL':
      return 'bg-red-600 text-white shadow-sm shadow-red-600/30';
    case 'HIGH':
      return 'bg-orange-600 text-white shadow-sm shadow-orange-600/25';
    case 'MEDIUM':
      return 'bg-amber-500 text-white shadow-sm shadow-amber-500/25';
    case 'LOW':
      return 'bg-slate-500 text-white dark:bg-zinc-800 dark:text-zinc-100';
    default:
      return 'bg-slate-400 text-white';
  }
}

const PRESENTATION_ROTATION_MS = 3200;

const PRESENTATION_SCENARIOS = [
  {
    status: 'Normal',
    minScore: 14,
    maxScore: 34,
    recommendation: 'Vitals are stable. Continue routine monitoring.',
  },
  {
    status: 'Warning',
    minScore: 42,
    maxScore: 67,
    recommendation: 'Patient needs observation. Check vitals frequently and review recent trends.',
  },
  {
    status: 'Critical',
    minScore: 74,
    maxScore: 96,
    recommendation: 'Immediate medical attention required. Escalate and prepare intervention.',
  },
];

function randomScoreInRange(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

const SEVERITY_RANK = { MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export default function DoctorDashboard() {
  const { logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [vitalsData, setVitalsData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [presentationDemo, setPresentationDemo] = useState(true);
  const realPredictionRef = useRef(null);
  const presentationDemoRef = useRef(true);
  const demoStepRef = useRef(0);
  const alertSoundSeenIds = useRef(new Set());

  const chartUi = useMemo(
    () =>
      isDark
        ? {
            grid: '#164e63',
            axisLine: '#71717a',
            tickFill: '#a1a1aa',
            tooltipBg: '#000000f0',
            tooltipBorder: 'rgba(34, 211, 238, 0.45)',
            tooltipLabel: '#fafafa',
          }
        : {
            grid: '#e2e8f0',
            axisLine: '#cbd5e1',
            tickFill: '#64748b',
            tooltipBg: '#ffffffee',
            tooltipBorder: '#e2e8f0',
            tooltipLabel: '#1e293b',
          },
    [isDark],
  );

  useEffect(() => {
    presentationDemoRef.current = presentationDemo;
  }, [presentationDemo]);

  useEffect(() => {
    if (!presentationDemo) return undefined;

    const applyDemoStep = () => {
      const i = demoStepRef.current % PRESENTATION_SCENARIOS.length;
      demoStepRef.current += 1;
      const s = PRESENTATION_SCENARIOS[i];
      setPrediction({
        riskScore: randomScoreInRange(s.minScore, s.maxScore),
        status: s.status,
        recommendation: s.recommendation,
        isPresentationDemo: true,
      });
    };

    applyDemoStep();
    const id = setInterval(applyDemoStep, PRESENTATION_ROTATION_MS);
    return () => clearInterval(id);
  }, [presentationDemo]);

  const registerRiskAlertSounds = useCallback((items) => {
    let worstSev = null;
    let worstRank = 0;
    items.forEach((a) => {
      if (a.id == null || alertSoundSeenIds.current.has(a.id)) return;
      const rank = SEVERITY_RANK[a.severity];
      if (!rank) return;
      alertSoundSeenIds.current.add(a.id);
      if (rank > worstRank) {
        worstRank = rank;
        worstSev = a.severity;
      }
    });
    if (worstSev) playRiskAlertSoundDebounced({ severity: worstSev });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8080/api/alerts/active').then((res) => {
      setAlerts(res.data);
      registerRiskAlertSounds(res.data);
    }).catch((err) => console.error('Error fetching alerts', err));

    axios.get('http://localhost:8080/api/alerts/resolved').then((res) => {
      setResolvedAlerts(res.data);
    }).catch((err) => console.error('Error fetching resolved alerts', err));

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-vitals'),
      onConnect: () => {
        client.subscribe('/topic/vitals/all', (message) => {
          const newVital = JSON.parse(message.body);

          const formattedVital = {
            ...newVital,
            recordedAt: new Date(newVital.recordedAt).toLocaleTimeString(),
          };

          setVitalsData((prevData) => {
            const updated = [...prevData, formattedVital];
            if (updated.length > 50) updated.shift();
            return updated;
          });

          axios
            .post('http://localhost:8000/analyze', {
              patientId: newVital.patient?.id || 1,
              heartRate: newVital.heartRate,
              bloodPressureSystolic: newVital.bloodPressureSystolic,
              bloodPressureDiastolic: newVital.bloodPressureDiastolic,
              oxygenLevel: newVital.oxygenLevel,
              temperature: newVital.temperature != null ? Number(newVital.temperature) : 98.6,
            })
            .then((res) => {
              const d = res.data;
              const next = {
                riskScore: d.riskScore ?? 0,
                status: d.status ?? 'Normal',
                recommendation: d.recommendation ?? '',
                isPresentationDemo: false,
              };
              realPredictionRef.current = next;
              if (!presentationDemoRef.current) {
                setPrediction(next);
              }

              if (d.isAnomaly) {
                axios
                  .post('http://localhost:8080/api/alerts/ai', {
                    patientId: newVital.patient?.id || 1,
                    vitalType: d.vitalType || 'AI Assessment',
                    severity: d.severity || 'MEDIUM',
                    message: d.message || 'AI anomaly detected',
                  })
                  .catch((err) => console.error('AI alert sync failed', err));
              }
            })
            .catch((err) => console.error('AI error', err));
        });

        client.subscribe('/topic/alerts/all', (message) => {
          const newAlert = JSON.parse(message.body);
          setAlerts((prevAlerts) => {
            if (prevAlerts.some((a) => a.id === newAlert.id)) return prevAlerts;
            const next = [newAlert, ...prevAlerts];
            registerRiskAlertSounds([newAlert]);
            return next;
          });
        });
      },
      onStompError: (frame) => {
        console.error(`Broker reported error: ${frame.headers.message}`);
        console.error(`Additional details: ${frame.body}`);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [registerRiskAlertSounds]);

  const resolveAlert = async (alertId) => {
    const response = await axios.post(`http://localhost:8080/api/alerts/${alertId}/resolve`);
    setAlerts((prevAlerts) => prevAlerts.filter((a) => a.id !== alertId));
    if (response.data) {
      setResolvedAlerts((prevResolved) => [response.data, ...prevResolved].slice(0, 50));
    }
  };

  const riskTone =
    prediction && prediction.riskScore > 70
      ? 'text-red-600 dark:text-red-400 dark:drop-shadow-[0_0_12px_rgba(248,113,113,0.35)]'
      : prediction && prediction.riskScore > 40
        ? 'text-amber-600 dark:text-amber-300 dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]'
        : 'text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]';

  const aiPanelBorder =
    prediction && prediction.riskScore > 70
      ? 'ring-2 ring-red-200 border-red-100 dark:ring-red-500/45 dark:border-red-500/50'
      : prediction && prediction.riskScore > 40
        ? 'ring-2 ring-amber-200 border-amber-100 dark:ring-amber-500/35 dark:border-amber-500/40'
        : 'border-slate-100 dark:border-cyan-500/25';

  const cardSurface =
    'rounded-2xl border border-slate-200/90 bg-white/85 shadow-lg shadow-slate-900/[0.04] backdrop-blur-md dark:border-cyan-500/20 dark:bg-black dark:shadow-[0_0_50px_-14px_rgba(34,211,238,0.14)]';

  return (
    <div className="min-h-screen mesh-bg-light dark:mesh-bg-dark transition-colors duration-300">
      <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-lg dark:border-cyan-500/20 dark:bg-black/90 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.85)] dark:backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-fuchsia-600 text-white shadow-md shadow-cyan-500/40 dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.5)]">
              <HeartPulse size={24} />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Doctor dashboard
              </span>
              <span className="text-xs text-slate-500 dark:text-cyan-400/90">Live vitals · AI · Alerts</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-cyan-500/30 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-950 dark:hover:border-cyan-400/45"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <div className={`${cardSurface} p-6`}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-4">
              Real-time vitals feed
            </h2>

            <div className="h-80">
              {vitalsData.length === 0 ? (
                <p className="text-slate-500 dark:text-zinc-400 py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-cyan-500/20">
                  Waiting for stream…
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartUi.grid} />
                    <XAxis dataKey="recordedAt" stroke={chartUi.axisLine} tick={{ fill: chartUi.tickFill, fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      domain={[50, 150]}
                      stroke={chartUi.axisLine}
                      tick={{ fill: chartUi.tickFill, fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[80, 100]}
                      stroke={chartUi.axisLine}
                      tick={{ fill: chartUi.tickFill, fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartUi.tooltipBg,
                        border: `1px solid ${chartUi.tooltipBorder}`,
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                      }}
                      labelStyle={{ color: chartUi.tooltipLabel, fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ color: chartUi.tickFill, fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="bloodPressureSystolic"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line yAxisId="right" type="monotone" dataKey="oxygenLevel" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Avg heart rate',
                value:
                  vitalsData.length > 0
                    ? `${Math.round(vitalsData.reduce((acc, curr) => acc + curr.heartRate, 0) / vitalsData.length)} bpm`
                    : '—',
                accent: 'from-rose-500/15 to-transparent dark:from-rose-500/25',
              },
              {
                label: 'Avg oxygen',
                value:
                  vitalsData.length > 0
                    ? `${Math.round(vitalsData.reduce((acc, curr) => acc + curr.oxygenLevel, 0) / vitalsData.length)} %`
                    : '—',
                accent: 'from-emerald-500/15 to-transparent dark:from-emerald-500/25',
              },
              {
                label: 'Active patients',
                value: `${new Set(vitalsData.map((v) => v.patient?.id)).size}`,
                accent: 'from-violet-500/15 to-transparent dark:from-violet-500/30',
              },
            ].map((stat) => (
              <div key={stat.label} className={`${cardSurface} p-5 overflow-hidden relative`}>
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
                <h3 className="relative text-slate-500 dark:text-zinc-400 text-sm font-medium">{stat.label}</h3>
                <p className="relative mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className={`${cardSurface} p-6 transition-shadow duration-300 ${aiPanelBorder}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                AI health prediction
                {prediction?.status === 'Critical' && (
                  <AlertTriangle className="text-red-500 dark:text-red-400 shrink-0" size={22} aria-hidden />
                )}
                {prediction?.status === 'Warning' && (
                  <AlertTriangle className="text-amber-500 dark:text-amber-400 shrink-0" size={22} aria-hidden />
                )}
              </h2>
              <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-cyan-500/20 dark:bg-black/80 dark:text-zinc-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-cyan-500/40 dark:bg-black"
                  checked={presentationDemo}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setPresentationDemo(on);
                    if (!on) {
                      const latest = realPredictionRef.current;
                      setPrediction(latest ?? null);
                    }
                  }}
                />
                <MonitorPlay size={16} className="text-slate-500 dark:text-zinc-400 shrink-0" aria-hidden />
                <span>
                  demo
                  <span className="block text-[11px] font-normal leading-tight text-slate-400 dark:text-zinc-500">
                    Cycles Normal → Warning → Critical
                  </span>
                </span>
              </label>
            </div>

            {!prediction ? (
              <p className="text-slate-500 dark:text-zinc-400">Waiting for vitals stream…</p>
            ) : (
              <div className="space-y-2">
                {prediction.isPresentationDemo && (
                  <p className="inline-block rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-xs font-medium text-violet-800 dark:border-fuchsia-500/35 dark:bg-black dark:text-fuchsia-200 dark:shadow-[inset_0_0_0_1px_rgba(217,70,239,0.15)]">
                    
                  </p>
                )}
                <p className={`text-xl font-bold tabular-nums ${riskTone}`}>Risk score: {prediction.riskScore}%</p>
                <p className={`font-semibold ${riskTone}`}>Status: {prediction.status}</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{prediction.recommendation}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 pt-1">
                  {prediction.isPresentationDemo
                    ? 'Live anomaly alerts still follow the real AI + simulation pipeline in the background.'
                    : 'Alerts fire when the AI flags anomalies; MEDIUM+ plays audio.mp3 once per alert.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="w-full lg:w-96 shrink-0 space-y-4">
          <div className={`${cardSurface} p-5`}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <Bell size={18} className="text-amber-600 dark:text-amber-400" aria-hidden />
              Live alerts
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Severity-colored cards; critical cards pulse. Medium+ triggers <code className="text-[10px] bg-slate-100 dark:bg-black px-1 rounded"></code>.
            </p>

            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-4 py-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-cyan-500/20">
                No active alerts
              </p>
            ) : (
              <ul className="space-y-3 mt-4 max-h-[min(520px,55vh)] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={`rounded-xl border border-slate-200/80 dark:border-cyan-500/35 p-3 shadow-md transition-transform duration-200 hover:scale-[1.01] ${severityCardClasses(alert.severity)}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${severityBadgeClasses(alert.severity)}`}>
                        {alert.severity || 'ALERT'}
                      </span>
                      <time
                        className="text-[11px] text-slate-600 dark:text-zinc-400 whitespace-nowrap tabular-nums"
                        dateTime={parseBackendDateTime(alert.createdAt)?.toISOString() ?? undefined}
                      >
                        {formatAlertTime(alert.createdAt) || '—'}
                      </time>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 mb-1">{patientLabel(alert)}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1">{alert.vitalType || 'Vital'}</p>
                    <p className="text-sm leading-snug">{alertBody(alert)}</p>
                    <button
                      type="button"
                      onClick={() => resolveAlert(alert.id)}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-teal-400 dark:hover:text-teal-300 underline-offset-2 hover:underline"
                    >
                      Resolve
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${cardSurface} p-5`}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">Resolved alerts</h2>

            {resolvedAlerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-3">No resolved alerts yet</p>
            ) : (
              <ul className="space-y-3 mt-3 max-h-[280px] overflow-y-auto text-sm">
                {resolvedAlerts.map((alert) => (
                  <li key={alert.id} className="border-b border-slate-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between gap-2 items-start text-[11px] mb-1">
                      <span className="font-medium text-slate-800 dark:text-zinc-100">{patientLabel(alert)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5 mb-2 tabular-nums">
                      <p>
                        <span className="text-slate-400 dark:text-zinc-500">Opened: </span>
                        {formatAlertTime(alert.createdAt) || '—'}
                      </p>
                      <p>
                        <span className="text-slate-400 dark:text-zinc-500">Resolved: </span>
                        {formatAlertTime(alert.resolvedAt) || '—'}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">{alert.vitalType}</p>
                    <p className="text-slate-600 dark:text-zinc-400">{alertBody(alert)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
