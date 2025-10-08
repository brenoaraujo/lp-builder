// Draft service for server-based draft management
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kvtouoigckngalfvzmsp.supabase.co'

class DraftService {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`
    console.log('DraftService initialized with URL:', this.baseUrl)
  }

  async createDraft(clientEmail, seedConfig = {}) {
    console.log('Creating draft with:', { clientEmail, seedConfig })
    console.log('Fetching URL:', `${this.baseUrl}/drafts`)
    
    const response = await fetch(`${this.baseUrl}/drafts`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      },
      body: JSON.stringify({
        clientEmail,
        seedConfig
      })
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (!response.ok) {
      const error = await response.json()
      console.error('Draft creation error:', error)
      throw new Error(error.error || 'Failed to create draft')
    }

    const result = await response.json()
    console.log('Draft created successfully:', result)
    return result
  }

  async getDraft(draftId) {
    // Add cache-busting parameter to prevent browser caching
    const cacheBuster = Date.now()
    const response = await fetch(`${this.baseUrl}/drafts/${draftId}?t=${cacheBuster}`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch draft')
    }

    return response.json()
  }

  async updateDraft(draftId, baseVersion, patch) {
    const response = await fetch(`${this.baseUrl}/drafts/${draftId}`, {
      method: 'PATCH',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      },
      body: JSON.stringify({
        baseVersion,
        patch
      })
    })

    if (!response.ok) {
      const error = await response.json()
      if (response.status === 409) {
        // Version conflict
        const conflictData = await response.json()
        throw new Error(`Version conflict. Current version: ${conflictData.currentVersion}`)
      }
      throw new Error(error.error || 'Failed to update draft')
    }

    return response.json()
  }

  async confirmDraft(draftId) {
    const response = await fetch(`${this.baseUrl}/drafts/${draftId}/confirm`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to confirm draft')
    }

    return response.json()
  }

  async getPublishedPage(slug) {
    const response = await fetch(`${this.baseUrl}/p/${slug}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch published page')
    }

    return response.json()
  }

  async inviteCollaborators(draftId, emails, role) {
    const response = await fetch(`${this.baseUrl}/collaborators/${draftId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails,
        role
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to invite collaborators')
    }

    return response.json()
  }

  async listCollaborators(draftId) {
    const response = await fetch(`${this.baseUrl}/collaborators/${draftId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch collaborators')
    }

    return response.json()
  }

  async revokeCollaborator(draftId, collabId) {
    const response = await fetch(`${this.baseUrl}/collaborators/${draftId}/${collabId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to revoke collaborator')
    }

    return response.json()
  }

  async updateDraftStatus(draftId, status) {
    const response = await fetch(`${this.baseUrl}/drafts/${draftId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'}`,
      },
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update draft status')
    }

    return response.json()
  }
}

export const draftService = new DraftService()
