import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerLogin from "./pages/OwnerLogin";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import RepairBooking from "./pages/RepairBooking";
import RepairStatus from "./pages/RepairStatus";
import SpareParts from "./pages/SpareParts";
import PhoneRepairSiaya from "./pages/PhoneRepairSiaya";
import SeoHead from "./components/SeoHead";

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
