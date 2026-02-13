import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
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
  BookOpen, Search, Plus, Upload, Download, Eye, Edit, Trash2,
  Library, FileText, Beaker, Calculator, Globe, Palette, Play,
  GraduationCap, BookMarked, Newspaper, Filter, ArrowLeftRight,
  CheckCircle, Clock, AlertCircle, BarChart3, Layers, Monitor
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const demoBooks = [
  { id: 1, title: 'NCERT Mathematics Class 10', author: 'NCERT', isbn: '978-81-7450-001-0', category: 'Textbooks', copies: 45, available: 38, location: 'Shelf A-1' },
  { id: 2, title: 'Concise Physics - Selina', author: 'R.P. Goyal', isbn: '978-81-7450-002-7', category: 'Reference', copies: 30, available: 25, location: 'Shelf B-3' },
  { id: 3, title: 'Godan - Premchand', author: 'Munshi Premchand', isbn: '978-81-7450-003-4', category: 'Fiction', copies: 20, available: 12, location: 'Shelf C-2' },
  { id: 4, title: 'Champak Monthly', author: 'Delhi Press', isbn: '978-81-7450-004-1', category: 'Magazines', copies: 15, available: 15, location: 'Reading Room' },
  { id: 5, title: 'NCERT Science Class 9', author: 'NCERT', isbn: '978-81-7450-005-8', category: 'Textbooks', copies: 50, available: 42, location: 'Shelf A-2' },
  { id: 6, title: 'Oxford English Dictionary', author: 'Oxford Press', isbn: '978-81-7450-006-5', category: 'Reference', copies: 10, available: 8, location: 'Shelf D-1' },
  { id: 7, title: 'Panchtantra Ki Kahaniyan', author: 'Vishnu Sharma', isbn: '978-81-7450-007-2', category: 'Fiction', copies: 25, available: 18, location: 'Shelf C-4' },
  { id: 8, title: 'Science Reporter', author: 'CSIR', isbn: '978-81-7450-008-9', category: 'Magazines', copies: 12, available: 10, location: 'Reading Room' },
];

const demoIssues = [
  { id: 1, book: 'NCERT Mathematics Class 10', student: 'Aarav Sharma', class: '10-A', issueDate: '2026-01-15', dueDate: '2026-02-15', status: 'issued' },
  { id: 2, book: 'Godan - Premchand', student: 'Priya Patel', class: '9-B', issueDate: '2026-01-20', dueDate: '2026-02-20', status: 'issued' },
  { id: 3, book: 'Concise Physics - Selina', student: 'Rahul Singh', class: '10-A', issueDate: '2026-01-10', dueDate: '2026-02-10', status: 'overdue' },
  { id: 4, book: 'Oxford English Dictionary', student: 'Sneha Gupta', class: '8-C', issueDate: '2026-01-25', dueDate: '2026-02-25', status: 'issued' },
  { id: 5, book: 'NCERT Science Class 9', student: 'Arjun Kumar', class: '9-A', issueDate: '2026-01-05', dueDate: '2026-02-05', status: 'returned' },
];

const demoEbooks = [
  { id: 1, title: 'NCERT Maths Class 12 (PDF)', subject: 'Mathematics', class: '12', size: '15.2 MB', uploads: 234, format: 'PDF' },
  { id: 2, title: 'Hindi Vyakaran Guide', subject: 'Hindi', class: '9-12', size: '8.5 MB', uploads: 189, format: 'PDF' },
  { id: 3, title: 'English Grammar Workbook', subject: 'English', class: '6-8', size: '12.1 MB', uploads: 156, format: 'PDF' },
  { id: 4, title: 'Social Science Atlas', subject: 'SST', class: '10', size: '22.8 MB', uploads: 98, format: 'PDF' },
  { id: 5, title: 'Biology Lab Manual', subject: 'Biology', class: '11-12', size: '18.4 MB', uploads: 145, format: 'PDF' },
];

