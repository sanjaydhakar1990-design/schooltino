import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ClipboardList, User, Clock } from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const modules = ['students', 'staff', 'classes', 'attendance', 'fee_invoices', 'fee_payments', 'notices', 'ai_papers'];

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    try {
      let url = `${API}/audit-logs?limit=100`;
      if (moduleFilter) url += `&module=${moduleFilter}`;
      const response = await axios.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const badges = {
      create: 'badge-success',
      update: 'badge-info',
      delete: 'badge-error',
      bulk_mark: 'badge-warning',
      generate: 'badge-info'
    };
    return badges[action] || 'badge-info';
  };

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('audit_logs')}</h1>
          <p className="text-slate-500 mt-1">Track all system activities</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 min-w-[150px]"
          data-testid="module-filter"
        >
          <option value="">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>{m.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t('no_data')}</p>
        </div>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timestamp')}</TableHead>
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('action')}</TableHead>
                <TableHead>{t('module')}</TableHead>
                <TableHead>{t('details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-medium">{log.user_name || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`badge ${getActionBadge(log.action)} capitalize`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{log.module.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {JSON.stringify(log.details).slice(0, 50)}...
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
