import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DashboardStats from '../components/Dashboard/DashboardStats';
import { useAuthStore } from '../store/authStore';
import { useBoxStore } from '../store/boxStore';
import { useActivityStore } from '../store/activityStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { getBoxes } = useBoxStore();
  const { getLogs } = useActivityStore();
  const [period, setPeriod] = React.useState<'week' | 'month'>('week');
  
  // Get data based on user role and branch
  const boxes = user?.branch ? getBoxes(user.branch) : getBoxes();
  const logs = user?.branch ? getLogs({ branch: user.branch }) : getLogs();
  
  // Calculate box statistics
  const activeBoxes = boxes.filter(box => box.items.length > 0);
  const totalSKUs = boxes.reduce((total, box) => total + box.items.length, 0);
  
  // Calculate SKUs per category
  const skusByCategory = {
    A: boxes.filter(box => box.category === 'A').reduce((total, box) => total + box.items.length, 0),
    B: boxes.filter(box => box.category === 'B').reduce((total, box) => total + box.items.length, 0),
    C: boxes.filter(box => box.category === 'C').reduce((total, box) => total + box.items.length, 0)
  };
  
  // Calculate total refills this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const refillsThisMonth = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return log.action === 'refill' && 
           logDate.getMonth() === currentMonth && 
           logDate.getFullYear() === currentYear;
  }).length;

  // Prepare chart data based on selected period
  const prepareChartData = () => {
    const now = new Date();
    let labels: string[] = [];
    let refillData: number[] = [];
    
    if (period === 'week') {
      // Last 7 days
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - 6 + i);
        return date.toLocaleDateString([], { weekday: 'short' });
      });
      
      refillData = labels.map((_, dayIndex) => {
        const day = new Date(now);
        day.setDate(now.getDate() - 6 + dayIndex);
        day.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        
        return logs.filter(log => 
          log.action === 'refill' && 
          new Date(log.timestamp) >= day && 
          new Date(log.timestamp) < nextDay
        ).length;
      });
    } else {
      // Last 30 days by week
      labels = Array.from({ length: 4 }, (_, i) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (21 - i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString([], { day: 'numeric' })}`;
      });
      
      refillData = labels.map((_, weekIndex) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (21 - weekIndex * 7));
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        return logs.filter(log => 
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
          label: 'Refills',
          data: refillData,
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        }
      ]
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
        text: 'Refill Activities',
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === 'store' 
              ? `Overview of ${user.branch} inventory management`
              : 'Overview of all branches inventory management'}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <DashboardStats />
      
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Boxes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {activeBoxes.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total SKUs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {totalSKUs}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Refills This Month
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {refillsThisMonth}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    SKUs by Category
                  </dt>
                  <dd className="mt-2">
                    <div className="flex space-x-2 text-sm">
                      <span className="text-blue-600 dark:text-blue-400">A: {skusByCategory.A}</span>
                      <span className="text-green-600 dark:text-green-400">B: {skusByCategory.B}</span>
                      <span className="text-yellow-600 dark:text-yellow-400">C: {skusByCategory.C}</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refill Chart */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Refill Analysis
          </h3>
          <div className="flex space-x-2">
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
    </div>
  );
};

export default Dashboard;