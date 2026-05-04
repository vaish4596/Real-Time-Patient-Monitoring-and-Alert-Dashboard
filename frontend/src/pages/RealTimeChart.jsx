import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

const RealTimeChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Heart Rate",
        data: [],
        borderColor: "red",
        tension: 0.4,
      },
      {
        label: "Oxygen %",
        data: [],
        borderColor: "green",
        tension: 0.4,
      },
      {
        label: "BP Systolic",
        data: [],
        borderColor: "blue",
        tension: 0.4,
      },
    ],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();

      const hr = Math.floor(60 + Math.random() * 60);
      const spo2 = Math.floor(90 + Math.random() * 10);
      const bp = Math.floor(100 + Math.random() * 40);

      setChartData((prev) => {
        const newLabels = [...prev.labels, time].slice(-10);

        return {
          labels: newLabels,
          datasets: [
            {
              ...prev.datasets[0],
              data: [...prev.datasets[0].data, hr].slice(-10),
            },
            {
              ...prev.datasets[1],
              data: [...prev.datasets[1].data, spo2].slice(-10),
            },
            {
              ...prev.datasets[2],
              data: [...prev.datasets[2].data, bp].slice(-10),
            },
          ],
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return <Line data={chartData} />;
};

export default RealTimeChart;