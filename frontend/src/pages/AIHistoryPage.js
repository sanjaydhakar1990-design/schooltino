import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  History, 
  Undo2, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  FileText, 
  Terminal,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const actionTypeIcons = {
  voice: Mic,
  paper: FileText,
  content: Sparkles,
  command: Terminal
};

const actionTypeLabels = {
  voice: 'Voice Command',
  paper: 'Paper Generated',
  content: 'Content Created',
  command: 'AI Command'
};

const actionTypeColors = {
  voice: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  paper: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  content: 'bg-green-500/10 text-green-500 border-green-500/20',
  command: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
};

const statusColors = {
  completed: 'bg-emerald-500/10 text-emerald-500',
  failed: 'bg-red-500/10 text-red-500',
  undone: 'bg-amber-500/10 text-amber-500',
  restored: 'bg-blue-500/10 text-blue-500'
};

const statusIcons = {
  completed: CheckCircle2,
  failed: XCircle,
  undone: AlertCircle,
  restored: RotateCcw
};

export default function AIHistoryPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [undoingId, setUndoingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const schoolId = user?.school_id || 'school123';

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterType === 'all' 
        ? `${API_URL}/api/ai-history/list/${schoolId}?limit=100`
        : `${API_URL}/api/ai-history/list/${schoolId}?limit=100&action_type=${filterType}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('History load nahi ho paya');
    } finally {
      setLoading(false);
    }
  }, [schoolId, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-history/stats/${schoolId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  const handleUndo = async (conversationId) => {
    try {
      setUndoingId(conversationId);
      const response = await fetch(`${API_URL}/api/ai-history/undo?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, reason: 'User requested undo' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Undo failed');
      }

      const result = await response.json();
      toast.success('Action undo ho gaya! ✅');
      fetchHistory();
      fetchStats();
    } catch (error) {
      console.error('Undo error:', error);
      toast.error(error.message || 'Undo nahi ho paya');
    } finally {
      setUndoingId(null);
    }
  };

  const handleRestore = async (conversationId) => {
    try {
      setUndoingId(conversationId);
      const response = await fetch(`${API_URL}/api/ai-history/restore/${conversationId}?school_id=${schoolId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Restore failed');
      }

      toast.success('Action restore ho gaya! ✅');
      fetchHistory();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error.message || 'Restore nahi ho paya');
    } finally {
      setUndoingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Kya aap purani history (30 din se zyada) delete karna chahte hain?')) return;

    try {
      const response = await fetch(`${API_URL}/api/ai-history/clear/${schoolId}?days_old=30`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to clear history');
      
      const result = await response.json();
      toast.success(`${result.deleted_count} purani conversations delete ho gayi`);
      fetchHistory();
      fetchStats();
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('History clear nahi ho paya');
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.user_input?.toLowerCase().includes(query) ||
      conv.ai_response?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6" data-testid="ai-history-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-indigo-500" />
            AI Conversation History
          </h1>
          <p className="text-muted-foreground mt-1">
            Apni sabhi AI interactions yahan dekhen aur manage karein
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchHistory}
            className="gap-2"
            data-testid="refresh-history-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearHistory}
            className="gap-2"
            data-testid="clear-history-btn"
          >
            <Trash2 className="w-4 h-4" />
            Clear Old
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total AI Uses</p>
                  <p className="text-2xl font-bold">{stats.total_conversations}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                  <p className="text-2xl font-bold">{stats.last_7_days}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Used</p>
                  <p className="text-lg font-bold capitalize">{stats.most_used || 'N/A'}</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commands</p>
                  <p className="text-2xl font-bold">{stats.by_type?.command || 0}</p>
                </div>
                <Terminal className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-history-input"
              />
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter: {filterType === 'all' ? 'All' : actionTypeLabels[filterType]}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 bg-background border rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                  {['all', 'voice', 'paper', 'content', 'command'].map(type => (
                    <button
                      key={type}
                      onClick={() => { setFilterType(type); setShowFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors ${filterType === type ? 'bg-muted' : ''}`}
                      data-testid={`filter-${type}`}
                    >
                      {type === 'all' ? 'All Types' : actionTypeLabels[type]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Koi AI conversation nahi mili</h3>
              <p className="text-muted-foreground mt-1">
                Jab aap AI features use karenge, history yahan dikhegi
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv) => {
            const ActionIcon = actionTypeIcons[conv.action_type] || Sparkles;
            const StatusIcon = statusIcons[conv.status] || CheckCircle2;
            
            return (
              <Card 
                key={conv.id} 
                className={`transition-all hover:shadow-md ${conv.status === 'undone' ? 'opacity-60' : ''}`}
                data-testid={`conversation-${conv.id}`}
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Icon & Type */}
                    <div className={`p-3 rounded-lg ${actionTypeColors[conv.action_type]} self-start`}>
                      <ActionIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={actionTypeColors[conv.action_type]}>
                          {actionTypeLabels[conv.action_type]}
                        </Badge>
                        <Badge variant="secondary" className={statusColors[conv.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {conv.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(conv.created_at)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">You asked:</p>
                          <p className="text-sm">{conv.user_input}</p>
                        </div>
                        <div className="bg-indigo-500/5 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Tino said:</p>
                          <p className="text-sm">{conv.ai_response}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 self-start">
                      {conv.can_undo && conv.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUndo(conv.id)}
                          disabled={undoingId === conv.id}
                          className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                          data-testid={`undo-btn-${conv.id}`}
                        >
                          {undoingId === conv.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <Undo2 className="w-4 h-4" />
                          )}
                          Undo
                        </Button>
                      )}
                      {conv.status === 'undone' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(conv.id)}
                          disabled={undoingId === conv.id}
                          className="gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                          data-testid={`restore-btn-${conv.id}`}
                        >
                          {undoingId === conv.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
