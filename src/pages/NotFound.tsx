import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Home,
  ArrowLeft,
  Search,
  ShoppingBag,
  GraduationCap,
  Package,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";
import { useAuthUser } from "@/contexts/AuthContext";
import { log404 } from "@/lib/log404";

const SUGGESTIONS = [
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/track-order", label: "Track Order", icon: Package },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthUser();

  useEffect(() => {
    // Telemetry: log every 404 so operators can repair dead links. Dedupes
    // per session inside log404() to avoid spamming the table on refresh.
    log404(location.pathname + location.search, "public");
  }, [location.pathname, location.search]);

  const primaryDestination = user
    ? { to: "/dashboard", label: "Back to Dashboard", Icon: LayoutDashboard }
    : { to: "/", label: "Back to Home", Icon: Home };

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
        <div className="max-w-lg w-full text-center space-y-6">
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
              <Link to={primaryDestination.to}>
                <primaryDestination.Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                {primaryDestination.label}
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Go back
            </Button>
          </div>

          <div className="pt-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Or jump to
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUGGESTIONS.map(({ to, label, icon: Icon }) => (
                <Button
                  key={to}
                  asChild
                  variant="ghost"
                  className="h-auto py-3 flex-col gap-1.5 border border-border/60 hover:border-primary/40 hover:bg-primary/5"
                >
                  <Link to={to} aria-label={label}>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm">{label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
