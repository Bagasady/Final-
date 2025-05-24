import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const AdminUpload: React.FC = () => {
  const { user } = useAuthStore();
  const { uploadCSV, compareInventory } = useProductStore();
  const { addLog } = useActivityStore();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<{
    missing: any[];
    surplus: any[];
    matched: any[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const branches = ['Branch 1', 'Branch 2', 'Branch 3'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBranch) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvData = e.target?.result as string;
        const result = await uploadCSV(selectedBranch, csvData);

        // Log the activity
        addLog({
          username: user?.username || '',
          branch: selectedBranch,
          action: 'csv_upload',
          details: `Uploaded CSV: ${result.added} new items, ${result.updated} updated items`,
        });

        // Compare inventory
        const comparisonResult = compareInventory(selectedBranch);
        setComparison(comparisonResult);

        toast.success('CSV uploaded successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to upload CSV');
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Upload CSV Data
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update product data by uploading CSV files
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="max-w-xl">
            <div className="mb-6">
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Branch
              </label>
              <select
                id="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        ref={fileInputRef}
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={!selectedBranch || loading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV file with headers: SKU, No Rak, Nama Barang, Harga, Stock Baru
                  </p>
                </div>
              </div>
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Processing...</span>
              </div>
            )}

            {comparison && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Inventory Comparison Results
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="ml-2 text-green-700 dark:text-green-400 font-medium">
                        Matched Items
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-300">
                      {comparison.matched.length}
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="ml-2 text-yellow-700 dark:text-yellow-400 font-medium">
                        Missing Items
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-300">
                      {comparison.missing.length}
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="ml-2 text-red-700 dark:text-red-400 font-medium">
                        Surplus Items
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-300">
                      {comparison.surplus.length}
                    </p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="mt-6 space-y-4">
                  {comparison.missing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Missing Items
                      </h4>
                      <div className="bg-white dark:bg-gray-700 shadow overflow-hidden rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                          {comparison.missing.map((item) => (
                            <li key={item.sku} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.name}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Rack: {item.rackNumber}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {comparison.surplus.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Surplus Items
                      </h4>
                      <div className="bg-white dark:bg-gray-700 shadow overflow-hidden rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                          {comparison.surplus.map((item) => (
                            <li key={item.sku} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.name}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Rack: {item.rackNumber}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;