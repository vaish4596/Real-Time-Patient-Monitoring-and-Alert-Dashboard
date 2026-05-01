import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, HeartPulse, LogOut } from 'lucide-react';
import axios from 'axios';

export default function DoctorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [vitalsData, setVitalsData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch active alerts
    axios.get('http://localhost:8080/api/alerts/active').then(res => {
      setAlerts(res.data);
    }).catch(err => console.error("Error fetching alerts", err));

    // WebSocket Connection
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-vitals'),
      onConnect: () => {
        client.subscribe('/topic/vitals/all', (message) => {
          const newVital = JSON.parse(message.body);
          setVitalsData(prevData => {
            const updated = [...prevData, newVital];
            if (updated.length > 50) updated.shift();
            return updated;
          });
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  const resolveAlert = async (alertId) => {
    await axios.post(`http://localhost:8080/api/alerts/${alertId}/resolve`);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-blue-600">
          <HeartPulse size={28} />
          <span className="text-xl font-bold text-slate-800">Doctor Dashboard</span>
        </div>
        <button onClick={logout} className="text-slate-500 hover:text-slate-700 flex items-center space-x-1">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex space-x-6">
        
        {/* Main Vitals Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Real-Time Vitals Feed</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="recordedAt" hide />
                  <YAxis yAxisId="left" domain={[50, 150]} />
                  <YAxis yAxisId="right" orientation="right" domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#ef4444" name="Heart Rate" isAnimationActive={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="bloodPressureSystolic" stroke="#3b82f6" name="BP Systolic" isAnimationActive={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="oxygenLevel" stroke="#10b981" name="Oxygen %" isAnimationActive={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 text-sm font-medium">Avg Heart Rate</h3>
              <p className="text-2xl font-bold text-slate-800">
                {vitalsData.length > 0 ? Math.round(vitalsData.reduce((acc, curr) => acc + curr.heartRate, 0) / vitalsData.length) : '--'} bpm
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 text-sm font-medium">Avg Oxygen Level</h3>
              <p className="text-2xl font-bold text-slate-800">
                {vitalsData.length > 0 ? Math.round(vitalsData.reduce((acc, curr) => acc + curr.oxygenLevel, 0) / vitalsData.length) : '--'} %
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 text-sm font-medium">Active Patients</h3>
              <p className="text-2xl font-bold text-slate-800">
                {new Set(vitalsData.map(v => v.patient?.id)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Sidebar */}
        <div className="w-80 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Alerts</h2>
              <Bell className="text-red-500" size={20} />
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-slate-500 text-sm">No active alerts.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-md">
                    <p className="text-sm font-semibold text-red-700">{alert.vitalType} Alert - Patient #{alert.patient.id}</p>
                    <p className="text-xs text-red-600 mt-1">{alert.alertMessage}</p>
                    <button 
                      onClick={() => resolveAlert(alert.id)}
                      className="mt-2 text-xs bg-white text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
