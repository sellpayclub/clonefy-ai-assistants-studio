import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_HEJ1PRYD_NSygYpxkKXa2L4apc7rmuzkV";

// Helper para logs detalhados
const logStep = (step: string, details?: any) => {
    const timestamp = new Date().toISOString();
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[${timestamp}] [KIWIFY-WEBHOOK] ${step}${detailsStr}`);
};

// Gerar senha temporária segura
const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Enviar email via Resend
const sendWelcomeEmail = async (email: string, name: string, password: string, productName: string, planType: string = "pro") => {
    const loginUrl = "https://clonefyia.com/auth";
    const whatsappSupport = "https://wa.me/5511999999999"; // Substitua pelo número real

    // Determinar recursos do plano
    const planFeatures: Record<string, { agents: string; connections: string; color: string }> = {
        "starter": { agents: "1 Funcionário de IA", connections: "1 Conexão WhatsApp", color: "#3b82f6" },
        "pro": { agents: "3 Funcionários de IA", connections: "3 Conexões WhatsApp", color: "#10b981" },
        "unlimited": { agents: "Funcionários Ilimitados", connections: "10 Conexões WhatsApp", color: "#8b5cf6" },
    };

    const plan = planFeatures[planType.toLowerCase()] || planFeatures["pro"];

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu acesso CLONEFY está pronto!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a;">
      <div style="background: #1e293b; border-radius: 16px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://ekfkrwueqwpqakpsrsjt.supabase.co/storage/v1/object/public/assistant-media/clonefy-logo.png" alt="CLONEFY" style="height: 50px; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin: 0; font-size: 32px;">🎉 Parabéns!</h1>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 18px;">Sua compra foi confirmada com sucesso</p>
        </div>
        
        <!-- Greeting Box -->
        <div style="background: linear-gradient(135deg, ${plan.color}, ${plan.color}cc); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 10px 0; font-size: 22px;">Olá, ${name}! 👋</h2>
          <p style="margin: 0; opacity: 0.95; font-size: 16px;">Seu acesso ao <strong>${productName}</strong> está ativo!</p>
        </div>

        <!-- Product Info -->
        <div style="background: #334155; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #f8fafc; margin: 0 0 15px 0; font-size: 16px;">📦 Detalhes do seu plano:</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <div style="background: #1e293b; padding: 12px 16px; border-radius: 8px; flex: 1; min-width: 150px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">FUNCIONÁRIOS DE IA</p>
              <p style="margin: 5px 0 0 0; color: #10b981; font-size: 16px; font-weight: 600;">${plan.agents}</p>
            </div>
            <div style="background: #1e293b; padding: 12px 16px; border-radius: 8px; flex: 1; min-width: 150px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">CONEXÕES WHATSAPP</p>
              <p style="margin: 5px 0 0 0; color: #10b981; font-size: 16px; font-weight: 600;">${plan.connections}</p>
            </div>
          </div>
        </div>

        <!-- Credentials Box -->
        <div style="background: linear-gradient(135deg, #064e3b, #065f46); border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #10b981; margin: 0 0 20px 0; font-size: 18px;">🔐 Seus dados de acesso:</h3>
          
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Email de acesso</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #f8fafc;">${email}</p>
          </div>
          
          <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Senha temporária</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #10b981; font-family: 'Courier New', monospace; letter-spacing: 3px;">${password}</p>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 18px 50px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.5); transition: all 0.3s;">
            🚀 ACESSAR MINHA CONTA AGORA
          </a>
        </div>

        <!-- Warning -->
        <div style="background: #422006; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
            <strong>⚠️ Importante:</strong> Após o primeiro login, altere sua senha para uma de sua preferência em Configurações → Alterar Senha.
          </p>
        </div>

        <!-- Features -->
        <div style="background: #1e3a5f; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #60a5fa; margin: 0 0 15px 0; font-size: 16px;">✨ Comece agora mesmo:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #93c5fd;">
            <li style="margin-bottom: 8px;">Crie seu primeiro assistente de IA em minutos</li>
            <li style="margin-bottom: 8px;">Conecte seu WhatsApp e automatize o atendimento</li>
            <li style="margin-bottom: 8px;">Use as ferramentas bônus: ClickGo, Widget, Link Generator</li>
            <li>Comece a vender no piloto automático 24/7!</li>
          </ul>
        </div>

        <!-- Support -->
        <div style="background: #14532d; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
          <p style="color: #86efac; margin: 0 0 15px 0; font-size: 16px;"><strong>💬 Precisa de ajuda?</strong></p>
          <a href="${whatsappSupport}" style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            Falar com Suporte via WhatsApp
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #334155; padding-top: 25px;">
          <p style="margin: 0 0 5px 0;">Este email foi enviado automaticamente após a confirmação do pagamento.</p>
          <p style="margin: 0 0 5px 0;">© 2024 CLONEFY - Inteligência Artificial que Vende</p>
          <p style="margin: 0; color: #475569;">Desenvolvido com ❤️ no Brasil</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "CLONEFY <acesso@email.clonefyia.com>",
            to: [email],
            subject: `🎉 ${name}, seu acesso ao ${productName} está pronto!`,
            html: htmlContent,
        }),
    });

    const result = await response.json();
    logStep("Resend API response", { status: response.status, result });

    if (!response.ok) {
        throw new Error(`Failed to send email: ${JSON.stringify(result)}`);
    }

    return result;
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        logStep("=== KIWIFY WEBHOOK RECEBIDO ===");

        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405, headers: corsHeaders });
        }

        // Criar cliente Supabase com service role
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
        );

        // Ler payload
        const payload = await req.text();
        logStep("Raw payload", payload);

        let webhookData;
        try {
            webhookData = JSON.parse(payload);
            logStep("Parsed webhook data", webhookData);
        } catch {
            return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
        }

        // Extrair dados do Kiwify (estrutura pode variar)
        const customerEmail = webhookData.Customer?.email ||
            webhookData.customer?.email ||
            webhookData.email ||
            webhookData.buyer?.email;

        const customerName = webhookData.Customer?.full_name ||
            webhookData.customer?.name ||
            webhookData.customer?.full_name ||
            webhookData.name ||
            webhookData.buyer?.name ||
            customerEmail?.split('@')[0] || "Cliente";

        const productName = webhookData.Product?.product_name ||
            webhookData.product?.name ||
            webhookData.product_name ||
            webhookData.offer?.name ||
            "Plano CLONEFY";

        // Detectar tipo do plano baseado no nome do produto
        const productNameLower = productName.toLowerCase();
        let planType = "pro"; // default
        if (productNameLower.includes("starter") || productNameLower.includes("básico") || productNameLower.includes("47")) {
            planType = "starter";
        } else if (productNameLower.includes("ilimitado") || productNameLower.includes("unlimited") || productNameLower.includes("197")) {
            planType = "unlimited";
        } else if (productNameLower.includes("pro") || productNameLower.includes("97")) {
            planType = "pro";
        }

        const orderStatus = webhookData.order_status ||
            webhookData.status ||
            webhookData.webhook_event_type ||
            webhookData.event;

        logStep("Extracted data", { customerEmail, customerName, productName, planType, orderStatus });

        if (!customerEmail) {
            logStep("ERROR: Email não encontrado");
            return new Response(JSON.stringify({ error: "Email não encontrado" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Verificar se é um evento de pagamento aprovado
        const isApproved = (
            orderStatus === "paid" ||
            orderStatus === "approved" ||
            orderStatus === "order_paid" ||
            orderStatus === "order_approved" ||
            orderStatus === "completed" ||
            orderStatus === "PAID" ||
            orderStatus === "APPROVED"
        );

        if (!isApproved) {
            logStep("Pagamento não aprovado, ignorando", { orderStatus });
            return new Response(JSON.stringify({
                success: true,
                message: "Evento ignorado (pagamento não aprovado)",
                status: orderStatus
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        logStep("Pagamento aprovado! Processando...");

        // Verificar se usuário já existe
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

        let tempPassword = "";
        let userId = "";

        if (existingUser) {
            logStep("Usuário já existe", { userId: existingUser.id });
            userId = existingUser.id;

            // Gerar nova senha temporária
            tempPassword = generateTempPassword();

            // Atualizar senha do usuário existente
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                existingUser.id,
                { password: tempPassword }
            );

            if (updateError) {
                logStep("Erro ao atualizar senha", updateError);
            }
        } else {
            logStep("Criando novo usuário...");

            // Gerar senha temporária
            tempPassword = generateTempPassword();

            // Criar usuário no Supabase Auth
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                email: customerEmail,
                password: tempPassword,
                email_confirm: true, // Já confirma o email automaticamente
                user_metadata: {
                    full_name: customerName,
                    source: "kiwify",
                    product: productName,
                }
            });

            if (createError) {
                logStep("Erro ao criar usuário", createError);
                throw createError;
            }

            userId = newUser.user?.id || "";
            logStep("Usuário criado com sucesso", { userId });
        }

        // Registrar na tabela paid_subscribers
        const { error: subscriberError } = await supabaseClient
            .from("paid_subscribers")
            .upsert({
                email: customerEmail,
                payment_status: "approved",
                payment_processor: "kiwify",
                subscription_start: new Date().toISOString(),
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email',
                ignoreDuplicates: false
            });

        if (subscriberError) {
            logStep("Erro ao salvar subscriber", subscriberError);
        }

        // Fazer upgrade do usuário
        const { error: upgradeError } = await supabaseClient.rpc(
            'upgrade_user_to_paid',
            { target_email: customerEmail }
        );

        if (upgradeError) {
            logStep("Erro no upgrade", upgradeError);
        } else {
            logStep("Upgrade aplicado com sucesso");
        }

        // Enviar email de boas-vindas com credenciais
        logStep("Enviando email de acesso...");
        await sendWelcomeEmail(customerEmail, customerName, tempPassword, productName, planType);
        logStep("Email enviado com sucesso!");

        logStep("=== WEBHOOK PROCESSADO COM SUCESSO ===");

        return new Response(
            JSON.stringify({
                success: true,
                message: "Usuário criado e email enviado com sucesso",
                data: {
                    email: customerEmail,
                    userId,
                    emailSent: true
                }
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack' });

        return new Response(
            JSON.stringify({ error: errorMessage, success: false }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
