import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function MetaTags() {
  const location = useLocation();

  useEffect(() => {
    // Get the base URL (you may want to update this with your actual domain)
    const baseUrl = window.location.origin;
    const currentUrl = `${baseUrl}${location.pathname}`;

    // Define meta tags for each route
    const routeMeta = {
      '/flight': {
        title: 'Flight Simulation - Cabo Negro',
        description: 'Experience an immersive flight simulation over Patagonia. Pilot your aircraft through challenging terrain and navigate through rings in this interactive 3D flight experience.',
        ogTitle: 'Flight Simulation - Cabo Negro',
        ogDescription: 'Experience an immersive flight simulation over Patagonia. Pilot your aircraft through challenging terrain and navigate through rings in this interactive 3D flight experience.',
        ogImage: `${baseUrl}/punta-arenas.webp`,
        ogType: 'website',
      },
      '/explore': {
        title: '3D Exploration - Patagonia Satellite Imagery | Cabo Negro',
        description: 'Explore real-world Patagonia satellite imagery in stunning 3D. Navigate through interactive scenes showcasing the breathtaking landscapes of southern Chile using high-resolution satellite data.',
        ogTitle: '3D Exploration - Patagonia Satellite Imagery | Cabo Negro',
        ogDescription: 'Explore real-world Patagonia satellite imagery in stunning 3D. Navigate through interactive scenes showcasing the breathtaking landscapes of southern Chile using high-resolution satellite data.',
        ogImage: `${baseUrl}/punta-arenas.webp`,
        ogType: 'website',
      },
    };

    // Get meta data for current route or use defaults
    const meta = routeMeta[location.pathname] || {
      title: 'Cabo Negro - 3D Flight & Exploration',
      description: 'Experience Patagonia through immersive 3D flight simulation and satellite imagery exploration.',
      ogTitle: 'Cabo Negro - 3D Flight & Exploration',
      ogDescription: 'Experience Patagonia through immersive 3D flight simulation and satellite imagery exploration.',
      ogImage: `${baseUrl}/punta-arenas.webp`,
      ogType: 'website',
    };

    // Update or create meta tags
    const updateMetaTag = (property, content) => {
      let element = document.querySelector(`meta[property="${property}"]`) || 
                    document.querySelector(`meta[name="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        if (property.startsWith('og:')) {
          element.setAttribute('property', property);
        } else {
          element.setAttribute('name', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update title
    document.title = meta.title;

    // Update description
    updateMetaTag('description', meta.description);

    // Update OpenGraph tags
    updateMetaTag('og:title', meta.ogTitle);
    updateMetaTag('og:description', meta.ogDescription);
    updateMetaTag('og:image', meta.ogImage);
    updateMetaTag('og:type', meta.ogType);
    updateMetaTag('og:url', currentUrl);

    // Update Twitter Card tags (optional but recommended)
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', meta.ogTitle);
    updateMetaTag('twitter:description', meta.ogDescription);
    updateMetaTag('twitter:image', meta.ogImage);
  }, [location.pathname]);

  return null; // This component doesn't render anything
}

