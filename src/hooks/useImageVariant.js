import React from "react";
import { getImageVariant } from "../theme-utils.js";

/**
 * Custom hook for automatic light/dark image switching based on background color
 * @param {string} baseImagePath - The base image path (should end with -light.png or -light.svg)
 * @param {string} sectionType - The section type to monitor (e.g., "hero", "Navbar")
 * @returns {string} - The current image path with appropriate variant
 */
export function useImageVariant(baseImagePath, sectionType = null) {
  const [imagePath, setImagePath] = React.useState(baseImagePath);

  React.useEffect(() => {
    const updateImagePath = () => {
      let backgroundColor = '#ffffff';
      
      if (sectionType) {
        // Try to get background color from the specific section first
        const sectionElement = document.querySelector(`[data-section="${sectionType}"]`);
        if (sectionElement) {
          const computedStyle = getComputedStyle(sectionElement);
          backgroundColor = computedStyle.getPropertyValue('--colors-background').trim() || backgroundColor;
        }
      }
      
      // Fallback to global background color if section doesn't have overrides
      if (backgroundColor === '#ffffff' || backgroundColor === '') {
        const globalElement = document.documentElement;
        const globalStyle = getComputedStyle(globalElement);
        backgroundColor = globalStyle.getPropertyValue('--colors-background').trim() || '#ffffff';
      }
      
      // Use the getImageVariant function to determine the appropriate image
      const newImagePath = getImageVariant(baseImagePath, backgroundColor);
      setImagePath(newImagePath);
    };

    // Update immediately
    updateImagePath();

    // Listen for changes to CSS variables
    const observer = new MutationObserver(updateImagePath);
    
    // Observe the section element if it exists
    if (sectionType) {
      const sectionElement = document.querySelector(`[data-section="${sectionType}"]`);
      if (sectionElement) {
        observer.observe(sectionElement, {
          attributes: true,
          attributeFilter: ['style']
        });
      }
    }
    
    // Always observe the global document element for theme changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Also listen for global theme changes
    const handleThemeChange = () => {
      setTimeout(updateImagePath, 100); // Small delay to ensure CSS variables are updated
    };

    window.addEventListener('storage', handleThemeChange);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleThemeChange);
    };
  }, [baseImagePath, sectionType]);

  return imagePath;
}
