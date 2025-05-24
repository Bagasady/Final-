import { create } from 'zustand';
import { Product } from '../types';

interface ProductState {
  products: Product[];
  getProducts: (branch?: string) => Product[];
  getProduct: (sku: string) => Product | undefined;
  uploadCSV: (branch: string, csvData: string) => Promise<{ added: number; updated: number }>;
  searchProducts: (query: string, branch?: string) => Product[];
  compareInventory: (branch: string) => { 
    missing: Product[]; 
    surplus: Product[]; 
    matched: Product[] 
  };
}

// Mock initial products
const initialProducts: Product[] = [
  {
    sku: 'SKU001',
    name: 'Product One',
    price: 15000,
    rackNumber: 'R101',
    branch: 'Branch 1',
    stockNew: 100
  },
  {
    sku: 'SKU002',
    name: 'Product Two',
    price: 25000,
    rackNumber: 'R102',
    branch: 'Branch 1',
    stockNew: 50
  },
  {
    sku: 'SKU003',
    name: 'Product Three',
    price: 10000,
    rackNumber: 'R201',
    branch: 'Branch 1',
    stockNew: 75
  }
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  
  getProducts: (branch?: string) => {
    const { products } = get();
    if (branch) {
      return products.filter(product => product.branch === branch);
    }
    return products;
  },
  
  getProduct: (sku: string) => {
    const { products } = get();
    return products.find(product => product.sku === sku);
  },
  
  uploadCSV: async (branch, csvData) => {
    // Parse CSV data (simple implementation)
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const skuIndex = headers.indexOf('SKU');
    const rackIndex = headers.indexOf('No Rak');
    const nameIndex = headers.indexOf('Nama Barang');
    const priceIndex = headers.indexOf('Harga');
    const stockIndex = headers.indexOf('Stock Baru');
    
    if (skuIndex === -1 || rackIndex === -1 || nameIndex === -1 || 
        priceIndex === -1 || stockIndex === -1) {
      throw new Error('Invalid CSV format. Required columns missing.');
    }
    
    let added = 0;
    let updated = 0;
    
    // Process each line (skip header)
    const newProducts = lines.slice(1).map(line => {
      const values = line.split(',');
      
      return {
        sku: values[skuIndex].trim(),
        name: values[nameIndex].trim(),
        price: parseFloat(values[priceIndex].trim()),
        rackNumber: values[rackIndex].trim(),
        branch,
        stockNew: parseInt(values[stockIndex].trim(), 10)
      };
    });
    
    set(state => {
      const updatedProducts = [...state.products];
      
      newProducts.forEach(newProduct => {
        const existingIndex = updatedProducts.findIndex(
          p => p.sku === newProduct.sku && p.branch === branch
        );
        
        if (existingIndex >= 0) {
          updatedProducts[existingIndex] = newProduct;
          updated++;
        } else {
          updatedProducts.push(newProduct);
          added++;
        }
      });
      
      return { products: updatedProducts };
    });
    
    return { added, updated };
  },
  
  searchProducts: (query, branch) => {
    const { products } = get();
    const filteredProducts = branch 
      ? products.filter(product => product.branch === branch) 
      : products;
      
    if (!query) return filteredProducts;
    
    const lowerQuery = query.toLowerCase();
    return filteredProducts.filter(product => 
      product.sku.toLowerCase().includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery)
    );
  },
  
  compareInventory: (branch) => {
    const { products } = get();
    const branchProducts = products.filter(p => p.branch === branch);
    
    // This is a placeholder for real comparison logic
    // In a real implementation, this would compare CSV data with actual inventory
    const missing = branchProducts.filter((_, index) => index % 5 === 0);
    const surplus = branchProducts.filter((_, index) => index % 7 === 0);
    const matched = branchProducts.filter((p) => 
      !missing.includes(p) && !surplus.includes(p)
    );
    
    return { missing, surplus, matched };
  }
}));