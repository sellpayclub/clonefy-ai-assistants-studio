import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event — Supabase fires this automatically
    // when it detects #access_token=...&type=recovery in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setCheckingSession(false);
      } else if (event === "SIGNED_IN" && session) {
        // Already logged in user navigating here — allow password change
        setIsRecoveryMode(true);
        setCheckingSession(false);
      }
    });

    // Also check if there's already a session (logged-in user)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsRecoveryMode(true);
      }
      setCheckingSession(false);
    });

    // Fallback: if URL has recovery hash, Supabase SDK will handle it
    // Give it 3s to fire the event before showing error
    const timeout = setTimeout(() => {
      setCheckingSession(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </div>
    );
  }

  // Invalid / expired link
  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-destructive">Link inválido ou expirado</h2>
          <p className="text-muted-foreground">
            Este link de redefinição de senha não é válido ou já expirou. Solicite um novo link na página de login.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ir para o login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-primary">Senha redefinida!</h2>
          <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">Clonefy</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Atualizando...
                </div>
              ) : (
                "Redefinir Senha"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate("/auth")}
            >
              Voltar ao login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
