import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  BookOpen, Plus, Search, Loader2, Edit, Trash2, BookMarked,
  Users, Calendar, AlertCircle, CheckCircle, Clock, BarChart3,
  QrCode, Printer, Download, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Book categories
const BOOK_CATEGORIES = [
  'Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Science', 
  'Mathematics', 'Hindi Literature', 'English Literature', 'History',
  'Geography', 'Computer Science', 'General Knowledge', 'Magazine', 'Newspaper'
];

export default function LibraryManagement() {
  const { schoolId, user } = useAuth();
  
  // Data states
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('books');
  const [search, setSearch] = useState('');
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  // Book form
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Textbook',
    publisher: '',
    year: new Date().getFullYear(),
    quantity: 1,
    available: 1,
    location: '',
    price: 0
  });
  
  // Issue form
  const [issueForm, setIssueForm] = useState({
    book_id: '',
    member_type: 'student',
    member_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [booksRes, issuedRes, studentsRes, staffRes] = await Promise.all([
        axios.get(`${API}/library/books?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/library/issued?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/students?school_id=${schoolId}&status=active`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/staff?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setBooks(booksRes.data || []);
      setIssuedBooks(issuedRes.data || []);
      setStudents(studentsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter books
  const filteredBooks = books.filter(book => 
    !search || 
    book.title?.toLowerCase().includes(search.toLowerCase()) ||
    book.author?.toLowerCase().includes(search.toLowerCase()) ||
    book.isbn?.includes(search)
  );

  // Save book
  const handleSaveBook = async () => {
    if (!bookForm.title) {
      toast.error('कृपया book title भरें');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = editingBook ? `${API}/library/books/${editingBook.id}` : `${API}/library/books`;
      const method = editingBook ? 'put' : 'post';
      
      await axios[method](endpoint, {
        ...bookForm,
        school_id: schoolId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(editingBook ? 'Book updated!' : 'Book added!');
      setShowBookDialog(false);
      setEditingBook(null);
      setBookForm({
        title: '', author: '', isbn: '', category: 'Textbook',
        publisher: '', year: new Date().getFullYear(), quantity: 1,
        available: 1, location: '', price: 0
      });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  // Issue book
  const handleIssueBook = async () => {
    if (!issueForm.book_id || !issueForm.member_id) {
      toast.error('कृपया book और member select करें');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/library/issue`, {
        ...issueForm,
        school_id: schoolId,
        issued_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Book issued successfully!');
      setShowIssueDialog(false);
      setIssueForm({
        book_id: '', member_type: 'student', member_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to issue book');
    } finally {
      setSaving(false);
    }
  };

  // Return book
  const handleReturnBook = async (issueId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/library/return/${issueId}`, {
        return_date: new Date().toISOString().split('T')[0],
        returned_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Book returned!');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to return book');
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/library/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Book deleted!');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  // Get member name
  const getMemberName = (memberType, memberId) => {
    if (memberType === 'student') {
      const student = students.find(s => s.id === memberId);
      return student?.name || memberId;
    } else {
      const staffMember = staff.find(s => s.id === memberId);
      return staffMember?.name || memberId;
    }
  };

  // Stats
  const totalBooks = books.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const availableBooks = books.reduce((sum, b) => sum + (b.available || 0), 0);
  const issuedCount = issuedBooks.filter(i => !i.returned).length;
  const overdueBooks = issuedBooks.filter(i => !i.returned && new Date(i.due_date) < new Date()).length;

  return (
    <div className="space-y-6" data-testid="library-management">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-600" />
            Library Management
          </h1>
          <p className="text-slate-500 mt-1">Book catalog, issue, return & tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowIssueDialog(true)} variant="outline" className="gap-2">
            <BookMarked className="w-4 h-4" />
            Issue Book
          </Button>
          <Button onClick={() => setShowBookDialog(true)} className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Plus className="w-4 h-4" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Books</p>
              <p className="text-2xl font-bold">{totalBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-2xl font-bold text-green-600">{availableBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Issued</p>
              <p className="text-2xl font-bold text-blue-600">{issuedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueBooks}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="books" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Books ({books.length})
          </TabsTrigger>
          <TabsTrigger value="issued" className="gap-2">
            <BookMarked className="w-4 h-4" />
            Issued ({issuedCount})
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Book Catalog</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search books..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : filteredBooks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map(book => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            {book.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{book.isbn || '-'}</TableCell>
                        <TableCell className="text-center">{book.quantity}</TableCell>
                        <TableCell className="text-center">
                          <span className={book.available > 0 ? 'text-green-600' : 'text-red-600'}>
                            {book.available}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingBook(book);
                                setBookForm(book);
                                setShowBookDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => handleDeleteBook(book.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No books found. Add your first book!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issued Books Tab */}
        <TabsContent value="issued" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Issued Books</CardTitle>
            </CardHeader>
            <CardContent>
              {issuedBooks.filter(i => !i.returned).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Issued To</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedBooks.filter(i => !i.returned).map(issue => {
                      const book = books.find(b => b.id === issue.book_id);
                      const isOverdue = new Date(issue.due_date) < new Date();
                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium">{book?.title || issue.book_id}</TableCell>
                          <TableCell>
                            <div>
                              <p>{getMemberName(issue.member_type, issue.member_id)}</p>
                              <p className="text-xs text-slate-500 capitalize">{issue.member_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(issue.issue_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{new Date(issue.due_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Active'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              onClick={() => handleReturnBook(issue.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Return
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No books currently issued</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category-wise Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {BOOK_CATEGORIES.slice(0, 8).map(category => {
                    const count = books.filter(b => b.category === category).length;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm">{category}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issuedBooks.slice(0, 5).map(issue => {
                    const book = books.find(b => b.id === issue.book_id);
                    return (
                      <div key={issue.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${issue.returned ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{book?.title}</p>
                          <p className="text-xs text-slate-500">
                            {issue.returned ? 'Returned' : 'Issued'} - {new Date(issue.issue_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Book Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Title *</Label>
                <Input
                  value={bookForm.title}
                  onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Book title"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={bookForm.author}
                  onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
              <div className="space-y-2">
                <Label>ISBN</Label>
                <Input
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="ISBN number"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={bookForm.category}
                  onChange={(e) => setBookForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {BOOK_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input
                  value={bookForm.publisher}
                  onChange={(e) => setBookForm(prev => ({ ...prev, publisher: e.target.value }))}
                  placeholder="Publisher"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={bookForm.quantity}
                  onChange={(e) => setBookForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1, available: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={bookForm.price}
                  onChange={(e) => setBookForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowBookDialog(false); setEditingBook(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveBook} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingBook ? 'Update' : 'Add'} Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>Issue a book to student or staff</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Book *</Label>
              <select
                value={issueForm.book_id}
                onChange={(e) => setIssueForm(prev => ({ ...prev, book_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select Book --</option>
                {books.filter(b => b.available > 0).map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.available} available)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Issue To</Label>
              <select
                value={issueForm.member_type}
                onChange={(e) => setIssueForm(prev => ({ ...prev, member_type: e.target.value, member_id: '' }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="student">Student</option>
                <option value="staff">Staff/Teacher</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Select {issueForm.member_type === 'student' ? 'Student' : 'Staff'} *</Label>
              <select
                value={issueForm.member_id}
                onChange={(e) => setIssueForm(prev => ({ ...prev, member_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select --</option>
                {(issueForm.member_type === 'student' ? students : staff).map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.student_id || member.employee_id})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueForm.issue_date}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={issueForm.due_date}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
              <Button onClick={handleIssueBook} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookMarked className="w-4 h-4 mr-2" />}
                Issue Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
