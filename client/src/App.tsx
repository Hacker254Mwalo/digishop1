import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import SeoHead from "./components/SeoHead";

const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OwnerLogin = lazy(() => import("./pages/OwnerLogin"));
const RepairBooking = lazy(() => import("./pages/RepairBooking"));
const RepairStatus = lazy(() => import("./pages/RepairStatus"));
const SpareParts = lazy(() => import("./pages/SpareParts"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const PhoneRepairSiaya = lazy(() => import("./pages/PhoneRepairSiaya"));

function AdminRoute() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && !user) navigate("/owner-login", { replace: true });
  }, [loading, user, navigate]);
  if (loading || !user) return <div className="grid min-h-[70vh] place-items-center bg-slate-950 text-cyan-200"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  return <DashboardLayout><AdminDashboard /></DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/repair" component={RepairBooking} />
      <Route path="/repair-status" component={RepairStatus} />
      <Route path="/spares" component={SpareParts} />
      <Route path="/order-status" component={OrderStatus} />
      <Route path="/phone-repair-siaya" component={PhoneRepairSiaya} />
      <Route path="/owner-login" component={OwnerLogin} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <SeoHead />
          <Suspense fallback={<div className="grid min-h-[65vh] place-items-center gap-3 bg-[#f6f3ee] text-[#657078]"><Loader2 className="h-6 w-6 animate-spin text-[#d94b2b]" /><span className="text-sm font-semibold">Loading this page…</span></div>}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
