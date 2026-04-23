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
  type: 'LocalBusiness';
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

interface CourseSchema {
  type: 'Course';
  name: string;
  description?: string;
  provider?: string;
  providerUrl?: string;
  image?: string;
  url?: string;
  price?: number;
  priceCurrency?: string;
  language?: string;
  duration?: string;
  difficulty?: string;
  rating?: number;
  reviewCount?: number;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList';
  items: BreadcrumbItem[];
}

interface ItemListEntry {
  name: string;
  url: string;
  image?: string;
  price?: number;
  priceCurrency?: string;
}

interface ItemListSchema {
  type: 'ItemList';
  name: string;
  description?: string;
  url?: string;
  itemListType?: 'Product' | 'Course' | 'Thing';
  items: ItemListEntry[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchema {
  type: 'FAQPage';
  items: FAQItem[];
}

type Schema =
  | OrganizationSchema
  | LocalBusinessSchema
  | ProductSchema
  | CourseSchema
  | BreadcrumbSchema
  | ItemListSchema
  | FAQPageSchema;

interface SEOProps {
  // Page meta
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  
  // Structured data — single schema or an array (emitted as @graph)
  schema?: Schema | Schema[];
  
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
 *   schema={{ type: 'Organization', name: 'Z Agro Tech', url: 'https://zagrotech.lovable.app' }}
 * />
 * ```
 */
export const SEO = ({
  title,
  description,
  image = 'https://zagrotech.lovable.app/og-image.png',
  url,
  type = 'website',
  schema,
  noIndex = false,
  canonicalUrl,
}: SEOProps) => {
  
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} - Z Agro Tech`;
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
      updateMeta('og:title', `${title} - Z Agro Tech`, true);
      updateMeta('twitter:title', `${title} - Z Agro Tech`);
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

      const schemas = Array.isArray(schema) ? schema : [schema];
      const jsonLd =
        schemas.length === 1
          ? generateJsonLd(schemas[0])
          : {
              '@context': 'https://schema.org',
              '@graph': schemas.map((s) => {
                const node = generateJsonLd(s) as Record<string, unknown>;
                // strip the per-node @context — already on the wrapper
                const { ['@context']: _ctx, ...rest } = node;
                return rest;
              }),
            };

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
      return {
        ...baseContext,
        '@type': 'LocalBusiness',
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
      
    case 'Course':
      return {
        ...baseContext,
        '@type': 'Course',
        name: schema.name,
        description: schema.description,
        image: schema.image,
        url: schema.url,
        inLanguage: schema.language,
        educationalLevel: schema.difficulty,
        timeRequired: schema.duration,
        provider: {
          '@type': 'Organization',
          name: schema.provider || 'Z Agro Tech',
          sameAs: schema.providerUrl || 'https://zagrotech.lovable.app',
        },
        offers: schema.price !== undefined ? {
          '@type': 'Offer',
          price: schema.price,
          priceCurrency: schema.priceCurrency || 'BDT',
          category: 'Paid',
          availability: 'https://schema.org/InStock',
          url: schema.url,
        } : undefined,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Blended',
          inLanguage: schema.language || 'en',
        },
        aggregateRating: schema.rating ? {
          '@type': 'AggregateRating',
          ratingValue: schema.rating,
          reviewCount: schema.reviewCount || 1,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
      };

    case 'BreadcrumbList':
      return {
        ...baseContext,
        '@type': 'BreadcrumbList',
        itemListElement: schema.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };

    case 'ItemList':
      return {
        ...baseContext,
        '@type': 'ItemList',
        name: schema.name,
        description: schema.description,
        url: schema.url,
        numberOfItems: schema.items.length,
        itemListElement: schema.items.map((entry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': schema.itemListType || 'Thing',
            name: entry.name,
            url: entry.url,
            image: entry.image,
            ...(entry.price !== undefined
              ? {
                  offers: {
                    '@type': 'Offer',
                    price: entry.price,
                    priceCurrency: entry.priceCurrency || 'BDT',
                  },
                }
              : {}),
          },
        })),
      };

    default:
      return baseContext;
  }
}

export default SEO;
