import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from './adminClient.js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// File upload utility
export const uploadFile = async (file, bucket = 'charity-logos', path = null) => {
  try {
    // Generate unique filename if no path provided
    const fileName = path || `${Date.now()}-${file.name}`
    
    // Use admin client for uploads (bypasses RLS)
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
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
    // Use admin client for deletes (bypasses RLS)
    const adminClient = getAdminClient();
    
    const { error } = await adminClient.storage
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
