(function () {
  'use strict';

  // Obter assistant ID do script atual
  const currentScript = document.currentScript || document.querySelector('script[data-assistant-id]');
  const assistantId = currentScript ? currentScript.dataset.assistantId : null;

  if (!assistantId) {
    console.error('CLONEFY: Assistant ID não encontrado. Adicione data-assistant-id ao script.');
    return;
  }

  // Configuração base
  // Sempre usar o domínio da página atual para buscar configuração e iframe
  // Isso permite que o script seja carregado de qualquer domínio (CDN, etc)
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/supabase/functions/v1`;

  console.log('CLONEFY: Inicializando widget', {
    assistantId: assistantId,
    baseUrl: baseUrl,
    apiUrl: apiUrl,
    scriptOrigin: currentScript ? new URL(currentScript.src).origin : 'unknown',
    pageOrigin: window.location.origin
  });

  // Widget object
  const clonefyWidget = {
    assistantId: assistantId,
    isOpen: false,
    config: null,
    sessionId: null,
    conversationId: null,
    iframe: null,
    button: null,
    templateContainer: null,
    pendingMessage: null, // Message to send when chat opens

    async init() {
      try {
        // Gerar session ID único
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Carregar configuração do widget (sempre forçar refresh na inicialização)
        await this.loadConfig(true);

        // Criar elementos se a configuração estiver ativa
        if (this.config && this.config.is_active) {
          this.createStyles();
          this.createElements();
          this.attachEvents();

          console.log('CLONEFY: Widget inicializado com sucesso', {
            template: this.config.widget_template,
            assistantId: this.assistantId,
            hasTemplateContainer: !!this.templateContainer,
            templateContainerVisible: this.templateContainer ? !this.templateContainer.classList.contains('hidden') : false,
            config: JSON.stringify(this.config)
          });

          // FORÇAR criação do template se necessário - usar múltiplos timeouts para garantir
          const ensureTemplateCreated = () => {
            if (this.config && this.config.widget_template && this.config.widget_template !== 'classic') {
              if (!this.templateContainer || this.templateContainer.children.length === 0) {
                console.log('CLONEFY: [FORÇAR] Criando template container - template:', this.config.widget_template);
                this.createTemplateElements();

                // Verificar novamente após criar
                setTimeout(() => {
                  if (this.templateContainer && this.templateContainer.children.length > 0) {
                    console.log('CLONEFY: [SUCESSO] Template container criado e visível');
                    this.templateContainer.classList.remove('hidden');
                  } else {
                    console.error('CLONEFY: [ERRO] Template container não foi criado corretamente');
                  }
                }, 200);
              } else {
                console.log('CLONEFY: Template container já existe, garantindo visibilidade');
                this.templateContainer.classList.remove('hidden');
              }
            } else {
              console.log('CLONEFY: Template é classic ou não definido:', this.config?.widget_template);
            }
          };

          // Tentar múltiplas vezes para garantir
          setTimeout(ensureTemplateCreated, 50);
          setTimeout(ensureTemplateCreated, 200);
          setTimeout(ensureTemplateCreated, 500);

          // Registrar início de sessão
          await this.trackEvent('start_session');
        } else {
          console.warn('CLONEFY: Widget desativado ou configuração inválida', {
            hasConfig: !!this.config,
            is_active: this.config?.is_active
          });
        }
      } catch (error) {
        console.error('CLONEFY: Erro ao inicializar widget:', error);
      }
    },

    async loadConfig(forceRefresh = false) {
      try {
        // Adicionar cache busting para garantir atualizações
        const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
        const response = await fetch(`${apiUrl}/widget-config${cacheBuster}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            assistantId: this.assistantId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('=== CLONEFY: API RESPONSE ===');
        console.log('Success:', data.success);
        console.log('Full Config:', JSON.stringify(data.config, null, 2));
        console.log('============================');

        if (data.success) {
          const oldTemplate = this.config?.widget_template;
          this.config = data.config;

          console.log('=== CLONEFY: TEMPLATE DETECTION ===');
          console.log('Widget Template:', this.config.widget_template);
          console.log('Template Type:', typeof this.config.widget_template);
          console.log('Is Classic?:', this.config.widget_template === 'classic');
          console.log('Is Active?:', this.config.is_active);
          console.log('Widget Name:', this.config.widget_name);
          console.log('Has Template Container?:', !!this.templateContainer);
          console.log('Bubble Message:', this.config.bubble_message);
          console.log('Action Buttons:', this.config.action_buttons);
          console.log('Quick Questions:', this.config.quick_questions);
          console.log('==================================');

          // Se o template mudou, recriar elementos
          if (oldTemplate && oldTemplate !== this.config.widget_template) {
            console.log('CLONEFY: Template mudou, recriando elementos...', {
              old: oldTemplate,
              new: this.config.widget_template
            });

            // Remover elementos antigos
            if (this.templateContainer) {
              this.templateContainer.remove();
              this.templateContainer = null;
            }

            // Recriar elementos com novo template
            this.createTemplateElements();
          } else if (!oldTemplate && this.config.widget_template && this.config.widget_template !== 'classic') {
            // Se é a primeira vez carregando e o template não é classic, criar elementos
            console.log('CLONEFY: Primeira inicialização com template personalizado:', this.config.widget_template);
            // Usar setTimeout para garantir que o DOM esteja pronto
            setTimeout(() => {
              this.createTemplateElements();
            }, 50);
          } else if (this.config.widget_template && this.config.widget_template !== 'classic' && !this.templateContainer) {
            // Fallback: se o template não é classic mas o container não existe, criar
            console.log('CLONEFY: Template personalizado detectado mas container não existe, criando...', this.config.widget_template);
            setTimeout(() => {
              this.createTemplateElements();
            }, 50);
          }
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
          is_active: true,
          widget_template: 'classic',
          bubble_message: 'Oi! Como posso te ajudar?',
          quick_questions: [],
          action_buttons: [],
          show_status_indicator: true,
          status_text: 'Online agora'
        };
      }
    },

    createStyles() {
      const position = this.config.button_position || 'right';
      const oppositePosition = position === 'right' ? 'left' : 'right';

      const styles = `
        /* Base Button Styles */
        .clonefy-widget-button {
          position: fixed !important;
          bottom: 24px !important;
          ${position}: 24px !important;
          width: 60px !important;
          height: 60px !important;
          border-radius: 50% !important;
          border: none !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          z-index: 2147483645 !important;
          background: ${this.config.primary_color} !important;
          color: ${this.config.secondary_color} !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
          font-size: 24px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .clonefy-widget-button:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
        }

        .clonefy-widget-button img {
          width: 32px !important;
          height: 32px !important;
          object-fit: cover !important;
          border-radius: 4px !important;
        }

        /* Notification Badge */
        .clonefy-widget-badge {
          position: absolute !important;
          top: -4px !important;
          right: -4px !important;
          width: 22px !important;
          height: 22px !important;
          border-radius: 50% !important;
          background: #ef4444 !important;
          color: white !important;
          font-size: 12px !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 2px solid white !important;
        }

        /* Template Container */
        .clonefy-template-container {
          position: fixed !important;
          bottom: 100px !important;
          ${position}: 24px !important;
          z-index: 2147483644 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }

        .clonefy-template-container.hidden {
          opacity: 0 !important;
          transform: translateY(10px) !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }

        /* Bubble Template */
        .clonefy-bubble {
          max-width: 280px !important;
          background: white !important;
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          position: relative !important;
        }

        .clonefy-bubble::after {
          content: '' !important;
          position: absolute !important;
          bottom: -8px !important;
          ${position}: 20px !important;
          width: 16px !important;
          height: 16px !important;
          background: white !important;
          transform: rotate(45deg) !important;
          border-right: 1px solid rgba(0,0,0,0.08) !important;
          border-bottom: 1px solid rgba(0,0,0,0.08) !important;
        }

        .clonefy-bubble-text {
          color: ${this.config.text_color} !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          margin: 0 !important;
        }

        .clonefy-bubble-close {
          position: absolute !important;
          top: -8px !important;
          ${oppositePosition}: -8px !important;
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          background: #f3f4f6 !important;
          border: none !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 12px !important;
          color: #6b7280 !important;
          transition: all 0.2s ease !important;
        }

        .clonefy-bubble-close:hover {
          background: #e5e7eb !important;
          color: #374151 !important;
        }

        /* Agent Card Template */
        .clonefy-agent-card {
          width: 300px !important;
          background: white !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          overflow: hidden !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }

        .clonefy-agent-card-header {
          padding: 16px !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          background: linear-gradient(135deg, ${this.config.primary_color}, ${this.config.primary_color}dd) !important;
        }

        .clonefy-agent-card-avatar {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          object-fit: cover !important;
          border: 2px solid rgba(255,255,255,0.3) !important;
        }

        .clonefy-agent-card-avatar-placeholder {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          background: rgba(255,255,255,0.2) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: ${this.config.secondary_color} !important;
          font-size: 24px !important;
        }

        .clonefy-agent-card-info {
          flex: 1 !important;
        }

        .clonefy-agent-card-name {
          color: ${this.config.secondary_color} !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          margin: 0 0 4px 0 !important;
        }

        .clonefy-agent-card-status {
          color: ${this.config.secondary_color} !important;
          font-size: 12px !important;
          opacity: 0.9 !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin: 0 !important;
        }

        .clonefy-status-dot {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background: #22c55e !important;
          animation: clonefy-pulse 2s infinite !important;
        }

        @keyframes clonefy-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .clonefy-agent-card-body {
          padding: 16px !important;
        }

        .clonefy-agent-card-message {
          color: ${this.config.text_color} !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          margin: 0 0 12px 0 !important;
        }

        .clonefy-agent-card-search {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 10px 14px !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 24px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin-bottom: 12px !important;
        }

        .clonefy-agent-card-search:hover {
          border-color: ${this.config.primary_color}80 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
        }

        .clonefy-agent-card-search-icon {
          color: #9ca3af !important;
          font-size: 16px !important;
        }

        .clonefy-agent-card-search-text {
          color: #9ca3af !important;
          font-size: 14px !important;
        }

        .clonefy-agent-card-buttons {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
        }

        .clonefy-agent-card-btn {
          padding: 8px 14px !important;
          border-radius: 20px !important;
          border: none !important;
          cursor: pointer !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          background: ${this.config.primary_color} !important;
          color: ${this.config.secondary_color} !important;
        }

        .clonefy-agent-card-btn:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px) !important;
        }

        /* Quick Questions Template */
        .clonefy-quick-questions {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          max-width: 280px !important;
        }

        .clonefy-quick-question {
          background: white !important;
          border-radius: 20px !important;
          padding: 12px 16px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          font-size: 14px !important;
          color: ${this.config.text_color} !important;
          text-align: left !important;
        }

        .clonefy-quick-question:hover {
          transform: translateX(${position === 'right' ? '-4px' : '4px'}) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
          border-color: ${this.config.primary_color}40 !important;
        }

        /* Iframe Styles */
        .clonefy-widget-iframe {
          position: fixed !important;
          bottom: 100px !important;
          ${position}: 24px !important;
          width: 380px !important;
          height: 600px !important;
          border: none !important;
          border-radius: 16px !important;
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

          .clonefy-template-container {
            ${position}: 16px !important;
            bottom: 90px !important;
            max-width: calc(100vw - 100px) !important;
          }

          .clonefy-agent-card {
            width: calc(100vw - 100px) !important;
            max-width: 300px !important;
          }
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.id = 'clonefy-widget-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    },

    createElements() {
      // Create button
      this.createButton();

      // Create template-specific elements (only if config is loaded)
      if (this.config) {
        console.log('CLONEFY: createElements chamado, criando template:', this.config.widget_template);
        this.createTemplateElements();
      } else {
        console.warn('CLONEFY: Config não carregada ao criar elementos - será criado depois');
      }

      // Create iframe
      this.createIframe();
    },

    createButton() {
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `position: fixed !important; bottom: 24px !important; ${this.config.button_position}: 24px !important; z-index: 2147483645 !important;`;

      this.button = document.createElement('button');
      this.button.className = 'clonefy-widget-button';
      this.button.setAttribute('aria-label', 'Abrir chat');
      this.button.title = `Chat com ${this.config.widget_name}`;

      // Definir conteúdo do botão
      this.updateButtonIcon(false);

      // Add notification badge for quick_questions template
      if (this.config.widget_template === 'quick_questions' &&
        this.config.quick_questions &&
        this.config.quick_questions.filter(q => q).length > 0) {
        const badge = document.createElement('span');
        badge.className = 'clonefy-widget-badge';
        badge.textContent = this.config.quick_questions.filter(q => q).length;
        this.button.appendChild(badge);
      }

      buttonContainer.appendChild(this.button);
      document.body.appendChild(buttonContainer);
    },

    updateButtonIcon(isOpen) {
      if (isOpen) {
        this.button.innerHTML = '✕';
      } else if (this.config.button_icon_url) {
        this.button.innerHTML = `<img src="${this.config.button_icon_url}" alt="Chat">`;
      } else {
        this.button.innerHTML = '💬';
      }

      // Re-add badge if needed
      if (!isOpen &&
        this.config.widget_template === 'quick_questions' &&
        this.config.quick_questions &&
        this.config.quick_questions.filter(q => q).length > 0) {
        const badge = document.createElement('span');
        badge.className = 'clonefy-widget-badge';
        badge.textContent = this.config.quick_questions.filter(q => q).length;
        this.button.appendChild(badge);
      }
    },

    createTemplateElements() {
      if (!this.config) {
        console.warn('CLONEFY: Tentando criar template sem configuração carregada');
        return;
      }

      const template = this.config.widget_template || 'classic';

      console.log('CLONEFY: Criando elementos do template:', {
        template: template,
        template_type: typeof template,
        config_widget_template: this.config.widget_template,
        full_config: JSON.stringify(this.config)
      });

      // Don't create template elements for classic
      if (template === 'classic') {
        console.log('CLONEFY: Template é classic, não criando elementos de template');
        return;
      }

      // Se já existe um container, remover antes de criar novo
      if (this.templateContainer) {
        console.log('CLONEFY: Removendo template container existente');
        this.templateContainer.remove();
        this.templateContainer = null;
      }

      this.templateContainer = document.createElement('div');
      this.templateContainer.className = 'clonefy-template-container';
      console.log('CLONEFY: Template container criado:', this.templateContainer);

      let templateCreated = false;
      switch (template) {
        case 'bubble':
          console.log('CLONEFY: Criando template bubble');
          this.createBubbleTemplate();
          templateCreated = true;
          break;
        case 'agent_card':
          console.log('CLONEFY: Criando template agent_card');
          this.createAgentCardTemplate();
          templateCreated = true;
          break;
        case 'quick_questions':
          console.log('CLONEFY: Criando template quick_questions');
          this.createQuickQuestionsTemplate();
          templateCreated = true;
          break;
        default:
          console.warn('CLONEFY: Template desconhecido:', template);
          return;
      }

      if (this.templateContainer && this.templateContainer.children.length > 0) {
        document.body.appendChild(this.templateContainer);
        console.log('CLONEFY: Template container criado e adicionado ao DOM:', {
          template: template,
          children_count: this.templateContainer.children.length,
          is_visible: !this.templateContainer.classList.contains('hidden'),
          computed_style: window.getComputedStyle(this.templateContainer).display,
          z_index: window.getComputedStyle(this.templateContainer).zIndex
        });
      } else {
        console.error('CLONEFY: Falha ao criar template container:', {
          hasContainer: !!this.templateContainer,
          children_count: this.templateContainer?.children.length || 0,
          template: template
        });
      }
    },

    createBubbleTemplate() {
      const bubble = document.createElement('div');
      bubble.className = 'clonefy-bubble';
      bubble.innerHTML = `
        <button class="clonefy-bubble-close" aria-label="Fechar">✕</button>
        <p class="clonefy-bubble-text">${this.config.bubble_message || 'Oi! Como posso te ajudar?'}</p>
      `;

      // Close button handler
      bubble.querySelector('.clonefy-bubble-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this.templateContainer.classList.add('hidden');
      });

      // Click to open chat
      bubble.addEventListener('click', () => {
        this.open();
      });

      this.templateContainer.appendChild(bubble);
    },

    createAgentCardTemplate() {
      console.log('CLONEFY: createAgentCardTemplate chamado', {
        config: this.config,
        widget_name: this.config.widget_name,
        avatar_url: this.config.avatar_url,
        show_status_indicator: this.config.show_status_indicator,
        action_buttons: this.config.action_buttons
      });

      const card = document.createElement('div');
      card.className = 'clonefy-agent-card';

      const avatarHtml = this.config.avatar_url
        ? `<img src="${this.config.avatar_url}" alt="${this.config.widget_name}" class="clonefy-agent-card-avatar">`
        : `<div class="clonefy-agent-card-avatar-placeholder">💬</div>`;

      const statusHtml = this.config.show_status_indicator
        ? `<p class="clonefy-agent-card-status">
            <span class="clonefy-status-dot"></span>
            ${this.config.status_text || 'Online agora'}
          </p>`
        : '';

      let buttonsHtml = '';
      if (this.config.action_buttons && this.config.action_buttons.length > 0) {
        buttonsHtml = `
          <div class="clonefy-agent-card-buttons">
            ${this.config.action_buttons.slice(0, 3).map((btn, index) =>
          `<button class="clonefy-agent-card-btn" data-message="${btn.message || ''}" data-index="${index}">
                ${btn.label || 'Botão'}
              </button>`
        ).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="clonefy-agent-card-header">
          ${avatarHtml}
          <div class="clonefy-agent-card-info">
            <p class="clonefy-agent-card-name">${this.config.widget_name || 'Assistente Virtual'}</p>
            ${statusHtml}
          </div>
        </div>
        <div class="clonefy-agent-card-body">
          <p class="clonefy-agent-card-message">${this.config.welcome_message || 'Como posso ajudar você hoje?'}</p>
          <div class="clonefy-agent-card-search">
            <span class="clonefy-agent-card-search-icon">🔍</span>
            <span class="clonefy-agent-card-search-text">Pergunte algo...</span>
          </div>
          ${buttonsHtml}
        </div>
      `;

      console.log('CLONEFY: Card HTML criado:', {
        card_html_length: card.innerHTML.length,
        has_header: card.querySelector('.clonefy-agent-card-header') !== null,
        has_body: card.querySelector('.clonefy-agent-card-body') !== null,
        has_search: card.querySelector('.clonefy-agent-card-search') !== null
      });

      // Search bar click handler
      const searchElement = card.querySelector('.clonefy-agent-card-search');
      if (searchElement) {
        searchElement.addEventListener('click', () => {
          this.open();
        });
      }

      // Action buttons click handlers
      card.querySelectorAll('.clonefy-agent-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const message = e.target.dataset.message;
          if (message) {
            this.pendingMessage = message;
          }
          this.open();
        });
      });

      this.templateContainer.appendChild(card);
      console.log('CLONEFY: Card adicionado ao template container:', {
        template_container_children: this.templateContainer.children.length,
        card_in_dom: document.body.contains(card)
      });
    },

    createQuickQuestionsTemplate() {
      const questionsContainer = document.createElement('div');
      questionsContainer.className = 'clonefy-quick-questions';

      const questions = this.config.quick_questions || [];
      questions.filter(q => q).slice(0, 4).forEach((question, index) => {
        const questionBtn = document.createElement('button');
        questionBtn.className = 'clonefy-quick-question';
        questionBtn.textContent = question;
        questionBtn.dataset.message = question;

        questionBtn.addEventListener('click', () => {
          this.pendingMessage = question;
          this.open();
        });

        questionsContainer.appendChild(questionBtn);
      });

      this.templateContainer.appendChild(questionsContainer);
    },

    createIframe() {
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'clonefy-widget-iframe';
      // Adicionar cache busting para garantir atualizações automáticas
      const cacheBuster = `?v=${Date.now()}`;
      this.iframe.src = `${baseUrl}/embed-chat/${this.assistantId}${cacheBuster}`;
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
          (!this.templateContainer || !this.templateContainer.contains(e.target)) &&
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
          case 'clonefy:ready':
            // Iframe is ready, send pending message if any
            if (this.pendingMessage) {
              this.sendMessageToChat(this.pendingMessage);
              this.pendingMessage = null;
            }
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

    async open() {
      if (!this.iframe) return;

      // Recarregar configuração ao abrir para garantir atualizações automáticas
      await this.loadConfig(true);

      // Recriar template se necessário (pode ter mudado)
      if (this.config.widget_template !== 'classic' && !this.templateContainer) {
        this.createTemplateElements();
      }

      // Atualizar iframe src com cache busting para forçar recarregamento com nova config
      const cacheBuster = `?v=${Date.now()}`;
      this.iframe.src = `${baseUrl}/embed-chat/${this.assistantId}${cacheBuster}`;

      this.isOpen = true;
      this.iframe.classList.add('open');
      this.updateButtonIcon(true);
      this.button.setAttribute('aria-label', 'Fechar chat');

      // Hide template container
      if (this.templateContainer) {
        this.templateContainer.classList.add('hidden');
      }

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

        // Send pending message if any
        if (this.pendingMessage) {
          setTimeout(() => {
            this.sendMessageToChat(this.pendingMessage);
            this.pendingMessage = null;
          }, 500);
        }
      }, 100);
    },

    close() {
      if (!this.iframe) return;

      this.isOpen = false;
      this.iframe.classList.remove('open');
      this.updateButtonIcon(false);
      this.button.setAttribute('aria-label', 'Abrir chat');

      // Show template container
      if (this.templateContainer) {
        this.templateContainer.classList.remove('hidden');
      }
    },

    sendMessageToChat(message) {
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'clonefy:send_message',
          data: {
            message: message
          }
        }, baseUrl);
      }
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
