import React, { useState, useEffect } from 'react'
import { useDraft } from '../hooks/useDraft.js'
import { BuilderOverridesProvider, useBuilderOverrides } from '../context/BuilderOverridesContext.jsx'
import EditorSidebar from '../components/EditorSidebar.jsx'
import ThemeAside from '../components/ThemeAside.jsx'
import { SECTIONS } from '../sections/registry.js'
import { buildThemeVars, setCSSVars, applySavedTheme } from '../theme-utils.js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Draft-specific configurator component with its own context
function DraftConfigurator({ draftId }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authError, setAuthError] = useState(null)
  
  // Authenticate with draft-open first if we have a token
  useEffect(() => {
    const authenticateDraft = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        
        console.log('Configurator: draftId =', draftId)
        console.log('Configurator: token =', token ? 'present' : 'missing')
        console.log('Configurator: current URL =', window.location.href)
        
        if (token) {
          // Call draft-open to set the authentication cookie
          const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvtouoigckngalfvzmsp.supabase.co'
          const draftOpenUrl = `${baseUrl}/functions/v1/draft-open/${draftId}?token=${token}`
          console.log('Configurator: Calling draft-open URL =', draftOpenUrl)
          
          console.log('Configurator: Making fetch request WITH credentials')
          const response = await fetch(draftOpenUrl, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
              'Accept': 'application/json', // Ensure we get JSON response
            }
          })
          
          console.log('Configurator: draft-open response status =', response.status)
          console.log('Configurator: draft-open response ok =', response.ok)
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to authenticate draft access')
          }
          
          const result = await response.json()
          console.log('Draft authentication successful:', result)
          
          // Store auth data in localStorage for the draft service to use
          if (result.authData) {
            try {
              localStorage.setItem(`draft_auth_${draftId}`, JSON.stringify(result.authData))
            } catch (error) {
              console.warn('Failed to store auth data:', error)
            }
          }
          
          // Remove token from URL for security - only keep the pathname, not the hash
          const newUrl = window.location.pathname
          history.replaceState({}, '', newUrl)
          
          // Mark onboarding as completed since user has access to configurator
          try {
            localStorage.setItem("onboardingCompleted", "1")
          } catch (error) {
            console.warn('Failed to mark onboarding as completed:', error)
          }
        }
        
        setIsAuthenticating(false)
      } catch (error) {
        console.error('Draft authentication error:', error)
        setAuthError(error.message)
        setIsAuthenticating(false)
      }
    }
    
    if (draftId) {
      authenticateDraft()
    } else {
      setIsAuthenticating(false)
    }
  }, [draftId])
  
  const { config, version, collaborators, me, isLoading, error, saveDraft, confirmDraft } = useDraft(draftId, !isAuthenticating && !authError)
  const { overridesBySection, setSection } = useBuilderOverrides()
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)

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
      
      // Get current state from builder context (no localStorage)
      const currentConfig = {
        charityInfo: config?.charityInfo,
        overridesBySection, // From useBuilderOverrides context
        theme: {
          colors: config?.theme?.colors || {}, // From database
          mode: config?.theme?.mode || 'light' // From database
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
      
      // Save current state first (no localStorage)
      const currentConfig = {
        charityInfo: config?.charityInfo,
        overridesBySection,
        theme: {
          colors: config?.theme?.colors || {},
          mode: config?.theme?.mode || 'light'
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

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Failed</h2>
          <p className="text-red-600 mb-4">{authError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
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

  // Generate blocks from overrides (same logic as main app)
  const blocks = (() => {
    const order = ["hero", "extraPrizes", "winners"];
    const toIndex = (v) => (v === "B" ? 1 : 0);

    const blocks = [];
    
    // First, add sections in the standard order
    order.forEach((k) => {
      if (overridesBySection?.[k]?.visible !== false) {
        const s = overridesBySection[k] || {};
        blocks.push({
          id: `b_${k}_${Date.now()}`,
          type: k,
          variant: toIndex(s.variant || "A"),
          controls: s.display || {},
          copy: s.copy || {},
          overrides: s.theme || { enabled: false, values: {}, valuesPP: {} },
        });
      }
    });
    
    // Add WhoYouHelp only if explicitly enabled
    if (overridesBySection?.WhoYouHelp?.visible === true) {
      const s = overridesBySection.WhoYouHelp || {};
      blocks.push({
        id: `b_WhoYouHelp_${Date.now()}`,
        type: "WhoYouHelp",
        variant: toIndex(s.variant || "A"),
        controls: s.display || {},
        copy: s.copy || {},
        overrides: s.theme || { enabled: false, values: {}, valuesPP: {} },
      });
    }
    
    // Then, add all extra content sections
    Object.keys(overridesBySection).forEach((k) => {
      if (k.startsWith('extraContent_') && overridesBySection[k]?.visible !== false) {
        const s = overridesBySection[k] || {};
        blocks.push({
          id: `b_${k}_${Date.now()}`,
          type: k,
          variant: toIndex(s.variant || "A"),
          controls: s.display || {},
          copy: s.copy || {},
          overrides: s.theme || { enabled: false, values: {}, valuesPP: {} },
        });
      }
    });
    
    return blocks;
  })();

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
              onClick={() => setThemeOpen(true)}
            >
              Theme
            </Button>
            
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
            activeBlockId={blocks[0]?.id || "hero"}
            activeBlock={blocks[0] || {
              id: "hero",
              type: "hero",
              variant: 0,
              controls: {},
              copy: {},
              overrides: { enabled: false, values: {} }
            }}
            partList={[]}
            copyList={[]}
            onTogglePartFromSidebar={() => {}}
            onCopyChangeFromSidebar={() => {}}
            variantIndex={0}
            setVariantForId={() => {}}
            variantForId={{}}
            setBlocks={() => {}}
            blocks={blocks}
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
              
              {/* Render actual sections */}
              <div className="mt-8">
                {blocks.map((block) => {
                  const SectionComponent = SECTIONS[block.type]?.variants?.[block.variant];
                  if (!SectionComponent) return null;
                  
                  return (
                    <div key={block.id} className="mb-8">
                      <SectionComponent
                        controls={block.controls}
                        copy={block.copy}
                        overrides={block.overrides}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Aside */}
      <ThemeAside 
        open={themeOpen} 
        onClose={() => setThemeOpen(false)}
        draftId={draftId}
        sectionOverrides={overridesBySection}
      />
    </div>
  )
}

// Main Configurator component that provides draft-specific context
export default function Configurator() {
  // Extract draftId from URL path
  const draftId = window.location.pathname.split('/')[2] // /configurator/:draftId
  
  return (
    <BuilderOverridesProvider>
      <DraftConfigurator draftId={draftId} />
    </BuilderOverridesProvider>
  )
}
