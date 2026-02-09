import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Package, Plus, Search, Edit, Trash2, ArrowLeftRight,
  ShoppingCart, BarChart3, AlertTriangle, TrendingDown,
  Building2, ClipboardList, FileText, Download, Filter,
  CheckCircle, Clock, IndianRupee, Warehouse, Box
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const demoInventory = [
  { id: 1, name: 'Student Desk (Single)', category: 'Furniture', quantity: 120, unitPrice: 3500, location: 'Classroom Block A', status: 'In Stock' },
  { id: 2, name: 'Teacher Chair (Cushioned)', category: 'Furniture', quantity: 25, unitPrice: 4200, location: 'Staff Room', status: 'In Stock' },
  { id: 3, name: 'Whiteboard Marker (Box of 10)', category: 'Stationery', quantity: 45, unitPrice: 250, location: 'Store Room 1', status: 'In Stock' },
  { id: 4, name: 'A4 Paper Ream (500 sheets)', category: 'Stationery', quantity: 8, unitPrice: 350, location: 'Store Room 1', status: 'Low Stock' },
  { id: 5, name: 'Desktop Computer (HP)', category: 'Electronics', quantity: 30, unitPrice: 45000, location: 'Computer Lab', status: 'In Stock' },
  { id: 6, name: 'Projector (Epson)', category: 'Electronics', quantity: 5, unitPrice: 35000, location: 'AV Room', status: 'In Stock' },
  { id: 7, name: 'Cricket Bat (SG)', category: 'Sports', quantity: 15, unitPrice: 1800, location: 'Sports Room', status: 'In Stock' },
  { id: 8, name: 'Football (Nivia)', category: 'Sports', quantity: 3, unitPrice: 950, location: 'Sports Room', status: 'Low Stock' },
  { id: 9, name: 'Microscope (Labomed)', category: 'Lab', quantity: 20, unitPrice: 8500, location: 'Biology Lab', status: 'In Stock' },
  { id: 10, name: 'Beaker Set (500ml)', category: 'Lab', quantity: 6, unitPrice: 450, location: 'Chemistry Lab', status: 'Low Stock' },
];

const demoIssuedItems = [
  { id: 1, item: 'Whiteboard Marker (Box of 10)', issuedTo: 'Mr. Rajesh Kumar', department: 'Mathematics', quantity: 2, issueDate: '2026-02-01', returnDate: null, status: 'Issued' },
  { id: 2, item: 'A4 Paper Ream', issuedTo: 'Mrs. Sunita Verma', department: 'Office', quantity: 5, issueDate: '2026-01-28', returnDate: null, status: 'Issued' },
  { id: 3, item: 'Projector (Epson)', issuedTo: 'Mr. Anil Sharma', department: 'Science', quantity: 1, issueDate: '2026-02-05', returnDate: '2026-02-06', status: 'Returned' },
  { id: 4, item: 'Cricket Bat (SG)', issuedTo: 'Mr. Vikram Singh', department: 'Sports', quantity: 5, issueDate: '2026-02-03', returnDate: null, status: 'Issued' },
  { id: 5, item: 'Microscope (Labomed)', issuedTo: 'Dr. Meena Patel', department: 'Biology', quantity: 10, issueDate: '2026-02-07', returnDate: null, status: 'Issued' },
];

