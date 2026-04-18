import { useEffect } from 'react';

// Types for different schema types
interface OrganizationSchema {
  type: 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

interface LocalBusinessSchema {
  type: 'LocalBusiness' | 'VeterinaryCare';
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string;
  url?: string;
  description?: string;
  priceRange?: string;
}

interface PhysicianSchema {
  type: 'Physician';
  name: string;
  image?: string;
  description?: string;
  medicalSpecialty?: string;
  qualification?: string[];
  worksFor?: {
    name: string;
    url?: string;
  }[];
  url?: string;
}

interface ProductSchema {
  type: 'Product';
  name: string;
  description?: string;
  image?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  sku?: string;
  url?: string;
}

type Schema = OrganizationSchema | LocalBusinessSchema | PhysicianSchema | ProductSchema;

interface SEOProps {
  // Page meta
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  
  // Structured data
  schema?: Schema;
  
  // Additional tags
  noIndex?: boolean;
  canonicalUrl?: string;
}

/**
 * SEO Component for dynamic meta tags and JSON-LD structured data
 * 
 * Usage:
 * ```tsx
 * <SEO 
 *   title="My Page" 
 *   description="Page description"
 *   schema={{ type: 'Organization', name: 'VetMedix', url: 'https://vetmedix.lovable.app' }}
 * />
 * ```
 */
export const SEO = ({
  title,
  description,
  image = 'https://vetmedix.lovable.app/og-image.png',
  url,
  type = 'website',
  schema,
  noIndex = false,
  canonicalUrl,
}: SEOProps) => {
  
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} - VetMedix`;
    }
    
    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    if (description) {
      updateMeta('description', description);
      updateMeta('og:description', description, true);
      updateMeta('twitter:description', description);
    }
    
    if (title) {
      updateMeta('og:title', `${title} - VetMedix`, true);
      updateMeta('twitter:title', `${title} - VetMedix`);
    }
    
    if (image) {
      updateMeta('og:image', image, true);
      updateMeta('twitter:image', image);
    }
    
    if (url) {
      updateMeta('og:url', url, true);
    }
    
    updateMeta('og:type', type, true);
    
    // Robots meta
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    }
    
    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }
    
    // Add JSON-LD structured data
    if (schema) {
      // Remove existing schema script if any
      const existingScript = document.getElementById('seo-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
      
      const jsonLd = generateJsonLd(schema);
      const script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    
    // Cleanup
    return () => {
      const existingScript = document.getElementById('seo-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, image, url, type, schema, noIndex, canonicalUrl]);
  
  return null; // This component doesn't render anything
};

/**
 * Generate JSON-LD structured data based on schema type
 */
function generateJsonLd(schema: Schema): object {
  const baseContext = { '@context': 'https://schema.org' };
  
  switch (schema.type) {
    case 'Organization':
      return {
        ...baseContext,
        '@type': 'Organization',
        name: schema.name,
        url: schema.url,
        logo: schema.logo,
        description: schema.description,
        sameAs: schema.sameAs || [],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'BD',
          addressLocality: 'Dhaka',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['English', 'Bengali'],
        },
      };
      
    case 'LocalBusiness':
    case 'VeterinaryCare':
      return {
        ...baseContext,
        '@type': schema.type === 'VeterinaryCare' ? 'VeterinaryCare' : 'LocalBusiness',
        name: schema.name,
        address: schema.address ? {
          '@type': 'PostalAddress',
          streetAddress: schema.address,
          addressCountry: 'BD',
        } : undefined,
        telephone: schema.phone,
        email: schema.email,
        image: schema.image,
        url: schema.url,
        description: schema.description,
        priceRange: schema.priceRange || '৳৳',
        openingHours: schema.openingHours,
        aggregateRating: schema.rating ? {
          '@type': 'AggregateRating',
          ratingValue: schema.rating,
          reviewCount: schema.reviewCount || 1,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
      };
      
    case 'Physician':
      return {
        ...baseContext,
        '@type': 'Physician',
        name: schema.name,
        image: schema.image,
        description: schema.description,
        medicalSpecialty: schema.medicalSpecialty,
        hasCredential: schema.qualification?.map(q => ({
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: q,
        })),
        worksFor: schema.worksFor?.map(org => ({
          '@type': 'VeterinaryCare',
          name: org.name,
          url: org.url,
        })),
        url: schema.url,
      };
      
    case 'Product':
      return {
        ...baseContext,
        '@type': 'Product',
        name: schema.name,
        description: schema.description,
        image: schema.image,
        sku: schema.sku,
        brand: schema.brand ? {
          '@type': 'Brand',
          name: schema.brand,
        } : undefined,
        category: schema.category,
        offers: {
          '@type': 'Offer',
          price: schema.price,
          priceCurrency: schema.priceCurrency || 'BDT',
          availability: `https://schema.org/${schema.availability || 'InStock'}`,
          url: schema.url,
        },
        aggregateRating: schema.rating ? {
          '@type': 'AggregateRating',
          ratingValue: schema.rating,
          reviewCount: schema.reviewCount || 1,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
      };
      
    default:
      return baseContext;
  }
}

export default SEO;
