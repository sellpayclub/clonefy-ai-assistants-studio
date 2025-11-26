import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ConditionalSupportWidget from "@/components/ConditionalSupportWidget";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import EmbedChat from "./pages/EmbedChat";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import LeadCapture from "./pages/LeadCapture";

// Lazy load heavy components for better performance
const LazyAssistants = lazy(() => import("./pages/Assistants"));
const LazyWhatsApp = lazy(() => import("./pages/WhatsApp"));
const LazyConversations = lazy(() => import("./pages/Conversations"));
const LazyAdmin = lazy(() => import("./pages/Admin"));
const LazyEspanol = lazy(() => import("./pages/Espanol"));
const LazyWidgetCustomization = lazy(() => import("./pages/WidgetCustomization"));
const LazyWidgetAnalytics = lazy(() => import("./pages/WidgetAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - aumentado
      gcTime: 30 * 60 * 1000, // 30 minutes - aumentado
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // Menos tentativas para velocidade
    },
    mutations: {
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ConditionalSupportWidget />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/assistants" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyAssistants />
                  </Suspense>
                } />
                <Route path="/whatsapp" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyWhatsApp />
                  </Suspense>
                } />
                 <Route path="/conversations" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyConversations />
                  </Suspense>
                } />
                 <Route path="/admin" element={
                   <Suspense fallback={<LoadingFallback />}>
                     <LazyAdmin />
                   </Suspense>
                  } />
                  <Route path="/espanol" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <LazyEspanol />
                    </Suspense>
                  } />
                   <Route path="/embed/chat/:agentId" element={<EmbedChat />} />
                   <Route path="/embed-chat/:assistantId" element={<EmbedChat />} />
                   <Route path="/widget-customization" element={
                     <Suspense fallback={<LoadingFallback />}>
                       <LazyWidgetCustomization />
                     </Suspense>
                   } />
                   <Route path="/widget-analytics" element={
                     <Suspense fallback={<LoadingFallback />}>
                       <LazyWidgetAnalytics />
                     </Suspense>
                   } />
                   <Route path="/thank-you" element={<ThankYou />} />
                   <Route path="/lead-capture" element={<LeadCapture />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
