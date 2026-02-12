import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalNotifiers } from "@/components/notifications/GlobalNotifiers";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Playground from "./pages/Playground";
import Marketplace from "./pages/Marketplace";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Policies from "./pages/Policies";
import Embed from "./pages/Embed";
import Widget from "./pages/Widget";
import Auth from "./pages/Auth";
import Bookings from "./pages/Bookings";
import Booking from "./pages/Booking";
import BookingsAdmin from "./pages/BookingsAdmin";
import NotFound from "./pages/NotFound";
import TrustedSeller from "./pages/TrustedSeller";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OnboardingModal />
        <GlobalNotifiers />
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Index />
              </RequireAuth>
            }
          />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/playground"
            element={
              <RequireAuth>
                <Playground />
              </RequireAuth>
            }
          />
          <Route
            path="/marketplace"
            element={
              <RequireAuth>
                <Marketplace />
              </RequireAuth>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/embed" element={<Embed />} />
          <Route path="/widget/:botId" element={<Widget />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <Bookings />
              </RequireAuth>
            }
          />
          <Route
            path="/booking/:botId"
            element={
              <RequireAuth>
                <Booking />
              </RequireAuth>
            }
          />
          <Route path="/admin/bookings" element={<BookingsAdmin />} />
          <Route path="/trusted-seller" element={<TrustedSeller />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
