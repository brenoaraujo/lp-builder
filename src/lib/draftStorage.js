// src/lib/draftStorage.js
// Database-first storage system for draft configurations
import { draftService } from './draftService'

export class DraftStorage {
  constructor(draftId) {
    this.draftId = draftId
  }

  // Theme colors - database only
  async getThemeColors() {
    if (!this.draftId) return {}
    
    try {
      const draft = await draftService.getDraft(this.draftId)
      return draft?.config?.theme?.colors || {}
    } catch (error) {
      console.error('Failed to load theme colors:', error)
      return {}
    }
  }

  async setThemeColors(colors) {
    if (!this.draftId) return
    
    try {
      const currentDraft = await draftService.getDraft(this.draftId)
      const currentConfig = currentDraft.config
      
      await draftService.updateDraft(this.draftId, currentDraft.version, {
        ...currentConfig,
        theme: {
          ...currentConfig.theme,
          colors
        }
      })
    } catch (error) {
      console.error('Failed to save theme colors:', error)
      throw error
    }
  }

  // Theme mode - database only
  async getThemeMode() {
    if (!this.draftId) return 'light'
    
    try {
      const draft = await draftService.getDraft(this.draftId)
      return draft?.config?.theme?.mode || 'light'
    } catch (error) {
      console.error('Failed to load theme mode:', error)
      return 'light'
    }
  }

  async setThemeMode(mode) {
    if (!this.draftId) return
    
    try {
      const currentDraft = await draftService.getDraft(this.draftId)
      const currentConfig = currentDraft.config
      
      await draftService.updateDraft(this.draftId, currentDraft.version, {
        ...currentConfig,
        theme: {
          ...currentConfig.theme,
          mode
        }
      })
    } catch (error) {
      console.error('Failed to save theme mode:', error)
      throw error
    }
  }

  // Section overrides - database only
  async getSectionOverrides() {
    if (!this.draftId) return {}
    
    try {
      const draft = await draftService.getDraft(this.draftId)
      return draft?.config?.overridesBySection || {}
    } catch (error) {
      console.error('Failed to load section overrides:', error)
      return {}
    }
  }

  async setSectionOverrides(overrides) {
    if (!this.draftId) return
    
    try {
      const currentDraft = await draftService.getDraft(this.draftId)
      const currentConfig = currentDraft.config
      
      await draftService.updateDraft(this.draftId, currentDraft.version, {
        ...currentConfig,
        overridesBySection: overrides
      })
    } catch (error) {
      console.error('Failed to save section overrides:', error)
      throw error
    }
  }

  // Complete theme configuration
  async getTheme() {
    if (!this.draftId) return { colors: {}, mode: 'light' }
    
    try {
      const draft = await draftService.getDraft(this.draftId)
      return draft?.config?.theme || { colors: {}, mode: 'light' }
    } catch (error) {
      console.error('Failed to load theme:', error)
      return { colors: {}, mode: 'light' }
    }
  }

  async setTheme(theme) {
    if (!this.draftId) return
    
    try {
      const currentDraft = await draftService.getDraft(this.draftId)
      const currentConfig = currentDraft.config
      
      await draftService.updateDraft(this.draftId, currentDraft.version, {
        ...currentConfig,
        theme
      })
    } catch (error) {
      console.error('Failed to save theme:', error)
      throw error
    }
  }

  // Complete draft configuration
  async getConfig() {
    if (!this.draftId) return null
    
    try {
      const draft = await draftService.getDraft(this.draftId)
      return draft?.config || null
    } catch (error) {
      console.error('Failed to load config:', error)
      return null
    }
  }

  async setConfig(config) {
    if (!this.draftId) return
    
    try {
      const currentDraft = await draftService.getDraft(this.draftId)
      
      await draftService.updateDraft(this.draftId, currentDraft.version, config)
    } catch (error) {
      console.error('Failed to save config:', error)
      throw error
    }
  }
}
