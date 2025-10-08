import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, Trash2, ExternalLink, Search } from 'lucide-react';
import { createInvite, listInvites, updateInviteByToken, softDeleteInvite } from './db/invites.js';
import { getAdminClient } from './lib/adminClient.js';

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

    console.log('📋 Loaded invites:', data?.length || 0, 'total');
    console.log('📋 Deleted invites:', data?.filter(invite => invite.is_deleted)?.length || 0);
    console.log('📋 Active invites:', data?.filter(invite => !invite.is_deleted)?.length || 0);

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
      throw error;
    }

    console.log('✅ Delete successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error soft deleting invite:', error);
    return { success: false, error: error.message };
  }
}

import { toast } from 'sonner';

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
        
        console.log('📋 Final filtered invites:', filteredData.length);
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

  // Update invite status
  const handleStatusChange = async (inviteId, newStatus) => {
    try {
      const result = await updateInviteById(inviteId, { status: newStatus });
      if (result.success) {
        toast.success('Status updated successfully');
        loadInvites();
      } else {
        toast.error('Failed to update status: ' + result.error);
      }
    } catch (error) {
      toast.error('Error updating status: ' + error.message);
    }
  };

  // Soft delete invite
  const handleDeleteInvite = async (inviteId, publicToken) => {
    if (!confirm('Are you sure you want to delete this invite? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await adminSoftDeleteInvite(publicToken);
      if (result.success) {
        toast.success('Invite deleted successfully');
        loadInvites();
      } else {
        toast.error('Failed to delete invite: ' + result.error);
      }
    } catch (error) {
      toast.error('Error deleting invite: ' + error.message);
    }
  };

  // Copy invite link
  const copyInviteLink = (token) => {
    const link = `${window.location.origin}${window.location.pathname}#/onboarding?invite=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Invite link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage landing page invites</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                  <Button onClick={handleCreateInvite} className="flex-1">
                    Create Invite
                  </Button>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="handed_off">Handed Off</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invites List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading invites...</p>
            </div>
          ) : invites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No invites found</p>
              </CardContent>
            </Card>
          ) : (
            invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">{invite.charity_name}</h3>
                        <Select
                          value={invite.status}
                          onValueChange={(value) => handleStatusChange(invite.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invited">Invited</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="handed_off">Handed Off</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Contact:</strong> {invite.contact_name} ({invite.contact_email})</p>
                        <p><strong>Created:</strong> {new Date(invite.created_at).toLocaleString()}</p>
                        <p><strong>Updated:</strong> {new Date(invite.updated_at).toLocaleString()}</p>
                        <p><strong>Token:</strong> <code className="bg-gray-100 px-1 rounded">{invite.public_token}</code></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.public_token)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`#/onboarding?invite=${invite.public_token}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvite(invite.id, invite.public_token)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
