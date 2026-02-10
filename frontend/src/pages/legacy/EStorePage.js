import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  ShoppingBag, Plus, Search, Package,
  Tag, Edit, Trash2, ShoppingCart, Loader2, X, Minus
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = ['Books', 'Uniforms', 'Stationery', 'Sports', 'Other'];

const categoryColors = {
  Books: 'bg-teal-50 text-teal-600',
  Uniforms: 'bg-purple-50 text-purple-600',
  Stationery: 'bg-blue-50 text-blue-600',
  Sports: 'bg-orange-50 text-orange-600',
  Other: 'bg-pink-50 text-pink-600'
};

const categoryBg = {
  Books: 'from-teal-100 to-emerald-50',
  Uniforms: 'from-purple-100 to-indigo-50',
  Stationery: 'from-blue-100 to-sky-50',
  Sports: 'from-orange-100 to-amber-50',
  Other: 'from-pink-100 to-rose-50'
};

export default function EStorePage() {
  const { user, schoolId } = useAuth();
  const sId = schoolId || user?.school_id || '';
  const isAdmin = ['director', 'principal', 'vice_principal', 'admin'].includes(user?.role);

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, out_of_stock: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Stationery',
    description: '',
    stock: '',
    image_url: ''
  });

  const fetchProducts = useCallback(async () => {
    if (!sId) return;
    setLoading(true);
    try {
      const params = { school_id: sId };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      
      const res = await axios.get(`${API}/e-store/products`, { params });
      setProducts(res.data?.products || []);
      setStats(res.data?.stats || { total: 0, active: 0, out_of_stock: 0 });
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [sId, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', category: 'Stationery', description: '', stock: '', image_url: '' });
    setShowProductDialog(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      description: product.description || '',
      stock: String(product.stock),
      image_url: product.image_url || ''
    });
    setShowProductDialog(true);
  };

  const handleSubmitProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Name aur price required hai');
      return;
    }
    setSubmitting(true);
    try {
      if (editingProduct) {
        await axios.put(`${API}/e-store/products/${editingProduct.id}`, {
          name: productForm.name,
          price: parseFloat(productForm.price),
          category: productForm.category,
          description: productForm.description,
          stock: parseInt(productForm.stock) || 0,
          image_url: productForm.image_url || null
        });
        toast.success('Product updated! / प्रोडक्ट अपडेट हो गया!');
      } else {
        await axios.post(`${API}/e-store/products`, {
          school_id: sId,
          name: productForm.name,
          price: parseFloat(productForm.price),
          category: productForm.category,
          description: productForm.description,
          stock: parseInt(productForm.stock) || 0,
          image_url: productForm.image_url || null
        });
        toast.success('Product added! / प्रोडक्ट जोड़ दिया गया!');
      }
      setShowProductDialog(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product? / यह प्रोडक्ट डिलीट करें?')) return;
    try {
      await axios.delete(`${API}/e-store/products/${productId}?school_id=${sId}`);
      toast.success('Product deleted / प्रोडक्ट डिलीट हो गया');
      fetchProducts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error('Stock limit reached');
          return prev;
        }
        return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(c => c.id !== productId));
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id !== productId) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > c.stock) return c;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <div className="space-y-6" data-testid="e-store-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            School e-Store / स्कूल ई-स्टोर
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Products, Uniforms, Books & more / किताबें, यूनिफॉर्म और बहुत कुछ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCart(true)} className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
          {isAdmin && (
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Products / कुल प्रोडक्ट</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">In Stock / उपलब्ध</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Out of Stock / स्टॉक ख़त्म</p>
            <p className="text-2xl font-bold text-red-600">{stats.out_of_stock}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products... / प्रोडक्ट खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === 'all' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No products found / कोई प्रोडक्ट नहीं</p>
            {isAdmin && (
              <Button onClick={openAddDialog} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className={`h-32 bg-gradient-to-br ${categoryBg[product.category] || 'from-slate-100 to-gray-50'} flex items-center justify-center`}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    product.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${categoryColors[product.category] || ''}`}>
                    {product.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-slate-400 mb-2 line-clamp-1">{product.description}</p>
                )}
                <p className="text-xs text-slate-400 mb-3">Stock: {product.stock}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addToCart(product)}>
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEditDialog(product)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-500 hover:text-red-700" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product / प्रोडक्ट एडिट करें' : 'Add Product / प्रोडक्ट जोड़ें'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name / नाम *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(f => ({ ...f, name: e.target.value }))}
                placeholder="School Notebook"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price / कीमत (₹) *</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="120"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stock / स्टॉक</Label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Category / श्रेणी</Label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description / विवरण</Label>
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Product details..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={productForm.image_url}
                onChange={(e) => setProductForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmitProduct} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduct ? 'Update' : 'Add Product'}
              </Button>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Cart / कार्ट ({cartCount} items)
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Cart is empty / कार्ट खाली है</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">₹{item.price} × {item.qty} = ₹{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateCartQty(item.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateCartQty(item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 ml-1" onClick={() => removeFromCart(item.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold text-lg">Total / कुल: ₹{cartTotal}</span>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => { toast.success('Order placed! / ऑर्डर हो गया!'); setCart([]); setShowCart(false); }}>
                  Place Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
