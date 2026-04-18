import { useState } from 'react';
import { FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { useCMSArticles, useCMSCategories } from '@/hooks/useCMS';

const BlogPage = () => {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCMSArticles({ category: category || undefined, page, perPage: 12 });
  const { data: categories } = useCMSCategories();

  const articles = data?.articles || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);

  return (
    <>
      <SEO title="Blog - VET-MEDIX" description="Pet health tips, vet care guides, and announcements from VET-MEDIX." />
      <Navbar />
      <main id="main-content" className="container mx-auto px-4 py-8 min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-fredoka flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Blog & Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Health tips, vet guides, and updates</p>
        </div>

        {/* Category Filters */}
        <Tabs value={category} onValueChange={(v) => { setCategory(v); setPage(1); }} className="mb-6">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-transparent justify-center">
            <TabsTrigger value="" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">All</TabsTrigger>
            {(categories || []).map(cat => (
              <TabsTrigger key={cat.slug} value={cat.slug} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 capitalize">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No articles published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default BlogPage;
