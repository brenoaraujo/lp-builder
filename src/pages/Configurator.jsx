import React, { useState, useEffect } from 'react'
import { useDraft } from '../hooks/useDraft.js'
import { useBuilderOverrides } from '../context/BuilderOverridesContext.jsx'
import EditorSidebar from '../components/EditorSidebar.jsx'
import { SECTIONS } from '../sections/registry.js'
import { buildThemeVars, setCSSVars, applySavedTheme } from '../theme-utils.js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Configurator() {
  // Extract draftId from URL hash
  const draftId = window.location.hash.split('/')[2] // /configurator/:draftId
  const { config, version, collaborators, me, isLoading, error, saveDraft, confirmDraft } = useDraft(draftId)
  const { overridesBySection, setSection } = useBuilderOverrides()
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Load config into builder context when available
  useEffect(() => {
    if (config) {
      // Apply theme
      if (config.theme) {
        const { colors, mode } = config.theme
        const vars = buildThemeVars(colors, mode)
        setCSSVars(document.documentElement, "colors", vars)
        applySavedTheme(mode)
      }

      // Apply section overrides
      if (config.overridesBySection) {
        Object.entries(config.overridesBySection).forEach(([key, value]) => {
          setSection(key, value)
        })
      }
    }
  }, [config, setSection])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const currentConfig = {
        charityInfo: config?.charityInfo,
        overridesBySection,
        theme: {
          colors: config?.theme?.colors,
          mode: config?.theme?.mode
        }
      }

      await saveDraft(currentConfig)
      toast.success('Draft saved successfully')
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(`Save failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      
      // Save current state first
      const currentConfig = {
        charityInfo: config?.charityInfo,
        overridesBySection,
        theme: {
          colors: config?.theme?.colors,
          mode: config?.theme?.mode
        }
      }

      await saveDraft(currentConfig)
      
      // Then confirm/publish
      const result = await confirmDraft()
      
      toast.success('Page published successfully!')
      
      // Show published URL
      if (result.publishedUrl) {
        toast.success(`Published at: ${result.publishedUrl}`, {
          action: {
            label: 'Copy URL',
            onClick: () => navigator.clipboard.writeText(result.publishedUrl)
          }
        })
      }
    } catch (error) {
      console.error('Publish failed:', error)
      toast.error(`Publish failed: ${error.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading draft...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Draft</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.hash = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Draft Not Found</h2>
          <p className="text-muted-foreground mb-4">This draft may have been deleted or you may not have access.</p>
          <Button onClick={() => window.location.hash = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Page Configurator</h1>
            <p className="text-sm text-muted-foreground">
              Draft ID: {draftId} • Version: {version}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {me && (
              <div className="text-sm text-muted-foreground">
                {me.email} ({me.role})
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {me?.role === 'owner' && (
              <Button 
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Publish Page'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-white">
          <EditorSidebar
            activeBlockId="hero"
            activeBlock={{
              id: "hero",
              type: "hero",
              variant: 0,
              controls: overridesBySection.hero?.display || {},
              copy: overridesBySection.hero?.copy || {},
              overrides: overridesBySection.hero?.theme || { enabled: false, values: {} }
            }}
            partList={[]}
            copyList={[]}
            onTogglePartFromSidebar={() => {}}
            onCopyChangeFromSidebar={() => {}}
            variantIndex={0}
            setVariantForId={() => {}}
            variantForId={{}}
            setBlocks={() => {}}
            blocks={[]}
            mode="builder"
            hideVariantPicker={false}
            hideAdvancedActions={false}
            staticLayout={false}
            hideCloseAction={true}
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold mb-4">Page Preview</h2>
              <p className="text-muted-foreground">
                Your page configuration will be rendered here. 
                Use the sidebar to customize sections, copy, and styling.
              </p>
              
              {/* TODO: Add actual section rendering here */}
              <div className="mt-8 p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <p className="text-gray-500">Section previews will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
