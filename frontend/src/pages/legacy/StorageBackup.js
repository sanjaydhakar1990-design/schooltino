import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  HardDrive,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Loader2,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Image,
  Video,
  Sparkles,
  AlertTriangle,
  Calendar,
  Server,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function StorageBackup() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storageConfig, setStorageConfig] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [backups, setBackups] = useState([]);
  const [aiSetupRunning, setAiSetupRunning] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  
  const [configForm, setConfigForm] = useState({
    provider: 'local',
    auto_backup: true,
    backup_schedule: 'daily',
    retention_days: 90
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (schoolId) {
      fetchAll();
    }
  }, [schoolId]);

  const fetchAll = async () => {
    try {
      const [configRes, usageRes, backupsRes] = await Promise.all([
        axios.get(`${API}/storage/config/${schoolId}`, { headers }),
        axios.get(`${API}/storage/usage/${schoolId}`, { headers }),
        axios.get(`${API}/storage/backups/${schoolId}`, { headers })
      ]);
      
      setStorageConfig(configRes.data);
      setStorageUsage(usageRes.data);
      setBackups(backupsRes.data || []);
      
      if (configRes.data) {
        setConfigForm({
          provider: configRes.data.provider || 'local',
          auto_backup: configRes.data.auto_backup ?? true,
          backup_schedule: configRes.data.backup_schedule || 'daily',
          retention_days: configRes.data.retention_days || 90
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAISetup = async () => {
    setAiSetupRunning(true);
    try {
      const res = await axios.post(`${API}/storage/ai-setup?school_id=${schoolId}`, {}, { headers });
      toast.success(res.data.message);
      fetchAll();
    } catch (error) {
      toast.error('AI setup failed');
    } finally {
      setAiSetupRunning(false);
    }
  };

  const handleTriggerBackup = async (backupType = 'full') => {
    setBackupRunning(true);
    try {
      const res = await axios.post(`${API}/storage/backup/trigger?school_id=${schoolId}&backup_type=${backupType}`, {}, { headers });
      toast.success(`Backup completed! Size: ${res.data.size_mb} MB`);
      fetchAll();
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setBackupRunning(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await axios.post(`${API}/storage/configure`, {
        ...configForm,
        school_id: schoolId,
        backup_items: ['database', 'documents', 'photos']
      }, { headers });
      toast.success('Configuration saved!');
      setShowConfigDialog(false);
      fetchAll();
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="storage-backup">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Cloud className="w-7 h-7 text-indigo-600" />
            Storage & Backup
          </h1>
          <p className="text-slate-500 mt-1">AI-powered data management & cloud backup</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAISetup}
            disabled={aiSetupRunning}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {aiSetupRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> AI Auto-Setup</>
            )}
          </Button>
          <Button
            onClick={() => handleTriggerBackup('full')}
            disabled={backupRunning}
          >
            {backupRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Backing up...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Backup Now</>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
            <Settings className="w-4 h-4 mr-2" /> Configure
          </Button>
        </div>
      </div>

      {/* AI Recommendations Banner */}
      {storageConfig?.ai_recommendations && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-900 mb-2">AI Recommendations</p>
              <ul className="space-y-1">
                {storageConfig.ai_recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-purple-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Storage Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {storageUsage?.usage?.database_mb?.toFixed(1) || 0} MB
              </p>
              <p className="text-sm text-slate-500">Database</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {storageUsage?.usage?.documents_mb?.toFixed(1) || 0} MB
              </p>
              <p className="text-sm text-slate-500">Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {storageUsage?.usage?.backups_mb?.toFixed(1) || 0} MB
              </p>
              <p className="text-sm text-slate-500">Backups</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {storageUsage?.usage?.total_mb?.toFixed(1) || 0} MB
              </p>
              <p className="text-sm text-slate-500">Total Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Configuration Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Current Configuration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Storage Provider</span>
              <span className="font-medium text-slate-900 capitalize">
                {storageConfig?.provider || 'Local'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Auto Backup</span>
              <span className={`font-medium ${storageConfig?.auto_backup ? 'text-emerald-600' : 'text-slate-500'}`}>
                {storageConfig?.auto_backup ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Backup Schedule</span>
              <span className="font-medium text-slate-900 capitalize">
                {storageConfig?.backup_schedule || 'Daily'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Retention Period</span>
              <span className="font-medium text-slate-900">
                {storageConfig?.retention_days || 90} Days
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Storage Tier</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded capitalize">
                {storageConfig?.storage_tier || 'Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleTriggerBackup('database_only')}
              disabled={backupRunning}
              className="h-auto py-3 flex-col"
            >
              <Database className="w-5 h-5 mb-1" />
              <span className="text-xs">Database Backup</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTriggerBackup('documents_only')}
              disabled={backupRunning}
              className="h-auto py-3 flex-col"
            >
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-xs">Documents Backup</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTriggerBackup('incremental')}
              disabled={backupRunning}
              className="h-auto py-3 flex-col"
            >
              <RefreshCw className="w-5 h-5 mb-1" />
              <span className="text-xs">Incremental</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTriggerBackup('full')}
              disabled={backupRunning}
              className="h-auto py-3 flex-col"
            >
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-xs">Full Backup</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Backup History
        </h3>
        
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No backups yet. Click "Backup Now" to create your first backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-slate-100">
                    <td className="py-3 text-sm text-slate-900">
                      {formatDate(backup.started_at)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded capitalize">
                        {backup.backup_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-900">
                      {backup.size_mb?.toFixed(2) || 0} MB
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 w-fit ${
                        backup.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : backup.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {backup.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {backup.status === 'in_progress' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {backup.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {backup.status === 'completed' && (
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Storage Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Storage Provider</label>
              <select
                value={configForm.provider}
                onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              >
                <option value="local">Local Storage</option>
                <option value="aws_s3">Amazon S3</option>
                <option value="google_cloud">Google Cloud Storage</option>
                <option value="azure">Azure Blob Storage</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700">Auto Backup</label>
              <input
                type="checkbox"
                checked={configForm.auto_backup}
                onChange={(e) => setConfigForm({ ...configForm, auto_backup: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Backup Schedule</label>
              <select
                value={configForm.backup_schedule}
                onChange={(e) => setConfigForm({ ...configForm, backup_schedule: e.target.value })}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Retention Period (Days)</label>
              <Input
                type="number"
                value={configForm.retention_days}
                onChange={(e) => setConfigForm({ ...configForm, retention_days: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
