import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminClient } from '../lib/adminClient.js';

/**
 * Reusable image upload component for sections
 * @param {Object} props
 * @param {string} props.imageId - Unique identifier for this image (e.g., "hero-image", "feature-image-1")
 * @param {string} props.currentImageUrl - Current image URL to display
 * @param {Function} props.onImageChange - Callback when image changes (imageId, newUrl)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.compact - Whether to show compact version
 * @param {string} props.className - Additional CSS classes
 */
export default function ImageUpload({ 
  imageId, 
  currentImageUrl, 
  onImageChange, 
  placeholder = "Upload image",
  compact = false,
  className = ""
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${imageId}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage using admin client (bypasses RLS)
      const adminClient = getAdminClient();
      const { data, error: uploadError } = await adminClient.storage
        .from('charity-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = adminClient.storage
        .from('charity-logos')
        .getPublicUrl(fileName);

      // Notify parent component
      onImageChange?.(imageId, publicUrl);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange?.(imageId, null);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {currentImageUrl ? (
          <div className="flex items-center gap-2">
            <img 
              src={currentImageUrl} 
              alt="Uploaded" 
              className="w-8 h-8 object-cover rounded border"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              disabled={isUploading}
              className="text-xs"
            >
              {isUploading ? 'Uploading...' : 'Change'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isUploading}
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
        
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {currentImageUrl ? (
        <div className="space-y-2">
          <div className="relative">
            <img 
              src={currentImageUrl} 
              alt="Uploaded" 
              className="w-full h-32 object-cover rounded border"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Change Image'}
          </Button>
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={(e) => e.stopPropagation()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Image'}
          </Button>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
