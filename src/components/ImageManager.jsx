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
  mode = "wrapper",
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
      let imageElements;
      
      if (mode === "external") {
        // EditorSidebar in builder: search external DOM
        const sectionElement = document.querySelector(`[data-section="${sectionId}"]`);
        if (sectionElement) {
          // Get child elements with data-image
          const childImages = sectionElement.querySelectorAll('[data-image]');
          // Check if section element itself has data-image (like Hero B)
          const sectionHasImage = sectionElement.hasAttribute('data-image');
          imageElements = sectionHasImage ? [sectionElement, ...childImages] : childImages;
        } else {
          imageElements = [];
        }
      } else {
        // Onboarding or main canvas: search within children
        const searchRoot = previewElement || sectionRef.current;
        if (!searchRoot || typeof searchRoot.querySelectorAll !== 'function') return;
        const childImages = searchRoot.querySelectorAll('[data-image]');
        // Check if root element itself has data-image
        const rootHasImage = searchRoot.hasAttribute('data-image');
        imageElements = rootHasImage ? [searchRoot, ...childImages] : childImages;
      }

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
    
    let observeTarget;
    if (mode === "external") {
      // External mode: Observe the specific section in external DOM
      observeTarget = document.querySelector(`[data-section="${sectionId}"]`);
    } else {
      // Wrapper mode: Observe within children
      observeTarget = previewElement || sectionRef.current;
    }
    
    if (observeTarget && typeof observeTarget.observe === 'function') {
      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-image']
      });
    }

    return () => observer.disconnect();
  }, [sectionId, previewElement, mode]);

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
          if (id === 'hero-image' || id.includes('hero')) {
            const heroSection = element.closest('[data-section="hero"]');
            if (heroSection) {
              heroSection.style.setProperty('--hero-background-image', `url(${imageUrl})`);
            }
          }
        } else if (element.tagName === 'IMG') {
          // For actual img tags, set src
          element.src = imageUrl;
        }
      } else if (element) {
        // Handle case when no custom image is provided
        if (element.hasAttribute('data-image')) {
          // If no image URL, restore default background image or clear it
          const defaultImage = element.getAttribute('data-default-image');
          if (defaultImage) {
            if (element.tagName === 'IMG') {
              // For img tags, set src to default
              element.src = defaultImage;
            } else {
              // For div elements, set background image
              element.style.backgroundImage = `url(${defaultImage})`;
            }
            
            // Special handling for hero section - also update CSS variable
            if (element.getAttribute('data-image') === 'hero-image' || element.getAttribute('data-image').includes('hero')) {
              const heroSection = element.closest('[data-section="hero"]');
              if (heroSection) {
                heroSection.style.setProperty('--hero-background-image', `url(${defaultImage})`);
              }
            }
          } else {
            // No default image - clear the element
            if (element.tagName === 'IMG') {
              element.src = '';
            } else {
              element.style.backgroundImage = '';
            }
            
            // Special handling for hero section - clear CSS variable
            if (element.getAttribute('data-image') === 'hero-image' || element.getAttribute('data-image').includes('hero')) {
              const heroSection = element.closest('[data-section="hero"]');
              if (heroSection) {
                heroSection.style.removeProperty('--hero-background-image');
              }
            }
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
      {discoveredImages.map(({ id, label, element }) => {
        const size = element.getAttribute('data-size');
        return (
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
            {size && (
              <div className="text-xs text-gray-500 mt-1">
                Recommended: {size}
              </div>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
}
