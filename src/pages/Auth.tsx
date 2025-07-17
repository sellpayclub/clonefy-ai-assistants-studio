import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Clean up any existing auth state when landing on auth page
    cleanupAuthState();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o email está na lista de emails autorizados
      const { data: authorizedEmail, error: emailCheckError } = await supabase
        .from('authorized_emails')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (emailCheckError || !authorizedEmail) {
        toast({
          title: "Email não autorizado",
          description: "Este email não está autorizado a criar conta. Entre em contato com o administrador.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      toast({
        title: t("auth.accountCreated"),
        description: t("auth.checkEmail"),
      });
    } catch (error: any) {
      toast({
        title: t("auth.signUpError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.warn('Warning during initial cleanup:', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Force page reload for clean state
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: t("auth.signInError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email para redefinir a senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')] opacity-30"></div>
      
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/90 text-lg font-medium">{t("dashboard.loading")}</p>
          </div>
        </div>
      )}
      
      {/* Theme Toggle & Language Selector */}
      <div className="absolute top-6 right-6 flex gap-3 z-20">
        <div className="backdrop-blur-md bg-white/10 rounded-full p-2 border border-white/20">
          <LanguageSelector />
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-full p-2 border border-white/20">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              CLONEFY
            </h1>
            <p className="text-purple-200 text-lg">
              {t("auth.subtitle")}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 backdrop-blur-sm rounded-xl p-1 h-14">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-900 data-[state=active]:shadow-lg transition-all duration-300 text-white/80 rounded-lg font-medium"
                  >
                    {t("auth.signin")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-900 data-[state=active]:shadow-lg transition-all duration-300 text-white/80 rounded-lg font-medium"
                  >
                    {t("auth.signup")}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-6">
                  {!showForgotPassword ? (
                    <form onSubmit={handleSignIn} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/90 font-medium text-sm">
                          {t("auth.email")}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("auth.emailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/90 font-medium text-sm">
                          {t("auth.password")}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder={t("auth.passwordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {t("auth.signingIn")}
                          </div>
                        ) : (
                          t("auth.signInButton")
                        )}
                      </Button>
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          className="text-purple-200 hover:text-white transition-colors text-sm"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Esqueci minha senha
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Redefinir Senha</h3>
                        <p className="text-purple-200 text-sm">
                          Digite seu email para receber as instruções de redefinição
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail" className="text-white/90 font-medium text-sm">
                          Email
                        </Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="Digite seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enviando...
                          </div>
                        ) : (
                          "Enviar email de redefinição"
                        )}
                      </Button>
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          className="text-purple-200 hover:text-white transition-colors text-sm"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          ← Voltar ao login
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-6">
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/90 font-medium text-sm">
                        {t("auth.fullName")}
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t("auth.fullNamePlaceholder")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail" className="text-white/90 font-medium text-sm">
                        {t("auth.email")}
                      </Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword" className="text-white/90 font-medium text-sm">
                        {t("auth.password")}
                      </Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder={t("auth.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-purple-400 transition-all duration-300 rounded-lg"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t("auth.signingUp")}
                        </div>
                      ) : (
                        t("auth.signUpButton")
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-purple-200/70 text-sm">
            <p>© 2024 CLONEFY. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;