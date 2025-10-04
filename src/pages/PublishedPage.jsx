import React, { useState, useEffect } from 'react'
import { draftService } from '../lib/draftService.js'
import { buildThemeVars, setCSSVars, applySavedTheme } from '../theme-utils.js'

export default function PublishedPage() {
  // Extract slug from URL hash
  const slug = window.location.hash.split('/')[2] // /p/:slug
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPublishedPage = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await draftService.getPublishedPage(slug)
        setConfig(data.config)
        
        // Apply theme if available
        if (data.config.theme) {
          const { colors, mode } = data.config.theme
          const vars = buildThemeVars(colors, mode)
          setCSSVars(document.documentElement, "colors", vars)
          applySavedTheme(mode)
        }
      } catch (err) {
        console.error('Failed to load published page:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      loadPublishedPage()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-4">This page may have been removed or is not yet published.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Render the actual page sections based on config */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Published Page</h1>
          <p className="text-muted-foreground mb-8">
            This is a placeholder for the published page. The actual sections will be rendered here based on the configuration.
          </p>
          
          {/* Display charity info if available */}
          {config.charityInfo && (
            <div className="bg-card p-6 rounded-lg border mb-6">
              <h2 className="text-2xl font-semibold mb-4">Charity Information</h2>
              <div className="space-y-2">
                {config.charityInfo.charityName && (
                  <p><strong>Name:</strong> {config.charityInfo.charityName}</p>
                )}
                {config.charityInfo.charitySite && (
                  <p><strong>Website:</strong> {config.charityInfo.charitySite}</p>
                )}
                {config.charityInfo.raffleType && (
                  <p><strong>Raffle Type:</strong> {config.charityInfo.raffleType}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Display theme info */}
          {config.theme && (
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">Theme Configuration</h2>
              <p><strong>Mode:</strong> {config.theme.mode}</p>
              {config.theme.colors && (
                <div className="mt-4">
                  <p><strong>Colors:</strong></p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(config.theme.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: value }}
                        />
                        <span className="text-sm">{key}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