const edtechTools = [
  { id: 1, name: 'Physics Simulator', nameHi: 'भौतिकी सिम्युलेटर', category: 'Science', description: 'Pendulum, optics, electricity experiments', icon: Beaker, color: 'bg-blue-500', users: 342 },
  { id: 2, name: 'Chemistry Lab Virtual', nameHi: 'रसायन प्रयोगशाला', category: 'Science', description: 'Virtual titration, reactions, periodic table', icon: Beaker, color: 'bg-green-500', users: 278 },
  { id: 3, name: 'Graph Plotter', nameHi: 'ग्राफ प्लॉटर', category: 'Math', description: 'Plot equations, analyze graphs, coordinate geometry', icon: BarChart3, color: 'bg-purple-500', users: 456 },
  { id: 4, name: 'Scientific Calculator', nameHi: 'वैज्ञानिक कैलकुलेटर', category: 'Math', description: 'Advanced calculations, trigonometry, algebra', icon: Calculator, color: 'bg-indigo-500', users: 512 },
  { id: 5, name: 'Language Lab', nameHi: 'भाषा प्रयोगशाला', category: 'Language', description: 'Pronunciation, grammar exercises, vocabulary', icon: Globe, color: 'bg-teal-500', users: 198 },
  { id: 6, name: 'Hindi Typing Tutor', nameHi: 'हिंदी टाइपिंग', category: 'Language', description: 'Learn Devnagari typing with exercises', icon: Globe, color: 'bg-orange-500', users: 167 },
  { id: 7, name: 'Art Canvas', nameHi: 'कला कैनवास', category: 'Art', description: 'Digital drawing, painting, color mixing', icon: Palette, color: 'bg-pink-500', users: 234 },
  { id: 8, name: 'Music Studio', nameHi: 'संगीत स्टूडियो', category: 'Art', description: 'Learn Indian classical instruments, sur practice', icon: Palette, color: 'bg-rose-500', users: 145 },
];

const curriculumContent = [
  { id: 1, class: '1-5', subject: 'Mathematics', resources: 45, lastUpdated: '2026-02-01' },
  { id: 2, class: '1-5', subject: 'Hindi', resources: 38, lastUpdated: '2026-01-28' },
  { id: 3, class: '1-5', subject: 'English', resources: 42, lastUpdated: '2026-01-30' },
  { id: 4, class: '6-8', subject: 'Science', resources: 56, lastUpdated: '2026-02-05' },
  { id: 5, class: '6-8', subject: 'Mathematics', resources: 52, lastUpdated: '2026-02-03' },
  { id: 6, class: '6-8', subject: 'Social Science', resources: 48, lastUpdated: '2026-01-25' },
  { id: 7, class: '9-10', subject: 'Physics', resources: 34, lastUpdated: '2026-02-07' },
  { id: 8, class: '9-10', subject: 'Chemistry', resources: 31, lastUpdated: '2026-02-06' },
  { id: 9, class: '11-12', subject: 'Mathematics', resources: 40, lastUpdated: '2026-02-08' },
  { id: 10, class: '11-12', subject: 'Biology', resources: 36, lastUpdated: '2026-02-04' },
];

