import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvtouoigckngalfvzmsp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Using fallback Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in production.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// File upload utility
export const uploadFile = async (file, bucket = 'charity-logos', path = null) => {
  try {
    // Generate unique filename if no path provided
    const fileName = path || `${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete file utility
export const deleteFile = async (path, bucket = 'charity-logos') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting file:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
