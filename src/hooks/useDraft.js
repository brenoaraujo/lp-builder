import { useState, useEffect, useCallback } from 'react'
import { draftService } from '../lib/draftService'

export function useDraft(draftId) {
  const [config, setConfig] = useState(null)
  const [version, setVersion] = useState(0)
  const [collaborators, setCollaborators] = useState([])
  const [comments, setComments] = useState([])
  const [me, setMe] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load draft data
  const loadDraft = useCallback(async () => {
    if (!draftId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const data = await draftService.getDraft(draftId)
      
      setConfig(data.config)
      setVersion(data.version)
      setCollaborators(data.collaborators)
      setComments(data.comments)
      setMe(data.me)
    } catch (err) {
      console.error('Failed to load draft:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [draftId])

  // Save draft
  const saveDraft = useCallback(async (newConfig) => {
    if (!draftId || !newConfig) return

    try {
      const result = await draftService.updateDraft(draftId, version, newConfig)
      setConfig(newConfig)
      setVersion(result.version)
      return result
    } catch (err) {
      console.error('Failed to save draft:', err)
      throw err
    }
  }, [draftId, version])

  // Confirm draft (publish)
  const confirmDraft = useCallback(async () => {
    if (!draftId) return

    try {
      const result = await draftService.confirmDraft(draftId)
      return result
    } catch (err) {
      console.error('Failed to confirm draft:', err)
      throw err
    }
  }, [draftId])

  // Invite collaborators
  const inviteCollaborators = useCallback(async (emails, role) => {
    if (!draftId) return

    try {
      const result = await draftService.inviteCollaborators(draftId, emails, role)
      // Reload collaborators list
      const collaboratorsData = await draftService.listCollaborators(draftId)
      setCollaborators(collaboratorsData.collaborators)
      return result
    } catch (err) {
      console.error('Failed to invite collaborators:', err)
      throw err
    }
  }, [draftId])

  // Revoke collaborator
  const revokeCollaborator = useCallback(async (collabId) => {
    if (!draftId) return

    try {
      await draftService.revokeCollaborator(draftId, collabId)
      // Reload collaborators list
      const collaboratorsData = await draftService.listCollaborators(draftId)
      setCollaborators(collaboratorsData.collaborators)
    } catch (err) {
      console.error('Failed to revoke collaborator:', err)
      throw err
    }
  }, [draftId])

  // Load draft on mount
  useEffect(() => {
    loadDraft()
  }, [loadDraft])

  return {
    config,
    version,
    collaborators,
    comments,
    me,
    isLoading,
    error,
    saveDraft,
    confirmDraft,
    inviteCollaborators,
    revokeCollaborator,
    reload: loadDraft
  }
}

