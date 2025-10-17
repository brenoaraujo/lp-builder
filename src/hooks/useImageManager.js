import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage image state for sections
 * @param {Object} inviteRow - The invite row data
 * @param {Function} onUpdateInvite - Function to update invite data
 * @returns {Object} Image management functions and state
 */
export function useImageManager(inviteRow, onUpdateInvite) {
  const [images, setImages] = useState(() => {
    return inviteRow?.images_json || inviteRow?.overrides_json?.images || {};
  });
  
  const previousImagesRef = useRef(null);

  // Update local state when inviteRow changes
  useEffect(() => {
    const newImages = inviteRow?.images_json || inviteRow?.overrides_json?.images || {};
    const newImagesString = JSON.stringify(newImages);
    const previousImagesString = JSON.stringify(previousImagesRef.current);
    
    
    // Only update if the images have actually changed
    if (newImagesString !== previousImagesString) {
      setImages(newImages);
      previousImagesRef.current = newImages;
    }
  }, [inviteRow?.images_json, inviteRow?.overrides_json?.images]);

  // Debounced save to database
  const saveTimeoutRef = useRef(null);
  
  const debouncedSave = useCallback(async (newImages) => {
    if (!onUpdateInvite) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Try images_json first, fallback to overrides_json.images
        try {
          await onUpdateInvite({ images_json: newImages });
        } catch (error) {
          // Fallback: save to overrides_json.images
          await onUpdateInvite({ 
            overrides_json: {
              ...inviteRow?.overrides_json,
              images: newImages
            }
          });
        }
      } catch (error) {
        console.error('Failed to save images:', error);
      }
    }, 1000); // 1 second debounce
  }, [onUpdateInvite, inviteRow?.overrides_json]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateImage = useCallback((imageId, imageUrl) => {
    const newImages = { ...images, [imageId]: imageUrl };
    setImages(newImages);
    debouncedSave(newImages);
  }, [images, debouncedSave]);

  const getImageUrl = useCallback((imageId) => {
    return images[imageId] || null;
  }, [images]);

  const removeImage = useCallback((imageId) => {
    const newImages = { ...images };
    delete newImages[imageId];
    setImages(newImages);
    debouncedSave(newImages);
  }, [images, debouncedSave]);

  return {
    images,
    updateImage,
    getImageUrl,
    removeImage
  };
}
