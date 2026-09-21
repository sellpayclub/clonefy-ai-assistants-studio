import { ComponentType, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

const chunkReloadKey = "clonefy:chunk-reload-attempted";

const lazyWithRetry = (importer: () => Promise<{ default: ComponentType }>) => lazy(async () => {
  try {
    const loaded = await importer();
    sessionStorage.removeItem(chunkReloadKey);
    return loaded;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isStaleChunk = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(message);

    if (isStaleChunk && sessionStorage.getItem(chunkReloadKey) !== "true") {
      sessionStorage.setItem(chunkReloadKey, "true");
      window.location.reload();
      return new Promise<never>(() => undefined);
    }

    sessionStorage.removeItem(chunkReloadKey);
    throw error;
  }
});

// Lazy load pages with one automatic reload when a deployment replaces cached chunks.
const LazyCRMSales = lazyWithRetry(() => import("./pages/CRMSales"));
const LazyDashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const LazyBrandingSettings = lazyWithRetry(() => import("./pages/BrandingSettings"));
const LazyAssistants = lazyWithRetry(() => import("./pages/Assistants"));
const LazyWhatsApp = lazyWithRetry(() => import("./pages/WhatsApp"));
const LazyMetaChannels = lazyWithRetry(() => import("./pages/MetaChannels"));
const LazyConversations = lazyWithRetry(() => import("./pages/Conversations"));
const LazyAdmin = lazyWithRetry(() => import("./pages/Admin"));
const LazyEspanol = lazyWithRetry(() => import("./pages/Espanol"));
const LazyWidgetCustomization = lazyWithRetry(() => import("./pages/WidgetCustomization"));
const LazyWidgetAnalytics = lazyWithRetry(() => import("./pages/WidgetAnalytics"));
const LazyCRMLeads = lazyWithRetry(() => import("./pages/CRMLeads"));
const LazyWhatsAppLinkGenerator = lazyWithRetry(() => import("./pages/tools/WhatsAppLinkGenerator"));
const LazyWhatsAppWidgetGenerator = lazyWithRetry(() => import("./pages/tools/WhatsAppWidgetGenerator"));
const LazyNicheLinkGenerator = lazyWithRetry(() => import("./pages/tools/NicheLinkGenerator"));
const LazySectorIASolution = lazyWithRetry(() => import("./pages/ia/SectorIASolution"));
const LazyMercadoDigital = lazyWithRetry(() => import("./pages/MercadoDigital"));
const LazyVentasEspanol = lazyWithRetry(() => import("./pages/VentasEspanol"));

const LazyLiveChat = lazyWithRetry(() => import("./pages/LiveChat"));
const LazySalesFunnels = lazyWithRetry(() => import("./pages/SalesFunnels"));
const LazyCalendar = lazyWithRetry(() => import("./pages/Calendar"));
const LazyChangelog = lazyWithRetry(() => import("./pages/Changelog"));
const LazyTechnicalDocs = lazyWithRetry(() => import("./pages/TechnicalDocs"));
const LazyVslDaniel = lazyWithRetry(() => import("./pages/VslDaniel"));
const LazyVslTalita = lazyWithRetry(() => import("./pages/VslTalita"));
const LazyPlanos = lazyWithRetry(() => import("./pages/Planos"));
const LazyApiBalance = lazyWithRetry(() => import("./pages/ApiBalance"));
const LazyProspeccao = lazyWithRetry(() => import("./pages/Prospeccao"));
const LazyIndex = lazyWithRetry(() => import("./pages/Index"));
const LazyAuth = lazyWithRetry(() => import("./pages/Auth"));
const LazyAuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const LazyResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const LazyEmbedChat = lazyWithRetry(() => import("./pages/EmbedChat"));
const LazyNotFound = lazyWithRetry(() => import("./pages/NotFound"));
const LazyThankYou = lazyWithRetry(() => import("./pages/ThankYou"));
const LazyLeadCapture = lazyWithRetry(() => import("./pages/LeadCapture"));
const LazyAppLayout = lazyWithRetry(() => import("@/components/AppLayout"));
const LazyNotifications = lazyWithRetry(() => import("@/components/NotificationLayer"));

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

const RestrictedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return isAdminEmail(user?.email) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const Notifications = () => {
  const { pathname } = useLocation();
  return pathname === '/' ? null : <Suspense fallback={null}><LazyNotifications /></Suspense>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Notifications />

            <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LazyPage><LazyIndex /></LazyPage>} />
                    <Route path="/auth" element={<LazyPage><LazyAuth /></LazyPage>} />
                    <Route path="/auth/callback" element={<LazyPage><LazyAuthCallback /></LazyPage>} />
                    <Route path="/reset-password" element={<LazyPage><LazyResetPassword /></LazyPage>} />
                    <Route path="/embed/chat/:agentId" element={<LazyPage><LazyEmbedChat /></LazyPage>} />
                    <Route path="/embed-chat/:assistantId" element={<LazyPage><LazyEmbedChat /></LazyPage>} />
                    <Route path="/thank-you" element={<LazyPage><LazyThankYou /></LazyPage>} />
                    <Route path="/lead-capture" element={<LazyPage><LazyLeadCapture /></LazyPage>} />

                    {/* Public marketing pages */}
                    <Route path="/crm" element={<Suspense fallback={<LoadingFallback />}><LazyCRMSales /></Suspense>} />
                    <Route path="/mercado-digital" element={<Suspense fallback={<LoadingFallback />}><LazyMercadoDigital /></Suspense>} />
                    <Route path="/es" element={<Suspense fallback={<LoadingFallback />}><LazyVentasEspanol /></Suspense>} />
                    <Route path="/espanol" element={<Suspense fallback={<LoadingFallback />}><LazyEspanol /></Suspense>} />
                    <Route path="/vsl-daniel" element={<Suspense fallback={<LoadingFallback />}><LazyVslDaniel /></Suspense>} />
                    <Route path="/vsl-talita" element={<Suspense fallback={<LoadingFallback />}><LazyVslTalita /></Suspense>} />
                    <Route path="/planos" element={<Suspense fallback={<LoadingFallback />}><LazyPlanos /></Suspense>} />
                    <Route path="/ferramentas/whatsapp-link/:slug" element={<Suspense fallback={<LoadingFallback />}><LazyNicheLinkGenerator /></Suspense>} />
                    <Route path="/ia/:slug" element={<Suspense fallback={<LoadingFallback />}><LazySectorIASolution /></Suspense>} />

                    {/* Protected routes with persistent sidebar layout */}
                    <Route element={<LazyPage><LazyAppLayout /></LazyPage>}>
                      <Route path="/dashboard" element={<LazyPage><LazyDashboard /></LazyPage>} />
                      <Route path="/assistants" element={<LazyPage><LazyAssistants /></LazyPage>} />
                      <Route path="/whatsapp" element={<LazyPage><LazyWhatsApp /></LazyPage>} />
                      <Route path="/meta-channels" element={<LazyPage><LazyMetaChannels /></LazyPage>} />
                      <Route path="/conversations" element={<LazyPage><LazyConversations /></LazyPage>} />
                      <Route path="/live-chat" element={<LazyPage><LazyLiveChat /></LazyPage>} />
                      <Route path="/sales-funnels" element={<LazyPage><LazySalesFunnels /></LazyPage>} />
                      <Route path="/admin" element={<LazyPage><LazyAdmin /></LazyPage>} />
                      <Route path="/widget-customization" element={<LazyPage><LazyWidgetCustomization /></LazyPage>} />
                      <Route path="/widget-analytics" element={<LazyPage><LazyWidgetAnalytics /></LazyPage>} />
                      <Route path="/crm-leads" element={<LazyPage><LazyCRMLeads /></LazyPage>} />
                      <Route path="/prospeccao" element={<RestrictedRoute><LazyPage><LazyProspeccao /></LazyPage></RestrictedRoute>} />
                      
                      <Route path="/calendar" element={<LazyPage><LazyCalendar /></LazyPage>} />
                      <Route path="/saldo-api" element={<LazyPage><LazyApiBalance /></LazyPage>} />
                      <Route path="/configuracoes/branding" element={<LazyPage><LazyBrandingSettings /></LazyPage>} />

                      {/* Changelog */}
                      <Route path="/novidades" element={<LazyPage><LazyChangelog /></LazyPage>} />
                      <Route path="/docs-tecnico" element={<RestrictedRoute><LazyPage><LazyTechnicalDocs /></LazyPage></RestrictedRoute>} />

                      {/* Tools */}
                      <Route path="/ferramentas/gerador-link-whatsapp" element={<LazyPage><LazyWhatsAppLinkGenerator /></LazyPage>} />
                      <Route path="/ferramentas/gerador-widget-whatsapp" element={<LazyPage><LazyWhatsAppWidgetGenerator /></LazyPage>} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<LazyPage><LazyNotFound /></LazyPage>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
