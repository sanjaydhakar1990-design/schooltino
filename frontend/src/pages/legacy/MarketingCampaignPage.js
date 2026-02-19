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
import { Textarea } from '../components/ui/textarea';
import {
  Megaphone, Target, Globe, Share2, Plus, Search, Eye,
  TrendingUp, BarChart3, DollarSign, Users, CheckCircle,
  Clock, Edit, Trash2, ExternalLink, Layout, FileText,
  Hash, Map, ArrowUpRight, Calendar, Image, Send,
  Smartphone, Mail, MessageSquare, Zap, Award, Star,
  PieChart, Activity, Loader2, Copy
} from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function MarketingCampaignPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showLandingPageDialog, setShowLandingPageDialog] = useState(false);
  const [showMetaTagDialog, setShowMetaTagDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [campaignForm, setCampaignForm] = useState({
    name: '', type: 'Social Media', budget: '', start_date: '', end_date: '', status: 'active'
  });

  const [landingPageForm, setLandingPageForm] = useState({
    school_name: '', tagline: '', highlights: '', form_fields: 'Name, Phone, Email, Class', template: 'modern'
  });

  const [metaTagForm, setMetaTagForm] = useState({
    page: '', title: '', description: '', keywords: ''
  });

  const [postForm, setPostForm] = useState({
    content: '', platform: 'Instagram', template: '', schedule_date: '', schedule_time: ''
  });

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Admission Drive 2026-27', type: 'Social Media', budget: 25000, spent: 18500, leads: 342, conversions: 87, conversionRate: 25.4, status: 'active', startDate: '2026-01-15', endDate: '2026-03-31' },
    { id: 2, name: 'WhatsApp Parent Outreach', type: 'WhatsApp', budget: 5000, spent: 4200, leads: 156, conversions: 45, conversionRate: 28.8, status: 'active', startDate: '2026-02-01', endDate: '2026-02-28' },
    { id: 3, name: 'Google Ads - School Brand', type: 'Google Ads', budget: 50000, spent: 32000, leads: 520, conversions: 112, conversionRate: 21.5, status: 'active', startDate: '2026-01-01', endDate: '2026-06-30' },
    { id: 4, name: 'SMS Fee Reminder Campaign', type: 'SMS', budget: 3000, spent: 3000, leads: 0, conversions: 0, conversionRate: 0, status: 'completed', startDate: '2026-01-10', endDate: '2026-01-20' },
    { id: 5, name: 'Email Newsletter - Monthly', type: 'Email', budget: 2000, spent: 1200, leads: 89, conversions: 23, conversionRate: 25.8, status: 'active', startDate: '2026-02-01', endDate: '2026-02-28' },
    { id: 6, name: 'Republic Day Special Offer', type: 'Social Media', budget: 10000, spent: 10000, leads: 210, conversions: 56, conversionRate: 26.7, status: 'completed', startDate: '2026-01-20', endDate: '2026-01-30' },
  ]);

  const [landingPages, setLandingPages] = useState([
    { id: 1, schoolName: 'Sunrise Public School', tagline: 'Shaping Future Leaders', template: 'modern', visits: 1245, submissions: 189, status: 'published', createdAt: '2026-01-15' },
    { id: 2, schoolName: 'Greenwood Academy', tagline: 'Excellence in Education', template: 'classic', visits: 890, submissions: 134, status: 'published', createdAt: '2026-01-20' },
    { id: 3, schoolName: 'Little Stars Preschool', tagline: 'Where Learning Begins', template: 'playful', visits: 456, submissions: 67, status: 'draft', createdAt: '2026-02-01' },
  ]);

  const seoData = {
    score: 78,
    keywords: [
      { keyword: 'best school in city', position: 3, change: 2, volume: 4800 },
      { keyword: 'school admission 2026', position: 5, change: -1, volume: 3200 },
      { keyword: 'cbse school near me', position: 8, change: 3, volume: 6500 },
      { keyword: 'top 10 schools', position: 12, change: 5, volume: 8900 },
      { keyword: 'school fees structure', position: 6, change: 0, volume: 2100 },
    ],
    metaTags: [
      { page: 'Home', title: 'Best CBSE School - Sunrise Public School', description: 'Top-rated CBSE school offering quality education...', status: 'optimized' },
      { page: 'Admissions', title: 'Admission Open 2026-27 | Apply Now', description: 'Limited seats available for 2026-27 session...', status: 'optimized' },
      { page: 'About Us', title: 'About Sunrise Public School', description: 'Learn about our mission, vision, and values...', status: 'needs_update' },
      { page: 'Contact', title: 'Contact Us - Sunrise Public School', description: 'Get in touch with us...', status: 'missing' },
    ],
    sitemapStatus: 'submitted',
    lastCrawled: '2026-02-08',
    indexedPages: 24,
    totalPages: 28
  };

  const [socialPosts, setSocialPosts] = useState([
    { id: 1, content: '🎓 Admissions Open 2026-27! Limited seats available. Apply now and give your child the best education.', platform: 'Instagram', template: 'Admission Open', scheduledFor: '2026-02-10 10:00', status: 'scheduled', likes: 0, shares: 0 },
    { id: 2, content: '🏆 Congratulations to our students for outstanding board exam results! 98% pass rate with 15 students scoring above 95%.', platform: 'Facebook', template: 'Exam Results', scheduledFor: '2026-02-08 14:00', status: 'published', likes: 245, shares: 67 },
    { id: 3, content: '🪔 Wishing everyone a Happy Basant Panchami! May the goddess of knowledge bless all students.', platform: 'Instagram', template: 'Festival Greetings', scheduledFor: '2026-02-02 08:00', status: 'published', likes: 312, shares: 89 },
    { id: 4, content: '⭐ Our student Aarav Patel won Gold Medal at National Science Olympiad! Proud moment for the school.', platform: 'Twitter', template: 'Achievement', scheduledFor: '2026-02-05 12:00', status: 'published', likes: 189, shares: 45 },
  ]);

  const postTemplates = [
    { id: 'admission', name: 'Admission Open', icon: '🎓', color: 'bg-blue-100 text-blue-700' },
    { id: 'results', name: 'Exam Results', icon: '🏆', color: 'bg-amber-100 text-amber-700' },
    { id: 'festival', name: 'Festival Greetings', icon: '🪔', color: 'bg-purple-100 text-purple-700' },
    { id: 'achievement', name: 'Achievement', icon: '⭐', color: 'bg-green-100 text-green-700' },
  ];

  const handleCreateCampaign = () => {
    if (!campaignForm.name || !campaignForm.type) {
      toast.error('Campaign name and type are required');
      return;
    }
    const newCampaign = {
      id: Date.now(),
      name: campaignForm.name,
      type: campaignForm.type,
      budget: parseInt(campaignForm.budget) || 0,
      spent: 0,
      leads: 0,
      conversions: 0,
      conversionRate: 0,
      status: 'active',
      startDate: campaignForm.start_date,
      endDate: campaignForm.end_date
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    toast.success('Campaign created successfully!');
    setShowCampaignDialog(false);
    setCampaignForm({ name: '', type: 'Social Media', budget: '', start_date: '', end_date: '', status: 'active' });
  };

  const handleCreateLandingPage = () => {
    if (!landingPageForm.school_name) {
      toast.error('School name is required');
      return;
    }
    const newPage = {
      id: Date.now(),
      schoolName: landingPageForm.school_name,
      tagline: landingPageForm.tagline,
      template: landingPageForm.template,
      visits: 0,
      submissions: 0,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLandingPages(prev => [newPage, ...prev]);
    toast.success('Landing page created!');
    setShowLandingPageDialog(false);
    setLandingPageForm({ school_name: '', tagline: '', highlights: '', form_fields: 'Name, Phone, Email, Class', template: 'modern' });
  };

  const handleSaveMetaTags = () => {
    if (!metaTagForm.page || !metaTagForm.title) {
      toast.error('Page and title are required');
      return;
    }
    toast.success('Meta tags updated successfully!');
    setShowMetaTagDialog(false);
    setMetaTagForm({ page: '', title: '', description: '', keywords: '' });
  };

  const handleSchedulePost = () => {
    if (!postForm.content) {
      toast.error('Post content is required');
      return;
    }
    const newPost = {
      id: Date.now(),
      content: postForm.content,
      platform: postForm.platform,
      template: postForm.template,
      scheduledFor: `${postForm.schedule_date} ${postForm.schedule_time}`,
      status: 'scheduled',
      likes: 0,
      shares: 0
    };
    setSocialPosts(prev => [newPost, ...prev]);
    toast.success('Post scheduled successfully!');
    setShowPostDialog(false);
    setPostForm({ content: '', platform: 'Instagram', template: '', schedule_date: '', schedule_time: '' });
  };

  const handleDeleteCampaign = (id) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Campaign deleted');
  };

  const campaignTypeIcon = (type) => {
    switch (type) {
      case 'Social Media': return <Share2 className="w-4 h-4 text-blue-600" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'SMS': return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'Email': return <Mail className="w-4 h-4 text-red-600" />;
      case 'Google Ads': return <Globe className="w-4 h-4 text-amber-600" />;
      default: return <Megaphone className="w-4 h-4 text-gray-600" />;
    }
  };

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalLeads: campaigns.reduce((sum, c) => sum + c.leads, 0),
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0)
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Megaphone className="w-8 h-8" />
              Marketing & Campaigns
            </h1>
            <p className="text-green-100 mt-2">
              Boost admissions with SEO & smart digital campaigns
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
              <p className="text-xs text-green-100">Campaigns</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
              <p className="text-xs text-green-100">Active</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalLeads}</p>
              <p className="text-xs text-green-100">Leads</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">₹{(stats.totalBudget / 1000).toFixed(0)}K</p>
              <p className="text-xs text-green-100">Budget</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="w-4 h-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Layout className="w-4 h-4" /> Landing Pages
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> SEO Tools
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Social Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setShowCampaignDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </div>
          <div className="space-y-3">
            {campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(campaign => (
              <Card key={campaign.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        {campaignTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">{campaignTypeIcon(campaign.type)} {campaign.type}</span>
                          <span>{campaign.startDate} to {campaign.endDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">₹{campaign.budget.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Budget</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{campaign.leads}</p>
                        <p className="text-xs text-gray-400">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{campaign.conversions}</p>
                        <p className="text-xs text-gray-400">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">{campaign.conversionRate}%</p>
                        <p className="text-xs text-gray-400">Rate</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCampaign(campaign.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Budget Utilization</span>
                      <span>₹{campaign.spent.toLocaleString()} / ₹{campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Admission Landing Pages</h3>
            <Button onClick={() => setShowLandingPageDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create Page
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {landingPages.map(page => (
              <Card key={page.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {page.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{page.createdAt}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{page.schoolName}</h3>
                  <p className="text-sm text-gray-500 mb-3">{page.tagline}</p>
                  <Badge variant="outline" className="text-xs mb-3 capitalize">{page.template} template</Badge>
                  <div className="flex items-center justify-between pt-3 border-t text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-4 h-4" /> {page.visits} visits
                    </span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <Users className="w-4 h-4" /> {page.submissions} leads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success('Preview opened')}>
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`https://schooltino.com/admission/${page.id}`); toast.success('Link copied!'); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">SEO Score</p>
                    <p className="text-3xl font-bold text-green-900">{seoData.score}/100</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Indexed Pages</p>
                    <p className="text-3xl font-bold text-blue-900">{seoData.indexedPages}/{seoData.totalPages}</p>
                  </div>
                  <FileText className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Sitemap</p>
                    <p className="text-xl font-bold text-purple-900 capitalize">{seoData.sitemapStatus}</p>
                  </div>
                  <Map className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Last Crawled</p>
                    <p className="text-xl font-bold text-amber-900">{seoData.lastCrawled}</p>
                  </div>
                  <Globe className="w-10 h-10 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-600" /> Keyword Rankings
                </h3>
                <div className="space-y-3">
                  {seoData.keywords.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{kw.keyword}</p>
                        <p className="text-xs text-gray-400">{kw.volume.toLocaleString()} monthly searches</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-bold">#{kw.position}</Badge>
                        <span className={`flex items-center text-xs font-medium ${kw.change > 0 ? 'text-green-600' : kw.change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {kw.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : kw.change < 0 ? <TrendingUp className="w-3 h-3 rotate-90" /> : '—'}
                          {kw.change !== 0 && Math.abs(kw.change)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" /> Meta Tags Manager
                  </h3>
                  <Button size="sm" onClick={() => setShowMetaTagDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <Edit className="w-3 h-3 mr-1" /> Edit Tags
                  </Button>
                </div>
                <div className="space-y-3">
                  {seoData.metaTags.map((tag, idx) => (
                    <div key={idx} className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{tag.page}</span>
                        <Badge className={tag.status === 'optimized' ? 'bg-green-100 text-green-700' : tag.status === 'needs_update' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                          {tag.status === 'optimized' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                          {tag.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-600 truncate">{tag.title}</p>
                      <p className="text-xs text-gray-400 truncate">{tag.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Social Media Posts</h3>
            <Button onClick={() => setShowPostDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create Post
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {postTemplates.map(tmpl => (
              <Card key={tmpl.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { setPostForm(f => ({ ...f, template: tmpl.name })); setShowPostDialog(true); }}>
                <CardContent className="p-4 text-center">
                  <span className="text-3xl">{tmpl.icon}</span>
                  <p className="text-sm font-medium text-gray-900 mt-2">{tmpl.name}</p>
                  <Badge className={`${tmpl.color} text-xs mt-1`}>Template</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {socialPosts.map(post => (
              <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {post.status === 'published' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.platform}</Badge>
                      {post.template && <Badge variant="outline" className="text-xs">{post.template}</Badge>}
                    </div>
                    <span className="text-xs text-gray-400">{post.scheduledFor}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  {post.status === 'published' && (
                    <div className="flex items-center gap-4 pt-3 border-t text-sm text-gray-500">
                      <span className="flex items-center gap-1">❤️ {post.likes}</span>
                      <span className="flex items-center gap-1">🔄 {post.shares}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" /> Create Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input value={campaignForm.name} onChange={(e) => setCampaignForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Admission Drive 2026" />
            </div>
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Social Media', 'WhatsApp', 'SMS', 'Email', 'Google Ads'].map(type => (
                  <button key={type} type="button" onClick={() => setCampaignForm(f => ({ ...f, type }))} className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all ${campaignForm.type === type ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget (₹)</Label>
              <Input type="number" value={campaignForm.budget} onChange={(e) => setCampaignForm(f => ({ ...f, budget: e.target.value }))} placeholder="25000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={campaignForm.start_date} onChange={(e) => setCampaignForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={campaignForm.end_date} onChange={(e) => setCampaignForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleCreateCampaign} className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLandingPageDialog} onOpenChange={setShowLandingPageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-green-600" /> Create Landing Page
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input value={landingPageForm.school_name} onChange={(e) => setLandingPageForm(f => ({ ...f, school_name: e.target.value }))} placeholder="Sunrise Public School" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={landingPageForm.tagline} onChange={(e) => setLandingPageForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Shaping Future Leaders" />
            </div>
            <div className="space-y-2">
              <Label>Highlights</Label>
              <Textarea value={landingPageForm.highlights} onChange={(e) => setLandingPageForm(f => ({ ...f, highlights: e.target.value }))} placeholder="Smart classrooms, AC buses, Sports ground..." />
            </div>
            <div className="space-y-2">
              <Label>Form Fields</Label>
              <Input value={landingPageForm.form_fields} onChange={(e) => setLandingPageForm(f => ({ ...f, form_fields: e.target.value }))} placeholder="Name, Phone, Email, Class" />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-3">
                {['modern', 'classic', 'playful'].map(t => (
                  <button key={t} type="button" onClick={() => setLandingPageForm(f => ({ ...f, template: t }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium capitalize transition-all ${landingPageForm.template === t ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateLandingPage} className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMetaTagDialog} onOpenChange={setShowMetaTagDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" /> Edit Meta Tags
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page</Label>
              <Input value={metaTagForm.page} onChange={(e) => setMetaTagForm(f => ({ ...f, page: e.target.value }))} placeholder="Home" />
            </div>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={metaTagForm.title} onChange={(e) => setMetaTagForm(f => ({ ...f, title: e.target.value }))} placeholder="Best CBSE School - Your School Name" />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={metaTagForm.description} onChange={(e) => setMetaTagForm(f => ({ ...f, description: e.target.value }))} placeholder="SEO-friendly description..." />
            </div>
            <div className="space-y-2">
              <Label>Keywords</Label>
              <Input value={metaTagForm.keywords} onChange={(e) => setMetaTagForm(f => ({ ...f, keywords: e.target.value }))} placeholder="best school, cbse, admission" />
            </div>
            <Button onClick={handleSaveMetaTags} className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" /> Save Meta Tags
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" /> Schedule Social Media Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {postForm.template && (
              <Badge className="bg-green-100 text-green-700">Template: {postForm.template}</Badge>
            )}
            <div className="space-y-2">
              <Label>Post Content</Label>
              <Textarea value={postForm.content} onChange={(e) => setPostForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your post..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-4 gap-2">
                {['Instagram', 'Facebook', 'Twitter', 'LinkedIn'].map(p => (
                  <button key={p} type="button" onClick={() => setPostForm(f => ({ ...f, platform: p }))} className={`p-2 rounded-xl border-2 text-center text-xs font-medium transition-all ${postForm.platform === p ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input type="date" value={postForm.schedule_date} onChange={(e) => setPostForm(f => ({ ...f, schedule_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input type="time" value={postForm.schedule_time} onChange={(e) => setPostForm(f => ({ ...f, schedule_time: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleSchedulePost} className="w-full bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4 mr-2" /> Schedule Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}