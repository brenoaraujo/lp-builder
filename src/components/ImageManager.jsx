import React, { useEffect, useState, useRef } from 'react';
import ImageUpload from './ImageUpload.jsx';

/**
 * Component that automatically discovers and manages images in sections
 * @param {Object} props
 * @param {string} props.sectionId - The section ID (e.g., "hero", "feature")
 * @param {Object} props.images - Current images state from useImageManager
 * @param {Function} props.onImageChange - Callback when image changes
 * @param {boolean} props.compact - Whether to show compact version
 * @param {string} props.className - Additional CSS classes
 */
export default function ImageManager({ 
  sectionId, 
  images, 
  onImageChange, 
  compact = false,
  hideControls = false,
  className = "",
  previewRef = null,
  children
}) {
  const [discoveredImages, setDiscoveredImages] = useState([]);
  const sectionRef = useRef(null);
  const [previewElement, setPreviewElement] = useState(null);

  // Update preview element when previewRef changes
  useEffect(() => {
    if (previewRef?.current) {
      setPreviewElement(previewRef.current);
    } else if (previewRef) {
      setPreviewElement(previewRef);
    } else {
      setPreviewElement(null);
    }
  }, [previewRef?.current, previewRef]);

  // Discover images in the section
  useEffect(() => {
    const discoverImages = () => {
      // Use previewElement if available (for onboarding), otherwise use sectionRef (for main app)
      const searchRoot = previewElement || sectionRef.current;
      if (!searchRoot || typeof searchRoot.querySelectorAll !== 'function') return;

      const imageElements = searchRoot.querySelectorAll('[data-image]');
      const foundImages = Array.from(imageElements).map(el => ({
        id: el.getAttribute('data-image'),
        label: el.getAttribute('data-label') || el.getAttribute('data-image'),
        element: el
      }));

      setDiscoveredImages(foundImages);
    };

    // Discover on mount and when section changes
    discoverImages();

    // Also discover when DOM changes (for dynamic content)
    const observer = new MutationObserver(discoverImages);
    const searchRoot = previewElement || sectionRef.current;
    if (searchRoot && typeof searchRoot.observe === 'function') {
      observer.observe(searchRoot, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-image']
      });
    }

    return () => observer.disconnect();
  }, [sectionId, previewElement]);

  // Apply image URLs to discovered elements
  useEffect(() => {
    discoveredImages.forEach(({ id, element }) => {
      const imageUrl = images[id];
      if (imageUrl && element) {
        // Check if element has data-image attribute (indicating it should have a background image)
        const hasDataImage = element.hasAttribute('data-image');
        
        if (hasDataImage) {
          // For elements with data-image, always set as background image
          // Preserve existing background properties like backgroundSize and backgroundPosition
          const currentStyle = element.style;
          const backgroundSize = currentStyle.backgroundSize || 'cover';
          const backgroundPosition = currentStyle.backgroundPosition || 'center';
          
          element.style.backgroundImage = `url(${imageUrl})`;
          element.style.backgroundSize = backgroundSize;
          element.style.backgroundPosition = backgroundPosition;
          
          // Special handling for hero section - also update CSS variable
          if (id === 'hero-image' && element.closest('[data-section="hero"]')) {
            element.style.setProperty('--hero-background-image', `url(${imageUrl})`);
          }
        } else if (element.tagName === 'IMG') {
          // For actual img tags, set src
          element.src = imageUrl;
        }
      } else if (element && element.hasAttribute('data-image')) {
        // If no image URL, restore default background image or clear it
        const defaultImage = element.getAttribute('data-default-image');
        if (defaultImage) {
          element.style.backgroundImage = `url(${defaultImage})`;
          
          // Special handling for hero section - also update CSS variable
          if (element.getAttribute('data-image') === 'hero-image' && element.closest('[data-section="hero"]')) {
            element.style.setProperty('--hero-background-image', `url(${defaultImage})`);
          }
        } else {
          element.style.backgroundImage = '';
          
          // Special handling for hero section - clear CSS variable
          if (element.getAttribute('data-image') === 'hero-image' && element.closest('[data-section="hero"]')) {
            element.style.removeProperty('--hero-background-image');
          }
        }
      }
    });
  }, [discoveredImages, images]);

  if (hideControls) {
    return <div ref={sectionRef} className={className}>{children}</div>;
  }

  if (discoveredImages.length === 0) {
    return children ? <div ref={sectionRef} className={className}>{children}</div> : null;
  }

  return (
    <div ref={sectionRef} className={className}>
      {discoveredImages.map(({ id, label }) => (
        <div key={id} className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            {label}
          </label>
          <ImageUpload
            imageId={id}
            currentImageUrl={images[id]}
            onImageChange={onImageChange}
            compact={compact}
            placeholder={`Upload ${label.toLowerCase()}`}
          />
        </div>
      ))}
      {children}
    </div>
  );
}
