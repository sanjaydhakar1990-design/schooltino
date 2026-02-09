import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Puzzle, CreditCard, Fingerprint, MessageSquare, BookOpen,
  Shield, Cloud, IndianRupee, Scan, Smartphone, Mail,
  Bell, FileText, Calculator, Landmark, Key, FolderArchive,
  HardDrive, Database, Flame, Settings, Zap, Lock, RefreshCw,
  ExternalLink, Phone, Wifi, CreditCard as CardIcon
} from 'lucide-react';

const integrationCategories = [
  {
    title: 'Payment Gateways',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    items: [
      { name: 'Razorpay', description: 'Online fee collection, auto-reconciliation', status: 'active', icon: IndianRupee },
      { name: 'CCAvenue', description: 'Multi-mode payments (CC, DC, Net Banking, UPI)', status: 'available', icon: CardIcon },
      { name: 'HDFC SmartHub', description: 'Bank integration for fee collection', status: 'coming_soon', icon: Landmark },
      { name: 'Paytm', description: 'UPI and wallet payments', status: 'available', icon: Smartphone },
    ]
  },
  {
    title: 'Biometric & Access',
    icon: Fingerprint,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    items: [
      { name: 'Fingerprint Devices', description: 'MANTRA, Startek, SecuGen', status: 'active', icon: Fingerprint },
      { name: 'Face Recognition', description: 'AI-powered attendance', status: 'active', icon: Scan },
      { name: 'RFID Cards', description: 'Contactless attendance', status: 'available', icon: Wifi },
      { name: 'NFC Tags', description: 'Transport attendance', status: 'coming_soon', icon: Smartphone },
    ]
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    items: [
      { name: 'SMS Gateway', description: 'MSG91, Twilio integration', status: 'active', icon: Phone },
      { name: 'WhatsApp Business API', description: 'Official WhatsApp messaging', status: 'active', icon: MessageSquare },
      { name: 'Email', description: 'SMTP, SendGrid, Mailgun', status: 'available', icon: Mail },
      { name: 'Push Notifications', description: 'Firebase FCM', status: 'available', icon: Bell },
    ]
  },
  {
    title: 'Accounting & Finance',
    icon: Calculator,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    items: [
      { name: 'Tally ERP', description: 'Auto-sync fee data', status: 'active', icon: BookOpen },
      { name: 'Zoho Books', description: 'Cloud accounting', status: 'available', icon: FileText },
      { name: 'QuickBooks', description: 'Financial reporting', status: 'coming_soon', icon: Calculator },
    ]
  },
  {
    title: 'Government & Compliance',
    icon: Shield,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    items: [
      { name: 'UDISE+', description: 'Student data reporting', status: 'available', icon: Landmark },
      { name: 'Aadhaar', description: 'Identity verification', status: 'available', icon: Key },
      { name: 'DigiLocker', description: 'Digital certificates', status: 'coming_soon', icon: FolderArchive },
    ]
  },
  {
    title: 'Cloud & Storage',
    icon: Cloud,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    items: [
      { name: 'AWS S3', description: 'Media storage', status: 'active', icon: HardDrive },
      { name: 'Google Cloud', description: 'Backup & analytics', status: 'available', icon: Cloud },
      { name: 'Firebase', description: 'Real-time database', status: 'available', icon: Flame },
    ]
  },
];

const statusConfig = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  available: { label: 'Available', className: 'bg-blue-100 text-blue-700' },
  coming_soon: { label: 'Coming Soon', className: 'bg-gray-100 text-gray-500' },
};

const stats = [
  { label: '20+ Integrations', icon: Puzzle },
  { label: 'Plug & Play', icon: Zap },
  { label: 'Secure APIs', icon: Lock },
  { label: 'Auto-Sync', icon: RefreshCw },
];

export default function IntegrationsHubPage() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState(() => {
    const initial = {};
    integrationCategories.forEach(cat => {
      cat.items.forEach(item => {
        initial[item.name] = item.status;
      });
    });
    return initial;
  });

  const toggleStatus = (name, currentStatus) => {
    if (currentStatus === 'coming_soon') return;
    setStatuses(prev => ({
      ...prev,
      [name]: prev[name] === 'active' ? 'available' : 'active'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 md:p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Puzzle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Integrations Hub</h1>
            <p className="text-violet-100 mt-1">Integrate to Innovate — The Schooltino Way</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-violet-600" />
              </div>
              <span className="font-semibold text-gray-800 text-sm">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrationCategories.map(category => (
        <div key={category.title} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
              <category.icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.items.map(item => {
              const currentStatus = statuses[item.name];
              const config = statusConfig[currentStatus];
              return (
                <Card key={item.name} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                        <item.icon className={`w-6 h-6 ${category.textColor}`} />
                      </div>
                      <Badge className={config.className}>
                        {config.label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                    <Button
                      size="sm"
                      variant={currentStatus === 'coming_soon' ? 'outline' : 'default'}
                      className={currentStatus === 'coming_soon' ? 'w-full text-gray-400 cursor-not-allowed' : currentStatus === 'active' ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full bg-violet-600 hover:bg-violet-700'}
                      disabled={currentStatus === 'coming_soon'}
                      onClick={() => toggleStatus(item.name, currentStatus)}
                    >
                      {currentStatus === 'coming_soon' ? 'Coming Soon' : currentStatus === 'active' ? (
                        <><Settings className="w-4 h-4 mr-2" /> Configured</>
                      ) : (
                        <><ExternalLink className="w-4 h-4 mr-2" /> Configure</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Need a custom integration?</h3>
          <p className="text-gray-500 mb-4">We can build custom integrations tailored to your school's needs.</p>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Mail className="w-4 h-4 mr-2" /> Contact Us
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
