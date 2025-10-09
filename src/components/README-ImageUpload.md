# Image Upload System

## Overview
The image upload system allows users to replace placeholder images in sections with their own uploaded images. It works with both `<img>` tags and background images.

## How It Works

### 1. Section Setup
Add these attributes to any image element in your sections:

```jsx
// For background images (like Hero, WhoYouHelp sections)
<div
  data-image="unique-image-id"
  data-default-image="/path/to/default-image.png"
  style={{ backgroundImage: "url(/path/to/default-image.png)", backgroundSize: "cover", backgroundPosition: "center" }}
/>

// For img tags
<img
  data-image="unique-image-id"
  data-default-image="/path/to/default-image.png"
  src="/path/to/default-image.png"
/>
```

### 2. Automatic Discovery
The `ImageManager` component automatically:
- Finds all elements with `data-image` attributes
- Shows upload controls for each discovered image
- Applies uploaded images to the correct elements

### 3. Image Application
- **Background Images**: Sets `element.style.backgroundImage = url(uploadedImage)`
- **IMG Tags**: Sets `element.src = uploadedImage`
- **Fallback**: If no image is uploaded, restores the `data-default-image`

## Usage Examples

### Hero Section
```jsx
<div
  data-image="hero-image"
  data-default-image="/images/img-hero.png"
  className="hero-image-container"
  style={{ backgroundImage: "url(/images/img-hero.png)", backgroundSize: "cover" }}
/>
```

### Feature Section
```jsx
<div
  data-image="feature-image"
  data-default-image=""
  className="feature-image-container"
  style={{ backgroundSize: "cover", backgroundPosition: "center" }}
/>
```

## Integration Points

### EditorSidebar
- Shows compact upload controls for each section's images
- Appears in the "Images" section of the sidebar

### Onboarding
- Shows full upload interface during section customization
- Allows users to upload images before finalizing their design

### Database Persistence
- Images are stored in Supabase `charity-logos` bucket
- Image URLs are saved to `images_json` field in database
- Changes are debounced and auto-saved

## File Structure
- `ImageUpload.jsx` - Reusable upload component
- `ImageManager.jsx` - Auto-discovery and management
- `useImageManager.js` - State management hook
- Sections with `data-image` attributes

## Adding New Images
1. Add `data-image="unique-id"` to any image element
2. Optionally add `data-default-image="/path/to/default"`
3. The system will automatically discover and manage it
