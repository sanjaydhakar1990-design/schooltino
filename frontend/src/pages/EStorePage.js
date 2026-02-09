import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Plus, Search, Filter, Package,
  Tag, Eye, Edit, Trash2, ShoppingCart, Star
} from 'lucide-react';

const sampleProducts = [
  { id: 1, name: 'School Notebook (200 pages)', price: 120, stock: 250, category: 'Stationery', status: 'active', orders: 45 },
  { id: 2, name: 'School Uniform - Summer', price: 850, stock: 120, category: 'Uniform', status: 'active', orders: 32 },
  { id: 3, name: 'Science Lab Kit - Class 10', price: 450, stock: 80, category: 'Lab Equipment', status: 'active', orders: 28 },
  { id: 4, name: 'School Bag - Standard', price: 1200, stock: 45, category: 'Accessories', status: 'active', orders: 18 },
  { id: 5, name: 'Mathematics Reference Book', price: 350, stock: 0, category: 'Books', status: 'out_of_stock', orders: 65 },
  { id: 6, name: 'School ID Card Lanyard', price: 50, stock: 500, category: 'Accessories', status: 'active', orders: 120 },
  { id: 7, name: 'Winter Sweater - Navy Blue', price: 950, stock: 90, category: 'Uniform', status: 'active', orders: 22 },
  { id: 8, name: 'Art & Craft Kit', price: 280, stock: 60, category: 'Stationery', status: 'active', orders: 15 },
];

export default function EStorePage() {
  const { schoolData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Stationery', 'Uniform', 'Books', 'Lab Equipment', 'Accessories'];

  const storeStats = [
    { label: 'Total Products', value: '48', icon: Package, color: 'gradient-card-blue' },
    { label: 'Total Orders', value: '345', icon: ShoppingCart, color: 'gradient-card-purple' },
    { label: 'Revenue', value: '₹1.2L', icon: Tag, color: 'gradient-card-teal' },
    { label: 'Active Items', value: '42', icon: Star, color: 'gradient-card-orange' },
  ];

  const filteredProducts = sampleProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School e-Store</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage products, uniforms, books & more</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {storeStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
              <div className={`h-32 flex items-center justify-center ${
                product.category === 'Stationery' ? 'bg-blue-50' :
                product.category === 'Uniform' ? 'bg-purple-50' :
                product.category === 'Books' ? 'bg-teal-50' :
                product.category === 'Lab Equipment' ? 'bg-orange-50' : 'bg-pink-50'
              }`}>
                <Package className={`w-12 h-12 ${
                  product.category === 'Stationery' ? 'text-blue-300' :
                  product.category === 'Uniform' ? 'text-purple-300' :
                  product.category === 'Books' ? 'text-teal-300' :
                  product.category === 'Lab Equipment' ? 'text-orange-300' : 'text-pink-300'
                }`} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    product.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {product.status === 'active' ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className="text-xs text-gray-400">{product.orders} orders</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{product.category} &middot; {product.stock} in stock</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-50 rounded-lg" title="View">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-50 rounded-lg" title="Edit">
                      <Edit className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