const demoPurchaseOrders = [
  { id: 'PO-2026-001', vendor: 'Sharma Furniture Works', items: 'Student Desks x 50', quantity: 50, amount: 175000, date: '2026-01-15', status: 'Received' },
  { id: 'PO-2026-002', vendor: 'National Book Depot', items: 'A4 Paper, Markers, Pens', quantity: 100, amount: 45000, date: '2026-01-20', status: 'Ordered' },
  { id: 'PO-2026-003', vendor: 'Gupta Electronics', items: 'Projector x 2, HDMI Cables', quantity: 4, amount: 72000, date: '2026-02-01', status: 'Draft' },
  { id: 'PO-2026-004', vendor: 'Sports India Pvt Ltd', items: 'Cricket Kit, Footballs, Badminton', quantity: 25, amount: 38500, date: '2026-02-05', status: 'Ordered' },
  { id: 'PO-2026-005', vendor: 'Lab Instruments Co.', items: 'Beakers, Test Tubes, Chemicals', quantity: 80, amount: 28000, date: '2026-02-08', status: 'Paid' },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inventory, setInventory] = useState(demoInventory);
  const [issuedItems, setIssuedItems] = useState(demoIssuedItems);
  const [purchaseOrders, setPurchaseOrders] = useState(demoPurchaseOrders);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showPODialog, setShowPODialog] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', category: 'Furniture', quantity: '', unitPrice: '', location: '', status: 'In Stock' });
  const [issueForm, setIssueForm] = useState({ item: '', issuedTo: '', department: '', quantity: '' });
  const [poForm, setPoForm] = useState({ vendor: '', items: '', quantity: '', amount: '', status: 'Draft' });

  const categories = ['all', 'Furniture', 'Stationery', 'Electronics', 'Sports', 'Lab'];

  const totalStockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const lowStockItems = inventory.filter(i => i.status === 'Low Stock');
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Ordered' || po.status === 'Draft');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    if (!itemForm.name || !itemForm.quantity) {
      toast.error('Item name और quantity ज़रूरी है');
      return;
    }
    setInventory(prev => [...prev, {
      id: Date.now(),
      ...itemForm,
      quantity: parseInt(itemForm.quantity),
      unitPrice: parseInt(itemForm.unitPrice) || 0,
    }]);
    toast.success('Item added successfully! नया आइटम जोड़ा गया');
    setShowAddItemDialog(false);
    setItemForm({ name: '', category: 'Furniture', quantity: '', unitPrice: '', location: '', status: 'In Stock' });
  };

  const handleIssueItem = () => {
    if (!issueForm.item || !issueForm.issuedTo || !issueForm.quantity) {
      toast.error('सभी fields भरना ज़रूरी है');
      return;
    }
    setIssuedItems(prev => [...prev, {
      id: Date.now(),
      ...issueForm,
      quantity: parseInt(issueForm.quantity),
      issueDate: new Date().toISOString().split('T')[0],
      returnDate: null,
      status: 'Issued',
    }]);
    toast.success(`${issueForm.item} issued to ${issueForm.issuedTo}`);
    setShowIssueDialog(false);
    setIssueForm({ item: '', issuedTo: '', department: '', quantity: '' });
  };

  const handleReturnItem = (id) => {
    setIssuedItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Returned', returnDate: new Date().toISOString().split('T')[0] } : i));
    toast.success('Item returned successfully! आइटम वापस किया गया');
  };

  const handleCreatePO = () => {
    if (!poForm.vendor || !poForm.items || !poForm.amount) {
      toast.error('Vendor, items और amount ज़रूरी है');
      return;
    }
    setPurchaseOrders(prev => [...prev, {
      id: `PO-2026-${String(prev.length + 1).padStart(3, '0')}`,
      ...poForm,
      quantity: parseInt(poForm.quantity) || 1,
      amount: parseInt(poForm.amount),
      date: new Date().toISOString().split('T')[0],
    }]);
    toast.success('Purchase Order created! खरीद आदेश बनाया गया');
    setShowPODialog(false);
    setPoForm({ vendor: '', items: '', quantity: '', amount: '', status: 'Draft' });
  };

  const categoryStockValue = categories.filter(c => c !== 'all').map(cat => {
    const items = inventory.filter(i => i.category === cat);
    const value = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    return { category: cat, value, count: items.length };
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-600 to-zinc-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Warehouse className="w-8 h-8" />
              Inventory Management
            </h1>
            <p className="text-slate-200 mt-2">
              Track, issue, and manage — complete stock control
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{inventory.length}</p>
              <p className="text-xs text-slate-200">Total Items</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">₹{(totalStockValue / 100000).toFixed(1)}L</p>
              <p className="text-xs text-slate-200">Stock Value</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{lowStockItems.length}</p>
              <p className="text-xs text-slate-200">Low Stock</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{pendingPOs.length}</p>
              <p className="text-xs text-slate-200">Pending POs</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Stock
          </TabsTrigger>
          <TabsTrigger value="issue" className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Issue/Return
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Purchase
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory items..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map(cat => (
                <Button key={cat} variant={categoryFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(cat)}>
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
            <Button onClick={() => setShowAddItemDialog(true)} className="bg-slate-700 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Item Name</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Category</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Qty</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Unit Price</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Total Value</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Location</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{item.name}</td>
                        <td className="py-3.5 px-4"><Badge variant="outline">{item.category}</Badge></td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-gray-900">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">{item.location}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issue" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Issue / Return Items (सामान जारी/वापसी)</h3>
            <Button onClick={() => setShowIssueDialog(true)} className="bg-slate-700 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Issue Item
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Item</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Issued To</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Department</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Qty</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Issue Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{item.item}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-700">{item.issuedTo}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">{item.department}</td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{item.issueDate}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={item.status === 'Returned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.status === 'Issued' && (
                            <Button size="sm" variant="outline" onClick={() => handleReturnItem(item.id)}>Return</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Purchase Orders (खरीद आदेश)</h3>
            <Button onClick={() => setShowPODialog(true)} className="bg-slate-700 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Create PO
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">PO No.</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Vendor</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Items</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Qty</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Amount</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-blue-600">{po.id}</td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{po.vendor}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{po.items}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-900">{po.quantity}</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-gray-900">₹{po.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{po.date}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={
                            po.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            po.status === 'Received' ? 'bg-blue-100 text-blue-700' :
                            po.status === 'Ordered' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {po.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Reports (स्टॉक रिपोर्ट)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryStockValue.map(cat => (
              <Card key={cat.category} className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <h4 className="text-sm font-semibold text-gray-700">{cat.category}</h4>
                  <p className="text-xl font-bold text-gray-900 mt-2">₹{(cat.value / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-400">{cat.count} items</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Low Stock Alerts (कम स्टॉक अलर्ट)
              </h4>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-gray-500">All items are well stocked!</p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category} · {item.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{item.quantity}</p>
                        <p className="text-xs text-red-500">remaining</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Monthly Consumption (मासिक खपत)
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { month: 'Sep', value: 45000 },
                  { month: 'Oct', value: 52000 },
                  { month: 'Nov', value: 38000 },
                  { month: 'Dec', value: 61000 },
                  { month: 'Jan', value: 55000 },
                  { month: 'Feb', value: 42000 },
                ].map(m => (
                  <div key={m.month} className="text-center">
                    <div className="bg-slate-100 rounded-lg mx-auto mb-2 relative overflow-hidden" style={{ height: '120px', width: '100%' }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-500 rounded-t-lg" style={{ height: `${(m.value / 61000) * 100}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{m.month}</p>
                    <p className="text-xs text-gray-400">₹{(m.value / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item (नया आइटम जोड़ें)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select value={itemForm.category} onChange={(e) => setItemForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="Furniture">Furniture</option>
                <option value="Stationery">Stationery</option>
                <option value="Electronics">Electronics</option>
                <option value="Sports">Sports</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={itemForm.quantity} onChange={(e) => setItemForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (₹)</Label>
                <Input type="number" value={itemForm.unitPrice} onChange={(e) => setItemForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={itemForm.location} onChange={(e) => setItemForm(f => ({ ...f, location: e.target.value }))} placeholder="Store Room 1" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={itemForm.status} onChange={(e) => setItemForm(f => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <Button onClick={handleAddItem} className="w-full bg-slate-700 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Item (सामान जारी करें)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <select value={issueForm.item} onChange={(e) => setIssueForm(f => ({ ...f, item: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="">Select Item</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.name}>{item.name} (Qty: {item.quantity})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Issue To (किसको)</Label>
              <Input value={issueForm.issuedTo} onChange={(e) => setIssueForm(f => ({ ...f, issuedTo: e.target.value }))} placeholder="Staff name" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={issueForm.department} onChange={(e) => setIssueForm(f => ({ ...f, department: e.target.value }))} placeholder="Department" />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={issueForm.quantity} onChange={(e) => setIssueForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" />
            </div>
            <Button onClick={handleIssueItem} className="w-full bg-slate-700 hover:bg-slate-800">
              <ArrowLeftRight className="w-4 h-4 mr-2" /> Issue Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Purchase Order (खरीद आदेश)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input value={poForm.vendor} onChange={(e) => setPoForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor / Supplier name" />
            </div>
            <div className="space-y-2">
              <Label>Items Description</Label>
              <Input value={poForm.items} onChange={(e) => setPoForm(f => ({ ...f, items: e.target.value }))} placeholder="Items to order" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={poForm.quantity} onChange={(e) => setPoForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={poForm.amount} onChange={(e) => setPoForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={poForm.status} onChange={(e) => setPoForm(f => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="Draft">Draft</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <Button onClick={handleCreatePO} className="w-full bg-slate-700 hover:bg-slate-800">
              <ShoppingCart className="w-4 h-4 mr-2" /> Create PO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}