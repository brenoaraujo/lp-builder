import React from "react";
import { useImageVariant } from "../hooks/useImageVariant.js";

/**
 * AdaptiveImage component that automatically switches between light/dark variants
 * @param {string} baseImagePath - The base image path (should end with -light.png or -light.svg)
 * @param {string} sectionType - The section type to monitor (e.g., "hero", "Navbar", null for global)
 * @param {object} props - Additional props to pass to the img element
 * @returns {JSX.Element} - An img element with adaptive image source
 */
export function AdaptiveImage({ baseImagePath, sectionType = null, ...props }) {
  const imagePath = useImageVariant(baseImagePath, sectionType);
  
  return <img src={imagePath} {...props} />;
}

/**
 * AdaptiveBackgroundImage component for background images
 * @param {string} baseImagePath - The base image path (should end with -light.png or -light.svg)
 * @param {string} sectionType - The section type to monitor
 * @param {object} style - Additional styles to apply
 * @param {object} props - Additional props to pass to the element
 * @returns {JSX.Element} - A div element with adaptive background image
 */
export function AdaptiveBackgroundImage({ 
  baseImagePath, 
  sectionType = null, 
  style = {}, 
  ...props 
}) {
  const imagePath = useImageVariant(baseImagePath, sectionType);
  
  return (
    <div 
      style={{ 
        backgroundImage: `url(${imagePath})`,
        ...style 
      }} 
      {...props} 
    />
  );
}
