import React, { useState } from 'react';
import { Search, Printer, AlertCircle } from 'lucide-react';
import { useBoxStore } from '../store/boxStore';
import { useAuthStore } from '../store/authStore';
import { Box } from '../types';

const PrintSheets: React.FC = () => {
  const { user } = useAuthStore();
  const { getBoxes } = useBoxStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [error, setError] = useState<string>('');
  
  // Get boxes for the current branch
  const boxes = user?.branch ? getBoxes(user.branch) : [];
  
  // Filter boxes based on search query
  const filteredBoxes = searchQuery
    ? boxes.filter(box => 
        box.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        box.items.some(item => 
          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : boxes;

  const handlePrint = () => {
    if (!selectedBox) return;
    window.print();
  };

  return (
    <>
      {/* Regular view (hidden during print) */}
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Print Sheets
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generate and print box content sheets
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {/* Search Section */}
          <div className="p-6">
            <div className="max-w-xl">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Box
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Enter box number or SKU"
                />
              </div>

              {/* Search Results */}
              {filteredBoxes.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Boxes
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredBoxes.map((box) => (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBox(box)}
                        className={`relative rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                          selectedBox?.id === box.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Box {box.number}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {box.items.length} items
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && filteredBoxes.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No boxes found
                </p>
              )}
            </div>
          </div>

          {/* Selected Box Preview */}
          {selectedBox && (
            <div className="p-6">
              <div className="max-w-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Box {selectedBox.number} Contents
                  </h3>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </button>
                </div>

                <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">SKU</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {selectedBox.items.map((item) => (
                        <tr key={item.sku}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{item.sku}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{item.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print layout (hidden during normal view) */}
      {selectedBox && (
        <div className="hidden print:block p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Box Content Sheet</h1>
            <p className="text-lg mt-2">Box {selectedBox.number}</p>
            <p className="text-sm text-gray-600 mt-1">
              Branch: {user?.branch} | Category: {selectedBox.category}
            </p>
            <p className="text-sm text-gray-600">
              Printed on: {new Date().toLocaleDateString()}
            </p>
          </div>

          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">SKU</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Product Name</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Check</th>
              </tr>
            </thead>
            <tbody>
              {selectedBox.items.map((item, index) => (
                <tr key={item.sku} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-2">{item.sku}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="w-6 h-6 border border-gray-400 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <p className="font-semibold mb-4">Notes:</p>
              <div className="border-b border-gray-300 h-24"></div>
            </div>
            <div>
              <p className="font-semibold mb-4">Verification:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-2">Prepared by:</p>
                  <div className="border-b border-gray-300 h-16"></div>
                  <p className="text-sm mt-1">Name & Date</p>
                </div>
                <div>
                  <p className="text-sm mb-2">Verified by:</p>
                  <div className="border-b border-gray-300 h-16"></div>
                  <p className="text-sm mt-1">Name & Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrintSheets;