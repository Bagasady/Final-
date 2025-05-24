import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useActivityStore } from '../../store/activityStore';
import { useAuthStore } from '../../store/authStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ActivityChart: React.FC = () => {
  const { user } = useAuthStore();
  const { logs } = useActivityStore();
  const [period, setPeriod] = React.useState<'day' | 'week' | 'month'>('week');
  
  const branch = user?.role === 'store' ? user.branch : undefined;
  
  // Filter logs by branch if needed
  const filteredLogs = branch 
    ? logs.filter(log => log.branch === branch)
    : logs;
  
  // Prepare data based on selected period
  const prepareChartData = () => {
    const now = new Date();
    let labels: string[] = [];
    let inputData: number[] = [];
    let refillData: number[] = [];
    
    if (period === 'day') {
      // Last 24 hours by hour
      labels = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now);
        hour.setHours(now.getHours() - 23 + i, 0, 0, 0);
        return hour.toLocaleTimeString([], { hour: '2-digit' });
      });
      
      inputData = labels.map((_, hourIndex) => {
        const hour = new Date(now);
        hour.setHours(now.getHours() - 23 + hourIndex, 0, 0, 0);
        
        const nextHour = new Date(hour);
        nextHour.setHours(hour.getHours() + 1);
        
        return filteredLogs.filter(log => 
          log.action === 'input' && 
          new Date(log.timestamp) >= hour && 
          new Date(log.timestamp) < nextHour
        ).length;
      });
      
      refillData = labels.map((_, hourIndex) => {
        const hour = new Date(now);
        hour.setHours(now.getHours() - 23 + hourIndex, 0, 0, 0);
        
        const nextHour = new Date(hour);
        nextHour.setHours(hour.getHours() + 1);
        
        return filteredLogs.filter(log => 
          log.action === 'refill' && 
          new Date(log.timestamp) >= hour && 
          new Date(log.timestamp) < nextHour
        ).length;
      });
    } else if (period === 'week') {
      // Last 7 days
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - 6 + i);
        return date.toLocaleDateString([], { weekday: 'short' });
      });
      
      inputData = labels.map((_, dayIndex) => {
        const day = new Date(now);
        day.setDate(now.getDate() - 6 + dayIndex);
        day.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        
        return filteredLogs.filter(log => 
          log.action === 'input' && 
          new Date(log.timestamp) >= day && 
          new Date(log.timestamp) < nextDay
        ).length;
      });
      
      refillData = labels.map((_, dayIndex) => {
        const day = new Date(now);
        day.setDate(now.getDate() - 6 + dayIndex);
        day.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        
        return filteredLogs.filter(log => 
          log.action === 'refill' && 
          new Date(log.timestamp) >= day && 
          new Date(log.timestamp) < nextDay
        ).length;
      });
    } else if (period === 'month') {
      // Last 30 days, grouped by week
      labels = Array.from({ length: 4 }, (_, i) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (21 - i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString([], { day: 'numeric' })}`;
      });
      
      inputData = labels.map((_, weekIndex) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (21 - weekIndex * 7));
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        return filteredLogs.filter(log => 
          log.action === 'input' && 
          new Date(log.timestamp) >= startDate && 
          new Date(log.timestamp) <= endDate
        ).length;
      });
      
      refillData = labels.map((_, weekIndex) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (21 - weekIndex * 7));
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        return filteredLogs.filter(log => 
          log.action === 'refill' && 
          new Date(log.timestamp) >= startDate && 
          new Date(log.timestamp) <= endDate
        ).length;
      });
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Input Items',
          data: inputData,
          backgroundColor: 'rgba(37, 99, 235, 0.5)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Refill Items',
          data: refillData,
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = prepareChartData();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Input vs Refill Activities',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Activity Analysis
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'day'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'week'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'month'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      <div className="h-80">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

export default ActivityChart;