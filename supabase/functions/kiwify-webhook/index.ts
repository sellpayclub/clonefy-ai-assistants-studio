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
const sendWelcomeEmail = async (email: string, name: string, password: string, productName: string) => {
    const loginUrl = "https://clonefyia.com/auth";

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu acesso CLONEFY está pronto!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://ekfkrwueqwpqakpsrsjt.supabase.co/storage/v1/object/public/assistant-media/clonefy-logo.png" alt="CLONEFY" style="height: 60px; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px;">🎉 Parabéns pela sua compra!</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 10px 0; font-size: 20px;">Olá, ${name}!</h2>
          <p style="margin: 0; opacity: 0.95;">Seu acesso ao <strong>${productName}</strong> está pronto!</p>
        </div>

        <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #166534; margin: 0 0 20px 0; font-size: 18px;">🔐 Seus dados de acesso:</h3>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Email:</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">${email}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Senha temporária:</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 700; color: #10b981; font-family: monospace; letter-spacing: 2px;">${password}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);">
            🚀 ACESSAR MINHA CONTA
          </a>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Importante:</strong> Após o primeiro login, recomendamos que você altere sua senha para uma de sua preferência.
          </p>
        </div>

        <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">✨ O que você pode fazer agora:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
            <li style="margin-bottom: 8px;">Criar seus assistentes de IA personalizados</li>
            <li style="margin-bottom: 8px;">Conectar seu WhatsApp para atendimento automatizado</li>
            <li style="margin-bottom: 8px;">Acessar todas as ferramentas bônus incluídas</li>
            <li>Começar a vender no piloto automático!</li>
          </ul>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 25px;">
          <p style="margin: 0 0 10px 0;">Precisa de ajuda? Fale conosco pelo WhatsApp</p>
          <p style="margin: 0;">© 2024 CLONEFY - Inteligência Artificial que Vende</p>
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
            subject: "🎉 Seu acesso CLONEFY está pronto!",
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
            "Plano CLONEFY";

        const orderStatus = webhookData.order_status ||
            webhookData.status ||
            webhookData.webhook_event_type ||
            webhookData.event;

        logStep("Extracted data", { customerEmail, customerName, productName, orderStatus });

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
        await sendWelcomeEmail(customerEmail, customerName, tempPassword, productName);
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
