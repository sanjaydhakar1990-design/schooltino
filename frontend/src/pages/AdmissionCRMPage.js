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
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  Users, UserPlus, Phone, CalendarDays, BarChart3, TrendingUp,
  Search, Plus, Edit, Trash2, CheckCircle, Clock, Eye, X,
  MessageSquare, Globe, Smartphone, Megaphone, Target, ArrowRight,
  Filter, ChevronRight, GraduationCap, MapPin, Mail, Star,
  AlertCircle, Calendar, RefreshCw, IndianRupee, Loader2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  'New': 'bg-blue-100 text-blue-700',
  'Contacted': 'bg-yellow-100 text-yellow-700',
  'Interested': 'bg-purple-100 text-purple-700',
  'Enrolled': 'bg-green-100 text-green-700',
  'Lost': 'bg-red-100 text-red-700',
};

export default function AdmissionCRMPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enquiries');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);

  const [enquiries, setEnquiries] = useState([
    { id: 1, name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', class: 'Class 6', source: 'Website', status: 'New', followUpDate: '2026-02-10', notes: 'Interested in science stream', createdAt: '2026-02-08' },
    { id: 2, name: 'Priya Patel', phone: '9876543211', email: 'priya@email.com', class: 'Class 9', source: 'WhatsApp', status: 'Contacted', followUpDate: '2026-02-11', notes: 'Called once, will visit next week', createdAt: '2026-02-07' },
    { id: 3, name: 'Amit Kumar', phone: '9876543212', email: 'amit@email.com', class: 'Class 1', source: 'Referral', status: 'Interested', followUpDate: '2026-02-09', notes: 'Parent visited, liked campus', createdAt: '2026-02-05' },
    { id: 4, name: 'Sneha Verma', phone: '9876543213', email: 'sneha@email.com', class: 'Class 11', source: 'Social Media', status: 'Enrolled', followUpDate: '', notes: 'Admission confirmed for Science', createdAt: '2026-02-03' },
    { id: 5, name: 'Vikram Singh', phone: '9876543214', email: 'vikram@email.com', class: 'Class 4', source: 'Walk-in', status: 'Lost', followUpDate: '', notes: 'Chose another school', createdAt: '2026-02-01' },
    { id: 6, name: 'Ananya Gupta', phone: '9876543215', email: 'ananya@email.com', class: 'Class 8', source: 'SMS Campaign', status: 'New', followUpDate: '2026-02-12', notes: 'Enquired about fees', createdAt: '2026-02-09' },
    { id: 7, name: 'Rohan Jain', phone: '9876543216', email: 'rohan@email.com', class: 'Class 3', source: 'Website', status: 'Contacted', followUpDate: '2026-02-10', notes: 'Scheduled campus visit', createdAt: '2026-02-06' },
  ]);

  const [enquiryForm, setEnquiryForm] = useState({
    name: '', phone: '', email: '', class: '', source: 'Website', status: 'New', followUpDate: '', notes: ''
  });

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Admission Open 2026-27', channel: 'SMS', budget: 5000, startDate: '2026-02-01', endDate: '2026-03-31', status: 'Active', sent: 2400, responses: 180, conversions: 24 },
    { id: 2, name: 'Early Bird Discount', channel: 'WhatsApp', budget: 3000, startDate: '2026-02-05', endDate: '2026-02-28', status: 'Active', sent: 1200, responses: 95, conversions: 12 },
    { id: 3, name: 'Social Media Campaign', channel: 'Social', budget: 10000, startDate: '2026-01-15', endDate: '2026-03-15', status: 'Active', sent: 45000, responses: 320, conversions: 45 },
    { id: 4, name: 'Website Landing Page', channel: 'Website', budget: 2000, startDate: '2026-01-01', endDate: '2026-04-30', status: 'Active', sent: 0, responses: 210, conversions: 38 },
  ]);

  const [campaignForm, setCampaignForm] = useState({
    name: '', channel: 'SMS', budget: '', startDate: '', endDate: ''
  });

  const followUps = enquiries
    .filter(e => e.followUpDate && e.status !== 'Enrolled' && e.status !== 'Lost')
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  const todayFollowUps = followUps.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.followUpDate <= today;
  });

  const weekFollowUps = followUps.filter(e => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return new Date(e.followUpDate) <= weekEnd && new Date(e.followUpDate) > new Date(today.toISOString().split('T')[0]);
  });

  const funnelData = [
    { stage: 'Enquiry', count: enquiries.length, color: 'bg-blue-500', width: '100%' },
    { stage: 'Visit', count: Math.floor(enquiries.length * 0.6), color: 'bg-purple-500', width: '60%' },
    { stage: 'Applied', count: Math.floor(enquiries.length * 0.35), color: 'bg-amber-500', width: '35%' },
    { stage: 'Enrolled', count: enquiries.filter(e => e.status === 'Enrolled').length, color: 'bg-green-500', width: '15%' },
  ];

  const sourceConversion = [
    { source: 'Website', enquiries: 28, enrolled: 8, rate: 28.6, color: 'bg-blue-500' },
    { source: 'WhatsApp', enquiries: 22, enrolled: 5, rate: 22.7, color: 'bg-green-500' },
    { source: 'Social Media', enquiries: 35, enrolled: 6, rate: 17.1, color: 'bg-pink-500' },
    { source: 'Referral', enquiries: 15, enrolled: 7, rate: 46.7, color: 'bg-purple-500' },
    { source: 'Walk-in', enquiries: 18, enrolled: 9, rate: 50.0, color: 'bg-amber-500' },
    { source: 'SMS Campaign', enquiries: 12, enrolled: 2, rate: 16.7, color: 'bg-cyan-500' },
  ];

  const classDemand = [
    { class: 'Nursery', enquiries: 22, seats: 30 },
    { class: 'Class 1', enquiries: 18, seats: 40 },
    { class: 'Class 6', enquiries: 15, seats: 45 },
    { class: 'Class 9', enquiries: 12, seats: 40 },
    { class: 'Class 11 (Sci)', enquiries: 25, seats: 35 },
    { class: 'Class 11 (Com)', enquiries: 10, seats: 35 },
  ];

  const filteredEnquiries = enquiries.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery) ||
    e.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveEnquiry = () => {
    if (!enquiryForm.name || !enquiryForm.phone) {
      toast.error('Name and Phone are required');
      return;
    }
    if (editingEnquiry) {
      setEnquiries(prev => prev.map(e => e.id === editingEnquiry.id ? { ...e, ...enquiryForm } : e));
      toast.success('Enquiry updated successfully');
    } else {
      setEnquiries(prev => [...prev, { id: Date.now(), ...enquiryForm, createdAt: new Date().toISOString().split('T')[0] }]);
      toast.success('New enquiry added successfully');
    }
    setShowEnquiryDialog(false);
    setEditingEnquiry(null);
    setEnquiryForm({ name: '', phone: '', email: '', class: '', source: 'Website', status: 'New', followUpDate: '', notes: '' });
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    setEnquiryForm({
      name: enquiry.name, phone: enquiry.phone, email: enquiry.email || '',
      class: enquiry.class, source: enquiry.source, status: enquiry.status,
      followUpDate: enquiry.followUpDate || '', notes: enquiry.notes || ''
    });
    setShowEnquiryDialog(true);
  };

  const handleDeleteEnquiry = (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
    toast.success('Enquiry deleted');
  };

  const handleMarkFollowUpDone = (id) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'Contacted', followUpDate: '' } : e));
    toast.success('Follow-up marked as completed');
  };

  const handleSaveCampaign = () => {
    if (!campaignForm.name || !campaignForm.channel) {
      toast.error('Campaign name and channel are required');
      return;
    }
    setCampaigns(prev => [...prev, {
      id: Date.now(), ...campaignForm, budget: parseInt(campaignForm.budget) || 0,
      status: 'Active', sent: 0, responses: 0, conversions: 0
    }]);
    toast.success('Campaign created successfully');
    setShowCampaignDialog(false);
    setCampaignForm({ name: '', channel: 'SMS', budget: '', startDate: '', endDate: '' });
  };

  const totalEnquiries = enquiries.length;
  const enrolledCount = enquiries.filter(e => e.status === 'Enrolled').length;
  const conversionRate = totalEnquiries > 0 ? ((enrolledCount / totalEnquiries) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <UserPlus className="w-8 h-8" />
              Admission CRM
            </h1>
            <p className="text-cyan-100 mt-2">
              Track every lead, analyse every campaign — never miss an admission
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalEnquiries}</p>
              <p className="text-xs text-cyan-100">Total Enquiries</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{enrolledCount}</p>
              <p className="text-xs text-cyan-100">Enrolled</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-xs text-cyan-100">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="enquiries" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Enquiries
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Follow-ups
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enquiries" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingEnquiry(null); setEnquiryForm({ name: '', phone: '', email: '', class: '', source: 'Website', status: 'New', followUpDate: '', notes: '' }); setShowEnquiryDialog(true); }} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Add Enquiry
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['New', 'Contacted', 'Interested', 'Enrolled', 'Lost'].map(status => (
              <Card key={status} className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{enquiries.filter(e => e.status === status).length}</p>
                  <Badge className={statusColors[status]}>{status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Phone</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Class</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Source</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Follow-up</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnquiries.map(enquiry => (
                      <tr key={enquiry.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{enquiry.name}</p>
                            {enquiry.email && <p className="text-xs text-gray-400">{enquiry.email}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{enquiry.phone}</td>
                        <td className="py-3 px-4 text-gray-600">{enquiry.class}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{enquiry.source}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[enquiry.status]}>{enquiry.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{enquiry.followUpDate || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditEnquiry(enquiry)}>
                              <Edit className="w-4 h-4 text-gray-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEnquiry(enquiry.id)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Due Today / Overdue ({todayFollowUps.length})
              </h3>
              {todayFollowUps.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500">All caught up! No follow-ups due today.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayFollowUps.map(item => (
                    <Card key={item.id} className="border-0 shadow-md border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.class} • {item.phone}</p>
                            {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleMarkFollowUpDone(item.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Done
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                This Week ({weekFollowUps.length})
              </h3>
              {weekFollowUps.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No upcoming follow-ups this week.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {weekFollowUps.map(item => (
                    <Card key={item.id} className="border-0 shadow-md border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.class} • {item.phone}</p>
                            <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.followUpDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            <Button size="sm" variant="outline" onClick={() => handleMarkFollowUpDone(item.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Done
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Admission Campaigns</h3>
            <Button onClick={() => { setCampaignForm({ name: '', channel: 'SMS', budget: '', startDate: '', endDate: '' }); setShowCampaignDialog(true); }} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        campaign.channel === 'SMS' ? 'bg-blue-500' :
                        campaign.channel === 'WhatsApp' ? 'bg-green-500' :
                        campaign.channel === 'Social' ? 'bg-pink-500' : 'bg-purple-500'
                      }`}>
                        {campaign.channel === 'SMS' ? <MessageSquare className="w-5 h-5 text-white" /> :
                         campaign.channel === 'WhatsApp' ? <Smartphone className="w-5 h-5 text-white" /> :
                         campaign.channel === 'Social' ? <Globe className="w-5 h-5 text-white" /> :
                         <Globe className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{campaign.name}</h4>
                        <p className="text-xs text-gray-500">{campaign.startDate} to {campaign.endDate}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-900">{campaign.sent > 0 ? campaign.sent.toLocaleString() : campaign.responses}</p>
                      <p className="text-xs text-gray-500">{campaign.sent > 0 ? 'Sent' : 'Responses'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-900">{campaign.responses}</p>
                      <p className="text-xs text-gray-500">Responses</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">{campaign.conversions}</p>
                      <p className="text-xs text-gray-500">Enrolled</p>
                    </div>
                  </div>
                  {campaign.budget > 0 && (
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" /> Budget: ₹{campaign.budget.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Admission Funnel</h3>
              <div className="space-y-3">
                {funnelData.map((stage, i) => (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-600 text-right">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div className={`absolute left-0 top-0 h-full ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all`} style={{ width: stage.width }}>
                          <span className="text-white text-sm font-bold">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                    {i < funnelData.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Source-wise Conversion</h3>
                <div className="space-y-3">
                  {sourceConversion.map(src => (
                    <div key={src.source} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${src.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{src.source}</span>
                          <span className="text-sm font-bold text-gray-900">{src.rate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${src.color} h-2 rounded-full`} style={{ width: `${src.rate}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-16 text-right">{src.enrolled}/{src.enquiries}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Class-wise Demand</h3>
                <div className="space-y-3">
                  {classDemand.map(cd => (
                    <div key={cd.class}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cd.class}</span>
                        <span className="text-xs text-gray-500">{cd.enquiries} enquiries / {cd.seats} seats</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${cd.enquiries >= cd.seats ? 'bg-red-500' : cd.enquiries >= cd.seats * 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((cd.enquiries / cd.seats) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEnquiry ? 'Edit Enquiry' : 'Add New Enquiry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Student Name *</Label>
                <Input value={enquiryForm.name} onChange={e => setEnquiryForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={enquiryForm.phone} onChange={e => setEnquiryForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={enquiryForm.email} onChange={e => setEnquiryForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" />
              </div>
              <div>
                <Label>Class</Label>
                <Input value={enquiryForm.class} onChange={e => setEnquiryForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g., Class 6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={enquiryForm.source} onChange={e => setEnquiryForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Referral">Referral</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="SMS Campaign">SMS Campaign</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={enquiryForm.status} onChange={e => setEnquiryForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input type="date" value={enquiryForm.followUpDate} onChange={e => setEnquiryForm(f => ({ ...f, followUpDate: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={enquiryForm.notes} onChange={e => setEnquiryForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowEnquiryDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEnquiry} className="bg-cyan-600 hover:bg-cyan-700">
                {editingEnquiry ? 'Update' : 'Add Enquiry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Admission Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Admission Open 2026-27" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={campaignForm.channel} onChange={e => setCampaignForm(f => ({ ...f, channel: e.target.value }))}>
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Social">Social Media</option>
                  <option value="Website">Website</option>
                </select>
              </div>
              <div>
                <Label>Budget (₹)</Label>
                <Input type="number" value={campaignForm.budget} onChange={e => setCampaignForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g., 5000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={campaignForm.endDate} onChange={e => setCampaignForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCampaign} className="bg-cyan-600 hover:bg-cyan-700">Create Campaign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}