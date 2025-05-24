import React, { useState } from 'react';
import { BarChart2, TrendingUp, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useBoxStore } from '../store/boxStore';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { Bar } from 'react-chartjs-2';

const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const { getBoxes } = useBoxStore();
  const { getLogs } = useActivityStore();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>(user?.role === 'store' ? (user.branch || 'all') : 'all');

  // Get data based on user role and selected branch
  const boxes = selectedBranch === 'all' ? getBoxes() : getBoxes(selectedBranch);
  const logs = selectedBranch === 'all' ? getLogs() : getLogs({ branch: selectedBranch });

  // Calculate metrics
  const totalBoxes = boxes.length;
  const totalItems = boxes.reduce((sum, box) => 
    sum + box.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  const refillsToday = logs.filter(log => 
    log.action === 'refill' && 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  ).length;

  // Calculate refill trend (compare with previous period)
  const getPreviousPeriodRefills = () => {
    const now = new Date();
    const today = now.getDate();
    const previousPeriodLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (timeframe === 'day') {
        return logDate.getDate() === today - 1;
      } else if (timeframe === 'week') {
        return logDate >= new Date(now.setDate(today - 14)) && 
               logDate < new Date(now.setDate(today - 7));
      } else {
        return logDate >= new Date(now.setMonth(now.getMonth() - 2)) && 
               logDate < new Date(now.setMonth(now.getMonth() - 1));
      }
    });
    return previousPeriodLogs.length;
  };

  const currentPeriodRefills = logs.filter(log => log.action === 'refill').length;
  const previousPeriodRefills = getPreviousPeriodRefills();
  const refillTrend = ((currentPeriodRefills - previousPeriodRefills) / previousPeriodRefills) * 100;

  // Prepare chart data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Refills',
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'New Items',
        data: [5, 15, 8, 12, 3, 4, 6],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Activity Overview'
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed analysis of inventory operations
          </p>
        </div>

        {user?.role !== 'store' && (
          <div className="mt-4 md:mt-0">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Branches</option>
              <option value="Branch 1">Branch 1</option>
              <option value="Branch 2">Branch 2</option>
              <option value="Branch 3">Branch 3</option>
            </select>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Boxes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {totalBoxes}
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
                <BarChart2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Items
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {totalItems}
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
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Refills Today
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {refillsToday}
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
                {refillTrend >= 0 ? (
                  <ArrowUpRight className="h-6 w-6 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Refill Trend
                  </dt>
                  <dd className="flex items-baseline">
                    <div className={`text-2xl font-semibold ${
                      refillTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {refillTrend.toFixed(1)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Activity Overview</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('day')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === 'day'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === 'week'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === 'month'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;