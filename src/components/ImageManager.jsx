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
  children,
  controls = {},
  onHasImagesChange,
  includeCharityLogo = false,
  charityLogo = "",
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

      const foundImages = Array.from(imageElements).map(el => {
        const id = el.getAttribute('data-image');
        const label = el.getAttribute('data-label') || id;
        const controlEl = el.closest('[data-display]');
        const controlId = controlEl ? (controlEl.getAttribute('data-id') || controlEl.getAttribute('data-label') || controlEl.getAttribute('id')) : null;
        const defaultVisible = () => {
          const v = (controlEl?.getAttribute('data-display') || '').toLowerCase();
          return v === 'yes' || v === 'true' || v === '1';
        };
        return { id, label, element: el, controlEl, controlId, defaultVisible };
      });

      // Add charity logo for Navbar section if requested
      if (includeCharityLogo && charityLogo) {
        const charityLogoImage = {
          id: 'charity-logo',
          label: 'Charity Logo',
          element: null, // No DOM element for this special image
          controlEl: null,
          controlId: null,
          defaultVisible: () => true
        };
        foundImages.push(charityLogoImage);
      }

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

  // Determine which images are visible based on controls/defaults
  const visibleImages = React.useMemo(() => {
    const list = Array.isArray(discoveredImages) ? discoveredImages : [];
    const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj || {}, k);
    return list.filter(({ controlEl, controlId, defaultVisible }) => {
      if (!controlEl || !controlId) return true; // no controller → visible by default
      const def = typeof defaultVisible === 'function' ? defaultVisible() : true;
      return has(controls, controlId) ? !!controls[controlId] : def;
    });
  }, [discoveredImages, controls]);

  useEffect(() => {
    if (typeof onHasImagesChange === 'function') {
      onHasImagesChange(visibleImages.length > 0);
    }
  }, [visibleImages, onHasImagesChange]);

  // Apply image URLs to discovered elements
  useEffect(() => {
    discoveredImages.forEach(({ id, element }) => {
      const imageUrl = images[id];
      if (imageUrl && element) {
        // Check element type FIRST
        if (element.tagName === 'IMG') {
          // For <img> tags, always use src
          element.src = imageUrl;
        } else if (element.hasAttribute('data-image')) {
          // For other elements with data-image, use backgroundImage
          const currentStyle = element.style;
          const backgroundSize = currentStyle.backgroundSize || 'cover';
          const backgroundPosition = currentStyle.backgroundPosition || 'center';
          
          element.style.backgroundImage = `url(${imageUrl})`;
          element.style.backgroundSize = backgroundSize;
          element.style.backgroundPosition = backgroundPosition;
          
          // Special handling for hero section
          if (id === 'hero-image' || id.includes('hero')) {
            const heroSection = element.closest('[data-section="hero"]');
            if (heroSection) {
              heroSection.style.setProperty('--hero-background-image', `url(${imageUrl})`);
            }
          }
        }
      } else if (element) {
        // Handle case when no custom image is provided
        if (element.hasAttribute('data-image')) {
          // If no image URL, restore default background image or clear it
          const defaultImage = element.getAttribute('data-default-image');
          if (defaultImage) {
            if (element.tagName === 'IMG') {
              // For img tags, only set to default if current src IS the default or empty
              // This prevents overriding charity logos set via props
              const currentSrc = element.src;
              const isDefaultOrEmpty = !currentSrc || currentSrc.endsWith(defaultImage);
              if (isDefaultOrEmpty) {
                element.src = defaultImage;
              }
            } else {
              // For div elements, set background image
              if (element.getAttribute('data-image') === 'hero-image') {
                // For Hero B, don't touch the background image at all
                // Let React's inline style prop (from useImageVariant hook) control it
                // Do nothing here
              } else {
                // For other sections, set default background image
                element.style.backgroundImage = `url(${defaultImage})`;
              }
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
              // For Hero B, don't touch the background image
              if (element.getAttribute('data-image') === 'hero-image') {
                // For Hero B, don't touch the background image
                // Let React's inline style prop control it
              } else {
                // For other sections, clear background image
                element.style.backgroundImage = '';
              }
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

  if (visibleImages.length === 0) {
    return children ? <div ref={sectionRef} className={className}>{children}</div> : null;
  }

  return (
    <div ref={sectionRef} className={className}>
      {visibleImages.map(({ id, label, element }) => {
        const size = element?.getAttribute('data-size');
        return (
          <div key={id} className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {label}
            </label>
            <ImageUpload
              imageId={id}
              currentImageUrl={images[id] || (id === 'charity-logo' ? charityLogo : '')}
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
