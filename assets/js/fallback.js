document.addEventListener('DOMContentLoaded', () => {
  // Default fallback image URL
  const fallbackImage = '/assets/img/fallback.webp';

  // Handle image load errors
  function handleImageError(img) {
    if (img.src !== fallbackImage) {
      console.warn(`Image failed to load: ${img.src}`);
      img.src = fallbackImage;
      
      // Add a class to style broken images differently if needed
      img.classList.add('fallback-image');
      
      // Keep alt text for accessibility
      if (!img.alt) {
        img.alt = 'Image unavailable';
      }
    }
  }

  // Add error handlers to all images
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => handleImageError(img));
  });

  // Handle background images
  document.querySelectorAll('[data-bg-image]').forEach(el => {
    const url = el.getAttribute('data-bg-image');
    const img = new Image();
    
    img.onerror = () => {
      el.style.backgroundImage = `url(${fallbackImage})`;
    };
    
    img.src = url;
  });
});