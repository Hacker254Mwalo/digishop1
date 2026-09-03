import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import RepairBooking from "./pages/RepairBooking";
import RepairStatus from "./pages/RepairStatus";
import SpareParts from "./pages/SpareParts";

function AdminRoute() {
  return <DashboardLayout><AdminDashboard /></DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/repair" component={RepairBooking} />
      <Route path="/repair-status" component={RepairStatus} />
      <Route path="/spares" component={SpareParts} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
