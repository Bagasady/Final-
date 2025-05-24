import React from 'react';
import { PackageOpen, ShoppingCart, BarChart2, ClipboardList, PackagePlus } from 'lucide-react';
import { useBoxStore } from '../../store/boxStore';
import { useActivityStore } from '../../store/activityStore';
import { useAuthStore } from '../../store/authStore';

const DashboardStats: React.FC = () => {
  const { user } = useAuthStore();
  const { boxes, getBoxes } = useBoxStore();
  const { logs, getLogs } = useActivityStore();
  
  const branch = user?.role === 'store' ? user.branch : undefined;
  const branchBoxes = getBoxes(branch);
  
  // Calculate stats
  const totalSKUs = branchBoxes.reduce(
    (total, box) => total + box.items.length, 0
  );
  
  const boxesA = branchBoxes.filter(box => box.category === 'A').length;
  const boxesB = branchBoxes.filter(box => box.category === 'B').length;
  const boxesC = branchBoxes.filter(box => box.category === 'C').length;
  
  const skuPerCategoryA = branchBoxes
    .filter(box => box.category === 'A')
    .reduce((total, box) => total + box.items.length, 0);
    
  const skuPerCategoryB = branchBoxes
    .filter(box => box.category === 'B')
    .reduce((total, box) => total + box.items.length, 0);
    
  const skuPerCategoryC = branchBoxes
    .filter(box => box.category === 'C')
    .reduce((total, box) => total + box.items.length, 0);
  
  // Get recent activity logs
  const recentLogs = branch 
    ? getLogs({ branch })
    : logs;

  // Stats cards data
  const stats = [
    {
      name: 'Total SKUs',
      value: totalSKUs,
      icon: PackageOpen,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Boxes',
      value: boxesA + boxesB + boxesC,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      name: 'Refills Today',
      value: logs.filter(log => 
        log.action === 'refill' && 
        new Date(log.timestamp).toDateString() === new Date().toDateString() &&
        (branch ? log.branch === branch : true)
      ).length,
      icon: BarChart2,
      color: 'bg-amber-500',
    },
    {
      name: 'Activity Logs',
      value: logs.filter(log => 
        branch ? log.branch === branch : true
      ).length,
      icon: ClipboardList,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Box Categories
            </h3>
            <div className="mt-5 grid grid-cols-3 gap-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 overflow-hidden shadow-sm rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Category A</div>
                <div className="mt-1 flex justify-between">
                  <div className="text-2xl font-semibold text-blue-800 dark:text-blue-300">{boxesA}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">{skuPerCategoryA} SKUs</div>
                </div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 overflow-hidden shadow-sm rounded-lg p-4">
                <div className="text-sm font-medium text-teal-600 dark:text-teal-400">Category B</div>
                <div className="mt-1 flex justify-between">
                  <div className="text-2xl font-semibold text-teal-800 dark:text-teal-300">{boxesB}</div>
                  <div className="text-sm text-teal-600 dark:text-teal-400">{skuPerCategoryB} SKUs</div>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 overflow-hidden shadow-sm rounded-lg p-4">
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Category C</div>
                <div className="mt-1 flex justify-between">
                  <div className="text-2xl font-semibold text-amber-800 dark:text-amber-300">{boxesC}</div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">{skuPerCategoryC} SKUs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <a href="/activity-logs" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </a>
            </div>
            <div className="mt-5 flow-root">
              <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {recentLogs.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.action === 'input' && (
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <PackagePlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {activity.action === 'refill' && (
                          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        {!['input', 'refill'].includes(activity.action) && (
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.details}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()} by {activity.username}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                
                {recentLogs.length === 0 && (
                  <li className="py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      No recent activities
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;