import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import EmbedChat from "./pages/EmbedChat";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";

// Lazy load heavy components for better performance
const LazyAssistants = lazy(() => import("./pages/Assistants"));
const LazyWhatsApp = lazy(() => import("./pages/WhatsApp"));
const LazyConversations = lazy(() => import("./pages/Conversations"));
const LazyAdmin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p>Carregando...</p>
    </div>
  </div>
);

const App = () => {
  console.log('=== APP.TSX INICIALIZANDO ===');
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
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
                 <Route path="/embed/chat/:agentId" element={<EmbedChat />} />
                 <Route path="/thank-you" element={<ThankYou />} />
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
