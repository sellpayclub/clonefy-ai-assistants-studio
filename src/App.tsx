import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";

import AppLayout, { RestrictedRoute } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import EmbedChat from "./pages/EmbedChat";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import LeadCapture from "./pages/LeadCapture";

// Lazy load pages
const LazyCRMSales = lazy(() => import("./pages/CRMSales"));
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyBrandingSettings = lazy(() => import("./pages/BrandingSettings"));
const LazyAssistants = lazy(() => import("./pages/Assistants"));
const LazyWhatsApp = lazy(() => import("./pages/WhatsApp"));
const LazyTelegram = lazy(() => import("./pages/Telegram"));
const LazyConversations = lazy(() => import("./pages/Conversations"));
const LazyAdmin = lazy(() => import("./pages/Admin"));
const LazyEspanol = lazy(() => import("./pages/Espanol"));
const LazyWidgetCustomization = lazy(() => import("./pages/WidgetCustomization"));
const LazyWidgetAnalytics = lazy(() => import("./pages/WidgetAnalytics"));
const LazyCRMLeads = lazy(() => import("./pages/CRMLeads"));
const LazyClickGo = lazy(() => import("./pages/tools/ClickGo"));
const LazyWhatsAppLinkGenerator = lazy(() => import("./pages/tools/WhatsAppLinkGenerator"));
const LazyWhatsAppWidgetGenerator = lazy(() => import("./pages/tools/WhatsAppWidgetGenerator"));
const LazyWhatsAppROICalculator = lazy(() => import("./pages/tools/WhatsAppROICalculator"));
const LazyNicheLinkGenerator = lazy(() => import("./pages/tools/NicheLinkGenerator"));
const LazySectorIASolution = lazy(() => import("./pages/ia/SectorIASolution"));
const LazyMercadoDigital = lazy(() => import("./pages/MercadoDigital"));
const LazyVentasEspanol = lazy(() => import("./pages/VentasEspanol"));
const LazyGroupManagement = lazy(() => import("./pages/GroupManagement"));
const LazyLiveChat = lazy(() => import("./pages/LiveChat"));
const LazyCalendar = lazy(() => import("./pages/Calendar"));
const LazyFollowupDashboard = lazy(() => import("./pages/followup/FollowupDashboard"));
const LazyFollowupCampaignWizard = lazy(() => import("./pages/followup/FollowupCampaignWizard"));
const LazyFollowupCampaignDetails = lazy(() => import("./pages/followup/FollowupCampaignDetails"));
const LazyFollowupImportLeads = lazy(() => import("./pages/followup/FollowupImportLeads"));
const LazyFollowupLeadsList = lazy(() => import("./pages/followup/FollowupLeadsList"));
const LazyCommerceStore = lazy(() => import("./pages/CommerceStore"));
const LazyCommerceOrders = lazy(() => import("./pages/CommerceOrders"));
const LazyCommerceConversations = lazy(() => import("./pages/CommerceConversations"));
const LazyCommercePaymentSettings = lazy(() => import("./pages/CommercePaymentSettings"));
const LazyCommerceConnectWhatsApp = lazy(() => import("./pages/CommerceConnectWhatsApp"));
const LazyFinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));
const LazyFinancialTransactions = lazy(() => import("./pages/FinancialTransactions"));
const LazyFinancialConnect = lazy(() => import("./pages/FinancialConnect"));
const LazyChangelog = lazy(() => import("./pages/Changelog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <main className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </main>
);

// Wrapper for lazy pages inside AppLayout
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrandingProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>

                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/embed/chat/:agentId" element={<EmbedChat />} />
                    <Route path="/embed-chat/:assistantId" element={<EmbedChat />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/lead-capture" element={<LeadCapture />} />

                    {/* Public marketing pages */}
                    <Route path="/crm" element={<Suspense fallback={<LoadingFallback />}><LazyCRMSales /></Suspense>} />
                    <Route path="/mercado-digital" element={<Suspense fallback={<LoadingFallback />}><LazyMercadoDigital /></Suspense>} />
                    <Route path="/es" element={<Suspense fallback={<LoadingFallback />}><LazyVentasEspanol /></Suspense>} />
                    <Route path="/espanol" element={<Suspense fallback={<LoadingFallback />}><LazyEspanol /></Suspense>} />
                    <Route path="/ferramentas/whatsapp-link/:slug" element={<Suspense fallback={<LoadingFallback />}><LazyNicheLinkGenerator /></Suspense>} />
                    <Route path="/ia/:slug" element={<Suspense fallback={<LoadingFallback />}><LazySectorIASolution /></Suspense>} />

                    {/* Protected routes with persistent sidebar layout */}
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<LazyPage><LazyDashboard /></LazyPage>} />
                      <Route path="/assistants" element={<LazyPage><LazyAssistants /></LazyPage>} />
                      <Route path="/whatsapp" element={<LazyPage><LazyWhatsApp /></LazyPage>} />
                      <Route path="/telegram" element={<LazyPage><LazyTelegram /></LazyPage>} />
                      <Route path="/conversations" element={<LazyPage><LazyConversations /></LazyPage>} />
                      <Route path="/live-chat" element={<LazyPage><LazyLiveChat /></LazyPage>} />
                      <Route path="/admin" element={<LazyPage><LazyAdmin /></LazyPage>} />
                      <Route path="/widget-customization" element={<LazyPage><LazyWidgetCustomization /></LazyPage>} />
                      <Route path="/widget-analytics" element={<LazyPage><LazyWidgetAnalytics /></LazyPage>} />
                      <Route path="/crm-leads" element={<LazyPage><LazyCRMLeads /></LazyPage>} />
                      <Route path="/grupos" element={<RestrictedRoute><LazyPage><LazyGroupManagement /></LazyPage></RestrictedRoute>} />
                      <Route path="/calendar" element={<LazyPage><LazyCalendar /></LazyPage>} />
                      <Route path="/configuracoes/branding" element={<LazyPage><LazyBrandingSettings /></LazyPage>} />

                      {/* Follow-up System */}
                      <Route path="/followup" element={<RestrictedRoute><LazyPage><LazyFollowupDashboard /></LazyPage></RestrictedRoute>} />
                      <Route path="/followup/campaigns/new" element={<RestrictedRoute><LazyPage><LazyFollowupCampaignWizard /></LazyPage></RestrictedRoute>} />
                      <Route path="/followup/campaigns/:id" element={<RestrictedRoute><LazyPage><LazyFollowupCampaignDetails /></LazyPage></RestrictedRoute>} />
                      <Route path="/followup/leads" element={<RestrictedRoute><LazyPage><LazyFollowupLeadsList /></LazyPage></RestrictedRoute>} />
                      <Route path="/followup/import" element={<RestrictedRoute><LazyPage><LazyFollowupImportLeads /></LazyPage></RestrictedRoute>} />

                      {/* Commerce System */}
                      <Route path="/commerce" element={<RestrictedRoute><LazyPage><LazyCommerceStore /></LazyPage></RestrictedRoute>} />
                      <Route path="/commerce/orders" element={<RestrictedRoute><LazyPage><LazyCommerceOrders /></LazyPage></RestrictedRoute>} />
                      <Route path="/commerce/conversations" element={<RestrictedRoute><LazyPage><LazyCommerceConversations /></LazyPage></RestrictedRoute>} />
                      <Route path="/commerce/payment-settings" element={<RestrictedRoute><LazyPage><LazyCommercePaymentSettings /></LazyPage></RestrictedRoute>} />
                      <Route path="/commerce/connect-whatsapp" element={<RestrictedRoute><LazyPage><LazyCommerceConnectWhatsApp /></LazyPage></RestrictedRoute>} />

                      {/* Financial Agent */}
                      <Route path="/financeiro" element={<RestrictedRoute><LazyPage><LazyFinancialDashboard /></LazyPage></RestrictedRoute>} />
                      <Route path="/financeiro/transacoes" element={<RestrictedRoute><LazyPage><LazyFinancialTransactions /></LazyPage></RestrictedRoute>} />
                      <Route path="/financeiro/conectar" element={<RestrictedRoute><LazyPage><LazyFinancialConnect /></LazyPage></RestrictedRoute>} />

                      {/* Tools */}
                      <Route path="/ferramentas/clickgo" element={<LazyPage><LazyClickGo /></LazyPage>} />
                      <Route path="/ferramentas/gerador-link-whatsapp" element={<LazyPage><LazyWhatsAppLinkGenerator /></LazyPage>} />
                      <Route path="/ferramentas/gerador-widget-whatsapp" element={<LazyPage><LazyWhatsAppWidgetGenerator /></LazyPage>} />
                      <Route path="/ferramentas/calculadora-roi-whatsapp" element={<LazyPage><LazyWhatsAppROICalculator /></LazyPage>} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </BrandingProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;