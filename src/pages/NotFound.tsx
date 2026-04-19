import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has moved. Browse the shop, academy, or return home."
        noIndex
      />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12 animate-page-enter"
      >
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-9 w-9 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">404</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Page not found
            </h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved. Try one of the
              destinations below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/shop">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Browse Shop
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
