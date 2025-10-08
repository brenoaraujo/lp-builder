import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Send, 
  Eye, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Users, 
  FileText,
  Calendar,
  Mail,
  Building2,
  Globe,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

// Admin service for managing drafts
class AdminService {
  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvtouoigckngalfvzmsp.supabase.co'
    this.baseUrl = supabaseUrl + '/functions/v1'
  }

  async createMagicLink(clientEmail, charityName = '') {
    const response = await fetch(`${this.baseUrl}/final/send-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      },
      body: JSON.stringify({
        clientEmail,
        charityName
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create magic link')
    }

    return response.json()
  }

  async getAllDrafts() {
    const response = await fetch(`${this.baseUrl}/final/drafts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch drafts')
    }

    return response.json()
  }

  async getDraftStats() {
    const response = await fetch(`${this.baseUrl}/final/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch stats')
    }

    return response.json()
  }

  async deleteDraft(draftId) {
    const response = await fetch(`${this.baseUrl}/final/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete draft')
    }

    return response.json()
  }
}

const adminService = new AdminService()

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [drafts, setDrafts] = useState([])
  const [stats, setStats] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [createdMagicLink, setCreatedMagicLink] = useState(null)
  const [magicLinkForm, setMagicLinkForm] = useState({
    clientEmail: '',
    charityName: ''
  })

  // Check if already authenticated
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
    if (adminPassword === correctPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('adminAuthenticated', 'true')
      toast.success('Welcome to Admin Dashboard')
    } else {
      toast.error('Invalid password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('adminAuthenticated')
    setAdminPassword('')
  }

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [draftsData, statsData] = await Promise.all([
        adminService.getAllDrafts(),
        adminService.getDraftStats()
      ])
      setDrafts(draftsData.drafts || [])
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMagicLink = async () => {
    if (!magicLinkForm.clientEmail.trim()) {
      toast.error('Please enter a client email')
      return
    }

    try {
      setIsCreatingLink(true)
      const result = await adminService.createMagicLink(
        magicLinkForm.clientEmail,
        magicLinkForm.charityName
      )
      
      // Store the created magic link
      setCreatedMagicLink(result.magicLink)
      toast.success(`Magic link created for ${magicLinkForm.clientEmail}`)
      
      // Refresh the drafts list
      await loadData()
    } catch (error) {
      console.error('Failed to create magic link:', error)
      toast.error(error.message || 'Failed to create magic link')
    } finally {
      setIsCreatingLink(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const getStatusBadge = (status, draft) => {
    // Determine status based on draft data
    let displayStatus = status
    let statusColor = 'bg-blue-100 text-blue-800'
    
    if (status === 'active') {
      // Check if it's been opened (has more than just the initial version)
      const hasBeenOpened = draft.latestVersion && draft.latestVersion.version > 1
      if (hasBeenOpened) {
        displayStatus = 'in-progress'
        statusColor = 'bg-yellow-100 text-yellow-800'
      } else {
        displayStatus = 'Invited'
        statusColor = 'bg-orange-100 text-orange-800'
      }
    }
    
    const variants = {
      invited: 'bg-orange-100 text-orange-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={variants[displayStatus] || variants.active}>
        {displayStatus}
      </Badge>
    )
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState(null)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState(null)

  const handleDeleteDraft = async (draftId) => {
    setDraftToDelete(draftId)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (draft) => {
    setSelectedDraft(draft)
    setDetailsSheetOpen(true)
  }

  const confirmDeleteDraft = async () => {
    if (!draftToDelete) return

    try {
      await adminService.deleteDraft(draftToDelete)
      toast.success('Draft deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Failed to delete draft:', error)
      toast.error(error.message || 'Failed to delete draft')
    } finally {
      setDeleteDialogOpen(false)
      setDraftToDelete(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
            <p className="text-center text-sm text-gray-600">
              Enter admin password to access the dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={!adminPassword.trim()}
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage landing page drafts and client access</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDrafts || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDrafts || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedDrafts || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="drafts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="drafts">All Drafts</TabsTrigger>
            <TabsTrigger value="send-link">Send Magic Link</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Draft Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Charity</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>App Link</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drafts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No drafts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        drafts.map((draft) => {
                          const charityInfo = draft.latestVersion?.config_json?.charityInfo || {}
                          const appLink = draft.latestVersion?.config_json?.publishedUrl || 
                                         `${window.location.origin}/configurator/${draft.id}`
                          
                          return (
                            <TableRow key={draft.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {charityInfo.charityName || 'Unnamed Charity'}
                                  </div>
                                  {charityInfo.charitySite && (
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {charityInfo.charitySite}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  {draft.client_email}
                                </div>
                              </TableCell>
                              
                              
                              <TableCell>
                                {getStatusBadge(draft.status, draft)}
                              </TableCell>
                              
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(draft.created_at)}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(appLink, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Open
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(appLink)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewDetails(draft)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteDraft(draft.id)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send-link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Magic Link</CardTitle>
                <p className="text-sm text-gray-600">
                  Send a magic link to a client to start the onboarding process
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@charity.org"
                      value={magicLinkForm.clientEmail}
                      onChange={(e) => setMagicLinkForm(prev => ({
                        ...prev,
                        clientEmail: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charityName">Charity Name (Optional)</Label>
                    <Input
                      id="charityName"
                      placeholder="Charity Name"
                      value={magicLinkForm.charityName}
                      onChange={(e) => setMagicLinkForm(prev => ({
                        ...prev,
                        charityName: e.target.value
                      }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateMagicLink}
                  disabled={isCreatingLink || !magicLinkForm.clientEmail.trim()}
                  className="flex items-center gap-2"
                >
                  {isCreatingLink ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isCreatingLink ? 'Creating...' : 'Create Magic Link'}
                </Button>

                {/* Display created magic link */}
                {createdMagicLink && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Magic Link Created!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={createdMagicLink}
                        readOnly
                        className="flex-1 text-sm font-mono bg-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdMagicLink)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(createdMagicLink, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Share this link with the charity to start their landing page creation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Draft Details Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Draft Details</SheetTitle>
          </SheetHeader>
          {selectedDraft && (
            <div className="space-y-6 mt-6">
              {/* Logo Section */}
              {selectedDraft.latestVersion?.config_json?.charityInfo?.charityLogo && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Charity Logo</Label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedDraft.latestVersion.config_json.charityInfo.charityLogo} 
                      alt="Charity logo"
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedDraft.latestVersion.config_json.charityInfo.charityLogo)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Charity Name</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDraft.latestVersion?.config_json?.charityInfo?.charityName || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Client Email</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedDraft.client_email}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Raffle Type</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDraft.latestVersion?.config_json?.charityInfo?.raffleType || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Launch Date</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDraft.latestVersion?.config_json?.charityInfo?.campaignLaunchDate ? 
                      new Date(selectedDraft.latestVersion.config_json.charityInfo.campaignLaunchDate).toLocaleDateString() : 
                      'Not specified'
                    }
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDraft.latestVersion?.config_json?.charityInfo?.charitySite || 'Not specified'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDraft.status, selectedDraft)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedDraft.created_at)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">App Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(
                        selectedDraft.latestVersion?.config_json?.publishedUrl || 
                        `${window.location.origin}/configurator/${selectedDraft.id}`, 
                        '_blank'
                      )}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(
                        selectedDraft.latestVersion?.config_json?.publishedUrl || 
                        `${window.location.origin}/configurator/${selectedDraft.id}`
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this draft? This action cannot be undone and will permanently remove all associated data.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDraft}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
