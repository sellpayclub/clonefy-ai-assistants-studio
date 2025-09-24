(function() {
  'use strict';

  // Obter assistant ID do script atual
  const currentScript = document.currentScript || document.querySelector('script[data-assistant-id]');
  const assistantId = currentScript ? currentScript.dataset.assistantId : null;
  
  if (!assistantId) {
    console.error('CLONEFY: Assistant ID não encontrado. Adicione data-assistant-id ao script.');
    return;
  }

  // Configuração base
  const baseUrl = currentScript ? new URL(currentScript.src).origin : window.location.origin;
  const apiUrl = `${baseUrl}/supabase/functions/v1`;
  
  // Widget object
  const clonefyWidget = {
    assistantId: assistantId,
    isOpen: false,
    config: null,
    sessionId: null,
    conversationId: null,
    iframe: null,
    button: null,

    async init() {
      try {
        // Gerar session ID único
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Carregar configuração do widget
        await this.loadConfig();
        
        // Criar elementos se a configuração estiver ativa
        if (this.config && this.config.is_active) {
          this.createStyles();
          this.createButton();
          this.createIframe();
          this.attachEvents();
          
          // Registrar início de sessão
          await this.trackEvent('start_session');
        }
      } catch (error) {
        console.error('CLONEFY: Erro ao inicializar widget:', error);
      }
    },

    async loadConfig() {
      try {
        const response = await fetch(`${apiUrl}/widget-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId: this.assistantId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          this.config = data.config;
        } else {
          throw new Error(data.error || 'Erro ao carregar configuração');
        }
      } catch (error) {
        console.error('CLONEFY: Erro ao carregar configuração:', error);
        // Usar configuração padrão como fallback
        this.config = {
          widget_name: 'Assistente Virtual',
          avatar_url: '',
          button_icon_url: '',
          welcome_message: 'Olá! Como posso ajudar você hoje?',
          primary_color: '#0066cc',
          secondary_color: '#f8f9fa',
          text_color: '#333333',
          button_position: 'right',
          is_active: true
        };
      }
    },

    createStyles() {
      const styles = `
        .clonefy-widget-button {
          position: fixed !important;
          bottom: 24px !important;
          ${this.config.button_position}: 24px !important;
          width: 60px !important;
          height: 60px !important;
          border-radius: 50% !important;
          border: none !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          z-index: 2147483647 !important;
          background: ${this.config.primary_color} !important;
          color: ${this.config.secondary_color} !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
          font-size: 24px !important;
        }
        
        .clonefy-widget-button:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
        }
        
        .clonefy-widget-iframe {
          position: fixed !important;
          bottom: 90px !important;
          ${this.config.button_position}: 24px !important;
          width: 380px !important;
          height: 600px !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          z-index: 2147483646 !important;
          background: white !important;
          opacity: 0 !important;
          transform: scale(0.8) translateY(20px) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          pointer-events: none !important;
        }
        
        .clonefy-widget-iframe.open {
          opacity: 1 !important;
          transform: scale(1) translateY(0) !important;
          pointer-events: all !important;
        }
        
        @media (max-width: 768px) {
          .clonefy-widget-iframe {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            z-index: 2147483647 !important;
          }
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    },

    createButton() {
      this.button = document.createElement('button');
      this.button.className = 'clonefy-widget-button';
      this.button.setAttribute('aria-label', 'Abrir chat');
      this.button.title = `Chat com ${this.config.widget_name}`;
      
      // Definir conteúdo do botão
      if (this.config.button_icon_url) {
        this.button.innerHTML = `<img src="${this.config.button_icon_url}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;" alt="Chat">`;
      } else {
        this.button.innerHTML = '💬';
      }
      
      document.body.appendChild(this.button);
    },

    createIframe() {
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'clonefy-widget-iframe';
      this.iframe.src = `${baseUrl}/embed-chat/${this.assistantId}`;
      this.iframe.title = `Chat com ${this.config.widget_name}`;
      this.iframe.allow = 'microphone; camera';
      this.iframe.loading = 'lazy';
      
      document.body.appendChild(this.iframe);
    },

    attachEvents() {
      // Evento de clique no botão
      if (this.button) {
        this.button.addEventListener('click', () => {
          this.toggle();
        });
      }

      // Evento para fechar com ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Evento para fechar clicando fora (apenas desktop)
      document.addEventListener('click', (e) => {
        if (this.isOpen && 
            !this.iframe.contains(e.target) && 
            !this.button.contains(e.target) &&
            window.innerWidth > 768) {
          this.close();
        }
      });

      // Eventos de mensagem do iframe
      window.addEventListener('message', (event) => {
        if (event.origin !== baseUrl) return;

        const { type, data } = event.data;
        
        switch (type) {
          case 'clonefy:conversation_started':
            this.conversationId = data.conversationId;
            this.trackEvent('new_conversation');
            break;
          case 'clonefy:message_sent':
            this.trackEvent('new_message', { messageType: data.messageType });
            break;
          case 'clonefy:close_widget':
            this.close();
            break;
        }
      });

      // Evento antes de sair da página
      window.addEventListener('beforeunload', () => {
        if (this.sessionId) {
          this.trackEvent('end_session');
        }
      });
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      if (!this.iframe) return;
      
      this.isOpen = true;
      this.iframe.classList.add('open');
      this.button.innerHTML = '✕';
      this.button.setAttribute('aria-label', 'Fechar chat');
      
      // Enviar configuração para o iframe quando abrir
      setTimeout(() => {
        this.iframe.contentWindow?.postMessage({
          type: 'clonefy:config',
          data: {
            config: this.config,
            sessionId: this.sessionId,
            assistantId: this.assistantId
          }
        }, baseUrl);
      }, 100);
    },

    close() {
      if (!this.iframe) return;
      
      this.isOpen = false;
      this.iframe.classList.remove('open');
      
      // Restaurar ícone do botão
      if (this.config.button_icon_url) {
        this.button.innerHTML = `<img src="${this.config.button_icon_url}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;" alt="Chat">`;
      } else {
        this.button.innerHTML = '💬';
      }
      this.button.setAttribute('aria-label', 'Abrir chat');
    },

    async trackEvent(action, data = {}) {
      try {
        await fetch(`${apiUrl}/widget-analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId: this.assistantId,
            action: action,
            sessionId: this.sessionId,
            conversationId: this.conversationId,
            visitorIp: null, // Não coletamos IP no frontend
            userAgent: navigator.userAgent,
            ...data
          })
        });
      } catch (error) {
        console.error('CLONEFY: Erro ao rastrear evento:', error);
      }
    }
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      clonefyWidget.init();
    });
  } else {
    clonefyWidget.init();
  }

  // Expor globalmente para debug/customização
  window.ClonefyWidget = clonefyWidget;
})();