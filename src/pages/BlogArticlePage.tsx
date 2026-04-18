import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCMSArticleBySlug, useCMSArticles } from '@/hooks/useCMS';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

const BlogFeaturedImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mb-6 rounded-xl overflow-hidden bg-muted relative aspect-video">
      {!loaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useCMSArticleBySlug(slug);

  // Related articles (same category, exclude current)
  const { data: relatedData } = useCMSArticles({
    category: article?.category,
    perPage: 4,
  });
  const related = (relatedData?.articles || []).filter(a => a.slug !== slug).slice(0, 3);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-3/4 mb-4 animate-pulse-slow" />
          <Skeleton className="h-4 w-1/3 mb-6 animate-pulse-slow" />
          <Skeleton className="aspect-video rounded-lg mb-6 animate-pulse-slow" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full animate-pulse-slow" />)}
          </div>
        </main>
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-2">Article not found</h1>
          <p className="text-sm text-muted-foreground mb-4">This article may have been removed or doesn't exist.</p>
          <Link to="/blog"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog</Button></Link>
        </main>
        <Footer />
      </>
    );
  }

  const date = article.published_at || article.created_at;
  const sanitizedContent = DOMPurify.sanitize(article.content || '');

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt || article.title}
        canonicalUrl={`https://vetmedix.lovable.app/blog/${slug}`}
        image={article.featured_image || undefined}
      />
      <Navbar />
      <main id="main-content" className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl font-nunito">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs capitalize">{article.category.replace('-', ' ')}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(new Date(date), 'MMMM d, yyyy')}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 font-fredoka leading-tight">{article.title}</h1>

        {article.excerpt && (
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{article.excerpt}</p>
        )}

        {/* Featured Image */}
        {article.featured_image && <BlogFeaturedImage src={article.featured_image} alt={article.title} />}

        {/* Content */}
        <article className="prose prose-sm sm:prose dark:prose-invert max-w-none mb-8 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-10 pt-4 border-t">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {article.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="pt-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
};

export default BlogArticlePage;
