import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Copy, Trash2, ExternalLink, Search, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { createInvite, listInvites, updateInviteByToken, softDeleteInvite } from './db/invites.js';
import { getAdminClient } from './lib/adminClient.js';
import AdminInviteDetails from './components/AdminInviteDetails.jsx';

// Admin-specific functions using service key
async function adminListInvites() {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }


    return { success: true, data };
  } catch (error) {
    console.error('Error listing invites:', error);
    return { success: false, error: error.message };
  }
}

async function adminSoftDeleteInvite(token) {
  try {
    console.log('🗑️ Attempting to delete invite with token:', token);
    const adminClient = getAdminClient();
    
    // Test the admin client by checking its auth state
    const { data: { user }, error: authError } = await adminClient.auth.getUser();
    console.log('🔑 Admin client auth state:', { user: !!user, authError: !!authError });
    
    // First, let's check if the invite exists
    const { data: existingInvite, error: fetchError } = await adminClient
      .from('invites')
      .select('*')
      .eq('public_token', token)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching invite:', fetchError);
      throw fetchError;
    }
    
    console.log('📋 Found invite:', existingInvite);
    
    // Now try to update it
    const { data, error } = await adminClient
      .from('invites')
      .update({
        is_deleted: true,
        status: 'void',
        updated_at: new Date().toISOString()
      })
      .eq('public_token', token)
      .select()
      .single();

    if (error) {
      console.error('❌ Delete error:', error);
      console.error('❌ Delete error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('✅ Delete successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error soft deleting invite:', error);
    return { success: false, error: error.message };
  }
}

export default function AdminPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({
    charity_name: '',
    contact_name: '',
    contact_email: ''
  });
  
  // Details modal state
  const [detailsInvite, setDetailsInvite] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState(null);

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRaffleType = (invite) => {
    return invite.onboarding_json?.charityInfo?.raffleType || 'N/A';
  };

  const getCharityName = (invite) => {
    // Use user-provided charity name from onboarding if available, otherwise fall back to production name
    return invite.onboarding_json?.charityInfo?.charityName || invite.charity_name;
  };

  // Derive a human-readable status for admin listing
  const hasStartedOnboarding = (invite) => {
    const oj = invite?.onboarding_json;
    return oj && typeof oj === 'object' && Object.keys(oj).length > 0;
  };

  const getDisplayStatus = (invite) => {
    const s = invite?.status;
    if (s === 'void') return 'Void';
    if (s === 'submitted' || s === 'handed_off') return 'Submitted';
    if (s === 'in_progress') return 'In Progress';
    // invited or unknown → check if onboarding started
    return hasStartedOnboarding(invite) ? 'Onboarding' : 'Invited';
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'invited': return 'invited';
      case 'in_progress': return 'in_progress';
      case 'submitted': return 'submitted';
      case 'handed_off': return 'handed_off';
      case 'void': return 'void';
      default: return 'default';
    }
  };

  // Action handlers
  const openDetails = (invite) => {
    setDetailsInvite(invite);
    setDetailsOpen(true);
  };

  const handlePreview = (invite) => {
    const url = `${window.location.origin}/#/onboarding?invite=${invite.public_token}`;
    window.open(url, '_blank');
  };

  const handleCopy = async (invite) => {
    const url = `${window.location.origin}/#/onboarding?invite=${invite.public_token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Invite link for ${invite.charity_name} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy invite link');
    }
  };

  const handleDelete = (invite) => {
    setInviteToDelete(invite);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!inviteToDelete) return;

    try {
      const result = await adminSoftDeleteInvite(inviteToDelete.public_token);
      if (result.success) {
        toast.success('Invite deleted successfully');
        // Manual sync to Notion as backup (fire-and-forget to avoid UI delay)
        fetch('https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ token: inviteToDelete.public_token, is_deleted: true })
        }).catch(() => {});
        loadInvites();
      } else {
        toast.error('Failed to delete invite: ' + result.error);
      }
    } catch (error) {
      toast.error('Error deleting invite: ' + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setInviteToDelete(null);
    }
  };

  // Load invites
  const loadInvites = async () => {
    setLoading(true);
    try {
      const result = await adminListInvites();
      if (result.success) {
        // Filter the data locally since adminListInvites doesn't support filters yet
        let filteredData = result.data || [];
        
        // First, filter out deleted invites
        filteredData = filteredData.filter(invite => !invite.is_deleted);
        
        if (search) {
          filteredData = filteredData.filter(invite => 
            invite.charity_name?.toLowerCase().includes(search.toLowerCase()) ||
            invite.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
            invite.contact_email?.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (statusFilter !== 'all') {
          filteredData = filteredData.filter(invite => invite.status === statusFilter);
        }
        
        setInvites(filteredData);
      } else {
        toast.error('Failed to load invites: ' + result.error);
      }
    } catch (error) {
      toast.error('Error loading invites: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  // Create new invite
  const handleCreateInvite = async () => {
    if (!newInvite.charity_name || !newInvite.contact_name || !newInvite.contact_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await createInvite(newInvite);
      
      if (result.success) {
        toast.success('Invite created successfully');
        setCreateDialogOpen(false);
        setNewInvite({ charity_name: '', contact_name: '', contact_email: '' });
        loadInvites();
      } else {
        toast.error('Failed to create invite: ' + result.error);
      }
    } catch (error) {
      toast.error('Error creating invite: ' + error.message);
    }
  };


  // Load invites on mount and when filters change
  useEffect(() => {
    loadInvites();
  }, [search, statusFilter]);

  // Check admin access
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAdminLogin = () => {
    const expectedPasscode = import.meta.env.VITE_ADMIN_PASSCODE;
    if (adminPasscode === expectedPasscode) {
      setIsAuthenticated(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid passcode');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="passcode">Enter admin passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Enter passcode"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Access Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto ">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className='flex flex-col'>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage landing page invites</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0099EB] hover:bg-[#0088d3] cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="charity_name">Charity Name *</Label>
                  <Input
                    id="charity_name"
                    value={newInvite.charity_name}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, charity_name: e.target.value }))}
                    placeholder="Enter charity name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={newInvite.contact_name}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newInvite.contact_email}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="Enter contact email"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateInvite} className="flex-1 bg-[#0099EB] hover:bg-[#0088d3] cursor-pointer">
                    Create Invite
                  </Button>
                 
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by charity name, contact name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="handed_off">Handed Off</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invites Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading invites...</p>
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No invites found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Charity</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Raffle Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow 
                      key={invite.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetails(invite)}
                    >
                      <TableCell className="font-medium">
                        {getCharityName(invite)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{invite.contact_name}</div>
                          <div className="text-sm text-muted-foreground">{invite.contact_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRaffleType(invite)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(invite.status)}>
                          {getDisplayStatus(invite)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invite.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(invite)}
                            title="View Details"
                          >
                            <Info className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(invite)}
                            title="Preview Invite"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(invite)}
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                            
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(invite)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      
      
      {/* Details Modal */}
      <AdminInviteDetails 
        invite={detailsInvite}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invite</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the invite for <strong>{inviteToDelete?.charity_name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
