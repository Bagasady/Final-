import React, { useState } from 'react';
import { PackagePlus, Search, AlertCircle } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useBoxStore } from '../store/boxStore';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { Product, Box } from '../types';

const InputProduct: React.FC = () => {
  const { user } = useAuthStore();
  const { searchProducts } = useProductStore();
  const { addBox, addItemToBox, searchBoxesBySku, getNextBoxNumber } = useBoxStore();
  const { addLog } = useActivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<'A' | 'B' | 'C'>('A');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Search results
  const searchResults = searchQuery 
    ? searchProducts(searchQuery, user?.branch)
    : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setError('');
    setSuccess('');
    setSelectedProduct(null);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setError('');
    
    // Check if product already exists in a box
    const existingBoxes = searchBoxesBySku(product.sku, user?.branch);
    if (existingBoxes.length > 0) {
      const boxInfo = existingBoxes.map(box => box.number).join(', ');
      setError(`This SKU already exists in box(es): ${boxInfo}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user?.branch) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate quantity
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Check existing boxes for this SKU
      const existingBoxes = searchBoxesBySku(selectedProduct.sku, user.branch);
      let targetBox: Box;

      if (existingBoxes.length > 0) {
        // Use existing box
        targetBox = existingBoxes[0];
      } else {
        // Create new box
        targetBox = addBox(category, user.branch);
      }

      // Add item to box
      addItemToBox(targetBox.id, {
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        quantity,
        price: selectedProduct.price
      });

      // Log the activity
      addLog({
        username: user.username,
        branch: user.branch,
        action: 'input',
        details: `Added ${quantity} units of ${selectedProduct.sku} to box ${targetBox.number}`,
        sku: selectedProduct.sku,
        boxId: targetBox.id,
        category: targetBox.category
      });

      setSuccess(`Successfully added ${quantity} units to box ${targetBox.number}`);
      setSelectedProduct(null);
      setQuantity(1);
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
            Input Product
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add new products to keepstock boxes
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {/* Search Section */}
        <div className="p-6">
          <div className="max-w-xl">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Product by SKU or Name
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
                placeholder="Enter SKU or product name"
              />
            </div>

            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((product) => (
                    <li
                      key={product.sku}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.sku}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.name}</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rack: {product.rackNumber}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No products found
              </p>
            )}
          </div>
        </div>

        {/* Input Form */}
        {selectedProduct && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
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
                      <PackagePlus className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Selected Product
                </h3>
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedProduct.sku}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedProduct.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedProduct.price)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rack Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedProduct.rackNumber}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Box Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'A' | 'B' | 'C')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="A">Category A</option>
                  <option value="B">Category B</option>
                  <option value="C">Category C</option>
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !!error}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Add to Box'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputProduct;