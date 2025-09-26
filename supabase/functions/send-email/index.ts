import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface User {
  email: string;
  raw_user_meta_data?: {
    full_name?: string;
  };
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const { user, email_data }: { user: User; email_data: EmailData } = wh.verify(payload, headers) as any;

    console.log('Email webhook received:', { 
      email: user.email, 
      action: email_data.email_action_type 
    });

    const userName = user.raw_user_meta_data?.full_name || user.email.split('@')[0];
    
    let subject = '';
    let htmlContent = '';
    let textContent = '';

    // Generate email content based on action type
    if (email_data.email_action_type === 'signup') {
      subject = 'Bem-vindo(a) à CLONEFY - Confirme seu email';
      
      const confirmUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu email - CLONEFY</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://ekfkrwueqwpqakpsrsjt.supabase.co/storage/v1/object/public/assistant-media/clonefy-logo.png" alt="CLONEFY" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Bem-vindo(a) à CLONEFY!</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${userName}!</h2>
            <p>Obrigado por se cadastrar na CLONEFY, a plataforma de inteligência artificial mais avançada do Brasil!</p>
            <p>Para ativar sua conta e começar a criar assistentes de IA incríveis, confirme seu email clicando no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                ✉️ Confirmar Email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px; font-family: monospace;">${confirmUrl}</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">🚀 O que você pode fazer na CLONEFY:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Criar assistentes de IA personalizados</li>
              <li>Conectar com WhatsApp Business</li>
              <li>Automatizar atendimento ao cliente</li>
              <li>Processar documentos e imagens</li>
              <li>E muito mais!</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>Se você não criou uma conta na CLONEFY, pode ignorar este email com segurança.</p>
            <p style="margin: 5px 0;">© 2024 CLONEFY - Inteligência Artificial Avançada</p>
            <p style="margin: 0;">Desenvolvido com ❤️ no Brasil</p>
          </div>
        </body>
        </html>
      `;
      
      textContent = `
        Bem-vindo(a) à CLONEFY!
        
        Olá, ${userName}!
        
        Obrigado por se cadastrar na CLONEFY, a plataforma de inteligência artificial mais avançada do Brasil!
        
        Para ativar sua conta, confirme seu email acessando este link:
        ${confirmUrl}
        
        O que você pode fazer na CLONEFY:
        • Criar assistentes de IA personalizados
        • Conectar com WhatsApp Business  
        • Automatizar atendimento ao cliente
        • Processar documentos e imagens
        • E muito mais!
        
        Se você não criou uma conta na CLONEFY, pode ignorar este email.
        
        © 2024 CLONEFY - Inteligência Artificial Avançada
      `;
      
    } else if (email_data.email_action_type === 'recovery') {
      subject = 'CLONEFY - Redefinir sua senha';
      
      const resetUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir senha - CLONEFY</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://ekfkrwueqwpqakpsrsjt.supabase.co/storage/v1/object/public/assistant-media/clonefy-logo.png" alt="CLONEFY" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0;">Redefinir Senha</h1>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 30px;">
            <h2 style="color: #991b1b; margin-top: 0;">Olá, ${userName}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta CLONEFY.</p>
            <p>Se foi você quem solicitou, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                🔐 Redefinir Senha
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px; font-family: monospace;">${resetUrl}</p>
          </div>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Importante:</p>
            <p style="margin: 10px 0 0 0; color: #92400e;">Este link expira em 1 hora por segurança. Se não foi você quem solicitou, ignore este email.</p>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>© 2024 CLONEFY - Inteligência Artificial Avançada</p>
            <p style="margin: 0;">Desenvolvido com ❤️ no Brasil</p>
          </div>
        </body>
        </html>
      `;
      
      textContent = `
        CLONEFY - Redefinir Senha
        
        Olá, ${userName}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta CLONEFY.
        
        Se foi você quem solicitou, acesse este link para criar uma nova senha:
        ${resetUrl}
        
        ⚠️ Importante: Este link expira em 1 hora por segurança.
        
        Se não foi você quem solicitou, ignore este email.
        
        © 2024 CLONEFY - Inteligência Artificial Avançada
      `;
    }

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: 'CLONEFY <noreply@clonefy.ai>',
      to: [user.email],
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully to:', user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(serve_handler);