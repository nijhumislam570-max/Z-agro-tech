import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArticleStatusBadge } from '@/components/admin/cms/ArticleStatusBadge';
import { useCMSArticles, useDeleteArticle } from '@/hooks/useCMS';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';

const CMSArticlesTab = () => {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const isMobile = useIsMobile();

  const { data, isLoading } = useCMSArticles({ status, search: debouncedSearch, page, perPage: 20, adminMode: true });
  const deleteArticle = useDeleteArticle();

  const articles = data?.articles || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-muted-foreground">{total} article{total !== 1 ? 's' : ''}</p>
        <Link to="/admin/cms/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Article
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
            <TabsTrigger value="published" className="text-xs">Published</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
          No articles found
        </div>
      ) : isMobile ? (
        /* Mobile Card Layout */
        <div className="space-y-2.5">
          {articles.map((article) => (
            <div key={article.id} className="p-3 rounded-lg border bg-card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{article.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ArticleStatusBadge status={article.status} />
                    <span className="text-[10px] text-muted-foreground capitalize">{article.category.replace('-', ' ')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {article.status === 'published' && (
                    <Link to={`/blog/${article.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Preview">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                  <Link to={`/admin/cms/${article.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete article?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteArticle.mutate(article.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{article.title}</TableCell>
                  <TableCell className="text-xs capitalize text-muted-foreground">
                    {article.category.replace('-', ' ')}
                  </TableCell>
                  <TableCell><ArticleStatusBadge status={article.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {article.status === 'published' && (
                        <Link to={`/blog/${article.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Preview">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Link to={`/admin/cms/${article.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete article?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteArticle.mutate(article.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default CMSArticlesTab;
