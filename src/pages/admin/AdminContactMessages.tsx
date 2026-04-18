import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  AlertCircle,
  Mail,
  MailOpen,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string | null;
  created_at: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  unread: { label: 'Unread', icon: Mail, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' },
  read: { label: 'Read', icon: MailOpen, color: 'bg-muted text-muted-foreground' },
  replied: { label: 'Replied', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' },
  archived: { label: 'Archived', icon: XCircle, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' },
};

const AdminContactMessages = () => {
  useDocumentTitle('Contact Messages - Admin');
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
    enabled: isAdmin,
  });


  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      setDeleteId(null);
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      updateStatus(msg.id, 'read');
    }
  };

  const filtered = (messages || []).filter(msg => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadCount = (messages || []).filter(m => m.status === 'unread').length;

  const getStatusBadge = (status: string | null) => {
    const cfg = statusConfig[status || 'unread'] || statusConfig.unread;
    const Icon = cfg.icon;
    return (
      <Badge variant="outline" className={`${cfg.color} gap-1 text-[10px] sm:text-xs`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Contact Messages" subtitle={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10 sm:h-11 rounded-xl text-sm">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className="w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors active:scale-[0.99]"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.status === 'unread' ? 'bg-primary/15' : 'bg-muted'}`}>
                    {msg.status === 'unread' ? (
                      <Mail className="h-5 w-5 text-primary" />
                    ) : (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${msg.status === 'unread' ? 'font-bold' : 'font-medium'}`}>{msg.name}</p>
                      {getStatusBadge(msg.status)}
                    </div>
                    <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">{msg.subject || 'No subject'}</p>
                    <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{msg.created_at ? format(new Date(msg.created_at), 'PP p') : '-'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className={`cursor-pointer ${msg.status === 'unread' ? 'bg-primary/5 font-medium' : ''}`}
                      onClick={() => openMessage(msg)}
                    >
                      <TableCell>
                        <div>
                          <p className={`text-sm ${msg.status === 'unread' ? 'font-bold' : 'font-medium'}`}>{msg.name}</p>
                          <p className="text-xs text-muted-foreground">{msg.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm">{msg.subject || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{msg.message}</TableCell>
                      <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {msg.created_at ? format(new Date(msg.created_at), 'PP') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMessage(msg)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(msg.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" />
                  {selectedMessage.subject || 'No Subject'}
                </DialogTitle>
                <DialogDescription className="space-y-1 text-left">
                  <span className="block"><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</span>
                  <span className="block"><strong>Date:</strong> {selectedMessage.created_at ? format(new Date(selectedMessage.created_at), 'PPpp') : '-'}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted/50 rounded-xl p-4 text-sm whitespace-pre-wrap break-words leading-relaxed">
                {selectedMessage.message}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Select value={selectedMessage.status || 'unread'} onValueChange={(val) => updateStatus(selectedMessage.id, val)}>
                  <SelectTrigger className="w-full sm:w-36 h-9 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your message'}`, '_blank')}
                >
                  <Mail className="h-4 w-4" />
                  Reply via Email
                </Button>
                <Button variant="destructive" size="sm" className="gap-1" onClick={() => { setDeleteId(selectedMessage.id); setSelectedMessage(null); }}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>Are you sure you want to delete this message? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMessage(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContactMessages;
