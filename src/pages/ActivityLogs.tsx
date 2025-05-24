import React, { useState } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { ActivityLog } from '../types';

const ActivityLogs: React.FC = () => {
  const { user } = useAuthStore();
  const { getLogs } = useActivityStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<ActivityLog['action'] | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get logs based on user role and branch
  const logs = user?.role === 'admin' 
    ? getLogs()
    : getLogs({ branch: user?.branch });

  // Filter logs based on search query, action type, and date range
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery
      ? log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;

    const matchesAction = selectedAction === 'all' ? true : log.action === selectedAction;

    const matchesDateRange = (!startDate || new Date(log.timestamp) >= new Date(startDate)) &&
                           (!endDate || new Date(log.timestamp) <= new Date(endDate));

    return matchesSearch && matchesAction && matchesDateRange;
  });

  // Action type badge component
  const ActionBadge: React.FC<{ action: ActivityLog['action'] }> = ({ action }) => {
    const colors = {
      input: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      refill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      csv_upload: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[action]}`}>
        {action.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Activity Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track all system activities and changes
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Search by SKU or details"
                />
              </div>
            </div>

            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Type
              </label>
              <select
                id="action"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as ActivityLog['action'] | 'all')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Actions</option>
                <option value="input">Input</option>
                <option value="refill">Refill</option>
                <option value="update">Update</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="csv_upload">CSV Upload</option>
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                {user?.role === 'admin' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Branch
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {log.details}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.branch}
                    </td>
                  )}
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No activity logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;