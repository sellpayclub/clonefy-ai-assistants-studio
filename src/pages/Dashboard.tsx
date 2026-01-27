import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Smartphone, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUserLimits } from "@/hooks/useUserLimits";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { limits, loading: limitsLoading } = useUserLimits();
  const { stats, loading: statsLoading } = useDashboardStats(user);

  // Memoized navigation handlers
  const navigationHandlers = useMemo(() => ({
    toAssistants: () => navigate('/assistants'),
    toWhatsApp: () => navigate('/whatsapp'),
    toConversations: () => navigate('/conversations'),
  }), [navigate]);

  const safeStats = stats || { assistants: 0, connections: 0, conversations: 0, messages: 0 };

  if (statsLoading || limitsLoading || !user) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t("dashboard.loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              {t("dashboard.welcome")}, {user?.user_metadata?.full_name || user?.email}!
            </p>
          </div>
        </div>
        <Button onClick={signOut} variant="outline" className="w-full sm:w-auto text-sm">
          {t("dashboard.signOut")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.stats.agents")}</CardTitle>
            <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{safeStats.assistants}</div>
            <p className="text-xs text-muted-foreground">
              {limits ? (
                <span className="text-green-600">
                  {safeStats.assistants}/{limits.max_assistants} agentes utilizados
                </span>
              ) : (
                t("dashboard.stats.agentsDesc")
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.stats.connections")}</CardTitle>
            <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{safeStats.connections}</div>
            <p className="text-xs text-muted-foreground">
              {limits ? (
                <span className="text-green-600">
                  {safeStats.connections}/{limits.max_whatsapp_connections} conexões utilizadas
                </span>
              ) : (
                t("dashboard.stats.connectionsDesc")
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toAssistants}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.createAgent.title")}</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {t("dashboard.quickActions.createAgent.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all group-hover:scale-105 text-sm sm:text-base" onClick={navigationHandlers.toAssistants}>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {t("dashboard.quickActions.createAgent.button")}
            </Button>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toWhatsApp}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.connectWhatsApp.title")}</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {t("dashboard.quickActions.connectWhatsApp.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full bg-gradient-to-r from-secondary/80 to-muted hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all group-hover:scale-105 text-sm sm:text-base" variant="outline" onClick={navigationHandlers.toWhatsApp}>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {t("dashboard.quickActions.connectWhatsApp.button")}
            </Button>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toConversations}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
              <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.startChat.title")}</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {t("dashboard.quickActions.startChat.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full bg-gradient-to-r from-accent/80 to-muted hover:from-primary/30 hover:to-primary/20 border border-primary/30 transition-all group-hover:scale-105 text-sm sm:text-base" variant="secondary" onClick={navigationHandlers.toConversations}>
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {t("dashboard.quickActions.startChat.button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;