export default function DigitalLibraryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const schoolId = user?.school_id || localStorage.getItem('school_id');
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [books, setBooks] = useState(demoBooks);
  const [issues, setIssues] = useState(demoIssues);
  const [ebooks, setEbooks] = useState(demoEbooks);
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showUploadEbookDialog, setShowUploadEbookDialog] = useState(false);
  const [showUploadContentDialog, setShowUploadContentDialog] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Textbooks', copies: '', location: '' });
  const [ebookForm, setEbookForm] = useState({ title: '', subject: '', class: '', format: 'PDF' });
  const [contentForm, setContentForm] = useState({ title: '', class: '', subject: '', type: 'Worksheet' });

  const categories = ['all', 'Textbooks', 'Reference', 'Fiction', 'Magazines'];

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [booksRes, ebooksRes, issuesRes] = await Promise.all([
        axios.get(`${API}/library/books?school_id=${schoolId}`, { headers }).catch(() => null),
        axios.get(`${API}/library/ebooks?school_id=${schoolId}`, { headers }).catch(() => null),
        axios.get(`${API}/library/issued?school_id=${schoolId}`, { headers }).catch(() => null),
      ]);
      if (booksRes?.data?.length > 0) setBooks(booksRes.data);
      if (ebooksRes?.data?.length > 0) setEbooks(ebooksRes.data);
      if (issuesRes?.data?.length > 0) setIssues(issuesRes.data);
    } catch {
      console.log('Using demo library data');
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) {
      toast.error('Book title और author ज़रूरी है');
      return;
    }
    const newBook = {
      id: Date.now(),
      ...bookForm,
      copies: parseInt(bookForm.copies) || 1,
      available: parseInt(bookForm.copies) || 1,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/library/books`, {
        ...newBook,
        school_id: schoolId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.id) newBook.id = res.data.id;
    } catch {
      console.log('Saved book locally');
    }

    setBooks(prev => [...prev, newBook]);
    toast.success('Book added successfully!');
    setShowAddBookDialog(false);
    setBookForm({ title: '', author: '', isbn: '', category: 'Textbooks', copies: '', location: '' });
  };

  const handleReturnBook = (issueId) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'returned' } : i));
    toast.success('Book returned successfully!');
  };

  const handleUploadEbook = async () => {
    if (!ebookForm.title || !ebookForm.subject) {
      toast.error('Title और subject ज़रूरी है');
      return;
    }
    const newEbook = { id: Date.now(), ...ebookForm, size: '5.0 MB', uploads: 0 };

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/library/ebooks`, {
        ...newEbook,
        school_id: schoolId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.id) newEbook.id = res.data.id;
    } catch {
      console.log('Saved ebook locally');
    }

    setEbooks(prev => [...prev, newEbook]);
    toast.success('E-Book uploaded successfully!');
    setShowUploadEbookDialog(false);
    setEbookForm({ title: '', subject: '', class: '', format: 'PDF' });
  };

  const handleUploadContent = async () => {
    if (!contentForm.title || !contentForm.subject) {
      toast.error('Title और subject ज़रूरी है');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/library/content`, {
        ...contentForm,
        school_id: schoolId
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      console.log('Saved content locally');
    }

    toast.success('Content uploaded successfully!');
    setShowUploadContentDialog(false);
    setContentForm({ title: '', class: '', subject: '', type: 'Worksheet' });
  };

  const handleLaunchTool = (tool) => {
    toast.success(`${tool.name} launched! ${tool.nameHi} शुरू हो रहा है...`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Library className="w-8 h-8" />
              {t('digital_library')} & EdTech
            </h1>
            <p className="text-purple-100 mt-2">
              {t('digital_library')} & EdTech
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="text-xs text-purple-100">{t('total_books')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{ebooks.length}</p>
              <p className="text-xs text-purple-100">{t('digital_library')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{edtechTools.length}</p>
              <p className="text-xs text-purple-100">{t('actions')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{issues.filter(i => i.status === 'issued').length}</p>
              <p className="text-xs text-purple-100">{t('issued')}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {t('library')}
          </TabsTrigger>
          <TabsTrigger value="ebooks" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> {t('digital_library')}
          </TabsTrigger>
          <TabsTrigger value="edtech" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" /> {t('online_class')}
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> {t('content')} {t('library')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? t('all') : cat}
                </Button>
              ))}
            </div>
            <Button onClick={() => setShowAddBookDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> {t('add_book')}
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('title')} / {t('author')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('isbn')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('category')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('quantity')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('available')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('location')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map(book => (
                      <tr key={book.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-semibold text-gray-900">{book.title}</p>
                          <p className="text-xs text-gray-400">{book.author}</p>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{book.isbn}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline">{book.category}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{book.copies}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-sm font-bold ${book.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {book.available}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">{book.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" /> {t('issue_book')} / {t('return_book')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('book_title')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('student')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('issue_date')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('due_date')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('status')}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => (
                      <tr key={issue.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{issue.book}</td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm text-gray-900">{issue.student}</p>
                          <p className="text-xs text-gray-400">{t('classes')} {issue.class}</p>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{issue.issueDate}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{issue.dueDate}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={
                            issue.status === 'returned' ? 'bg-green-100 text-green-700' :
                            issue.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {issue.status === 'returned' ? t('completed') : issue.status === 'overdue' ? t('overdue') : t('issued')}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {issue.status !== 'returned' && (
                            <Button size="sm" variant="outline" onClick={() => handleReturnBook(issue.id)}>
                              {t('return_book')}
                            </Button>
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

        <TabsContent value="ebooks" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('digital_library')}</h3>
            <Button onClick={() => setShowUploadEbookDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" /> {t('upload')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ebooks.map(ebook => (
              <Card key={ebook.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{ebook.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{t('subject')}: {ebook.subject} | {t('classes')}: {ebook.class}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{ebook.size}</span>
                        <Badge variant="outline" className="text-xs">{ebook.format}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" /> {t('view')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Download className="w-3 h-3 mr-1" /> {t('download')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="edtech" className="mt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('online_class')}</h3>

          {['Science', 'Math', 'Language', 'Art'].map(category => (
            <div key={category} className="space-y-3">
              <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                {category === 'Science' && <Beaker className="w-5 h-5 text-blue-600" />}
                {category === 'Math' && <Calculator className="w-5 h-5 text-purple-600" />}
                {category === 'Language' && <Globe className="w-5 h-5 text-teal-600" />}
                {category === 'Art' && <Palette className="w-5 h-5 text-pink-600" />}
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {edtechTools.filter(t => t.category === category).map(tool => (
                  <Card key={tool.id} className="border-0 shadow-md hover:shadow-lg transition-all group">
                    <CardContent className="p-5">
                      <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center mb-3`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{tool.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{tool.nameHi}</p>
                      <p className="text-xs text-gray-400 mt-2">{tool.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-400">{tool.users} users</span>
                        <Button size="sm" onClick={() => handleLaunchTool(tool)} className="bg-purple-600 hover:bg-purple-700">
                          <Play className="w-3 h-3 mr-1" /> {t('view')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="content" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('content')} {t('library')}</h3>
            <Button onClick={() => setShowUploadContentDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" /> {t('upload')} {t('content')}
            </Button>
          </div>

          {['1-5', '6-8', '9-10', '11-12'].map(classGroup => (
            <div key={classGroup} className="space-y-3">
              <h4 className="text-md font-semibold text-gray-700">
                <GraduationCap className="w-4 h-4 inline mr-2" />
                {t('classes')} {classGroup}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {curriculumContent.filter(c => c.class === classGroup).map(content => (
                  <Card key={content.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{content.subject}</h5>
                          <p className="text-xs text-gray-500 mt-1">{content.resources} {t('results')}</p>
                          <p className="text-xs text-gray-400">{t('updated')}: {content.lastUpdated}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add_book')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('book_title')}</Label>
              <Input value={bookForm.title} onChange={(e) => setBookForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter book title" />
            </div>
            <div className="space-y-2">
              <Label>{t('author')}</Label>
              <Input value={bookForm.author} onChange={(e) => setBookForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
            </div>
            <div className="space-y-2">
              <Label>{t('isbn')}</Label>
              <Input value={bookForm.isbn} onChange={(e) => setBookForm(f => ({ ...f, isbn: e.target.value }))} placeholder="ISBN number" />
            </div>
            <div className="space-y-2">
              <Label>{t('category')}</Label>
              <select value={bookForm.category} onChange={(e) => setBookForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="Textbooks">Textbooks</option>
                <option value="Reference">Reference</option>
                <option value="Fiction">Fiction</option>
                <option value="Magazines">Magazines</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('quantity')}</Label>
                <Input type="number" value={bookForm.copies} onChange={(e) => setBookForm(f => ({ ...f, copies: e.target.value }))} placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>{t('location')}</Label>
                <Input value={bookForm.location} onChange={(e) => setBookForm(f => ({ ...f, location: e.target.value }))} placeholder="Shelf A-1" />
              </div>
            </div>
            <Button onClick={handleAddBook} className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> {t('add_book')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadEbookDialog} onOpenChange={setShowUploadEbookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('upload')} E-Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('title')}</Label>
              <Input value={ebookForm.title} onChange={(e) => setEbookForm(f => ({ ...f, title: e.target.value }))} placeholder="E-Book title" />
            </div>
            <div className="space-y-2">
              <Label>{t('subject')}</Label>
              <Input value={ebookForm.subject} onChange={(e) => setEbookForm(f => ({ ...f, subject: e.target.value }))} placeholder={t('subject')} />
            </div>
            <div className="space-y-2">
              <Label>{t('classes')}</Label>
              <Input value={ebookForm.class} onChange={(e) => setEbookForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. 9-10" />
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t('choose_file')}</p>
              <p className="text-xs text-gray-400">PDF, EPUB up to 50MB</p>
            </div>
            <Button onClick={handleUploadEbook} className="w-full bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" /> {t('upload')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadContentDialog} onOpenChange={setShowUploadContentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('upload')} {t('content')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('title')}</Label>
              <Input value={contentForm.title} onChange={(e) => setContentForm(f => ({ ...f, title: e.target.value }))} placeholder="Content title" />
            </div>
            <div className="space-y-2">
              <Label>{t('classes')}</Label>
              <select value={contentForm.class} onChange={(e) => setContentForm(f => ({ ...f, class: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="">{t('select_class')}</option>
                <option value="1-5">Class 1-5</option>
                <option value="6-8">Class 6-8</option>
                <option value="9-10">Class 9-10</option>
                <option value="11-12">Class 11-12</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t('subject')}</Label>
              <Input value={contentForm.subject} onChange={(e) => setContentForm(f => ({ ...f, subject: e.target.value }))} placeholder={t('subject')} />
            </div>
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <select value={contentForm.type} onChange={(e) => setContentForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="Worksheet">Worksheet</option>
                <option value="Lesson Plan">Lesson Plan</option>
                <option value="Video">Video</option>
                <option value="Presentation">Presentation</option>
              </select>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t('choose_file')}</p>
            </div>
            <Button onClick={handleUploadContent} className="w-full bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" /> {t('upload')} {t('content')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}