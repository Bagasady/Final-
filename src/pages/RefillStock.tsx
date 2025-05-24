import React, { useState } from 'react';
import { Search, ShoppingCart, AlertCircle } from 'lucide-react';
import { useBoxStore } from '../store/boxStore';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { Box, BoxItem } from '../types';

const RefillStock: React.FC = () => {
  const { user } = useAuthStore();
  const { searchBoxesBySku, updateItemQuantity, getBox } = useBoxStore();
  const { addLog } = useActivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [selectedItem, setSelectedItem] = useState<BoxItem | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Search results
  const searchResults = searchQuery 
    ? searchBoxesBySku(searchQuery, user?.branch)
    : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setError('');
    setSuccess('');
    setSelectedBox(null);
    setSelectedItem(null);
  };

  const handleBoxSelect = (box: Box) => {
    setSelectedBox(box);
    setSelectedItem(null);
    setSearchQuery('');
    setError('');
    setRefillQuantity(1);
  };

  const handleItemSelect = (item: BoxItem) => {
    setSelectedItem(item);
    setRefillQuantity(1);
    setError('');
  };

  const handleRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBox || !selectedItem || !user?.branch) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate refill quantity
      if (refillQuantity <= 0) {
        throw new Error('Refill quantity must be greater than 0');
      }

      if (refillQuantity > selectedItem.quantity) {
        throw new Error('Refill quantity cannot exceed available stock');
      }

      // Update item quantity in box
      const newQuantity = selectedItem.quantity - refillQuantity;
      updateItemQuantity(selectedBox.id, selectedItem.sku, newQuantity);

      // Log the activity
      addLog({
        username: user.username,
        branch: user.branch,
        action: 'refill',
        details: `Refilled ${refillQuantity} units of ${selectedItem.sku} from box ${selectedBox.number}`,
        sku: selectedItem.sku,
        boxId: selectedBox.id,
        category: selectedBox.category
      });

      // Refresh box data
      const updatedBox = getBox(selectedBox.id);
      setSelectedBox(updatedBox || null);
      setSelectedItem(null);
      
      setSuccess(`Successfully refilled ${refillQuantity} units from box ${selectedBox.number}`);
      setRefillQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Refill Stock
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Refill items from keepstock to sales area
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {/* Search Section */}
        <div className="p-6">
          <div className="max-w-xl">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search by SKU
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
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                placeholder="Enter SKU to search"
              />
            </div>

            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((box) => (
                    <li
                      key={box.id}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleBoxSelect(box)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Box {box.number}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {box.items.length} items
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Category {box.category}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No boxes found with this SKU
              </p>
            )}
          </div>
        </div>

        {/* Selected Box Details */}
        {selectedBox && (
          <div className="p-6">
            <div className="max-w-xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Box {selectedBox.number} Contents
              </h3>
              
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedBox.items.map((item) => (
                    <li
                      key={item.sku}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        selectedItem?.sku === item.sku ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.sku}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.quantity} units
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Refill Form */}
        {selectedBox && selectedItem && (
          <div className="p-6">
            <form onSubmit={handleRefill} className="max-w-xl space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Refill Quantity (max: {selectedItem.quantity})
                </label>
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  min="1"
                  max={selectedItem.quantity}
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || refillQuantity <= 0 || refillQuantity > selectedItem.quantity}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Refill Stock'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillStock;