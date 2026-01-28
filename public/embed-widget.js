// CLONEFY Chat Widget
(function() {
  'use strict';
  
  // Get agent ID from script src
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var agentId = new URLSearchParams(currentScript.src.split('?')[1] || '').get('agent');
  
  if (!agentId) {
    console.error('CLONEFY Widget: Agent ID not found');
    return;
  }
  
  var chatWidget = {
    agentId: agentId,
    isOpen: false,
    iframe: null,
    button: null,
    
    init: function() {
      this.createStyles();
      this.createButton();
      this.createIframe();
      this.attachEvents();
    },
    
    createStyles: function() {
      var style = document.createElement('style');
      style.textContent = `
        .clonefy-widget-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
          z-index: 999998;
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .clonefy-widget-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(0, 123, 255, 0.4);
        }
        
        .clonefy-widget-button.open {
          transform: rotate(180deg);
        }
        
        .clonefy-widget-iframe {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 420px;
          height: 650px;
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
          z-index: 999999;
          display: none;
          background: white;
        }
        
        @media (max-width: 480px) {
          .clonefy-widget-iframe {
            width: calc(100vw - 20px);
            height: calc(100vh - 110px);
            bottom: 80px;
            right: 10px;
            left: 10px;
            border-radius: 8px;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .clonefy-widget-iframe {
            width: 380px;
            height: 600px;
            right: 15px;
            bottom: 85px;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .clonefy-widget-iframe {
            width: 400px;
            height: 650px;
          }
        }
      `;
      document.head.appendChild(style);
    },
    
    createButton: function() {
      this.button = document.createElement('button');
      this.button.className = 'clonefy-widget-button';
      this.button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      this.button.title = 'Chat de Suporte';
      document.body.appendChild(this.button);
    },
    
    createIframe: function() {
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'clonefy-widget-iframe';
      this.iframe.src = 'https://clonefy-ai-assistants-studio.lovable.app/embed/chat/' + this.agentId;
      this.iframe.frameBorder = '0';
      // Pré-carrega o iframe mas mantém escondido
      this.iframe.style.display = 'none';
      this.iframe.style.opacity = '0';
      this.iframe.style.transition = 'opacity 0.2s ease-out';
      document.body.appendChild(this.iframe);
    },
    
    attachEvents: function() {
      var self = this;
      
      this.button.addEventListener('click', function() {
        self.toggle();
      });
      
      // Close widget when clicking outside
      document.addEventListener('click', function(e) {
        if (self.isOpen && !self.iframe.contains(e.target) && !self.button.contains(e.target)) {
          // Only close if clicked outside the widget area
          var rect = self.iframe.getBoundingClientRect();
          if (e.clientX < rect.left || e.clientX > rect.right || 
              e.clientY < rect.top || e.clientY > rect.bottom) {
            // Don't auto-close for now, let user close manually
            // self.close();
          }
        }
      });
      
      // Handle escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });
    },
    
    toggle: function() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open: function() {
      this.isOpen = true;
      this.iframe.style.display = 'block';
      this.button.classList.add('open');
      
      // Abertura instantânea com animação suave
      setTimeout(() => {
        this.iframe.style.opacity = '1';
        this.iframe.focus();
      }, 10);
    },
    
    close: function() {
      this.isOpen = false;
      this.iframe.style.opacity = '0';
      this.button.classList.remove('open');
      
      // Esconde o iframe após a transição
      setTimeout(() => {
        this.iframe.style.display = 'none';
      }, 200);
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      chatWidget.init();
    });
  } else {
    chatWidget.init();
  }
  
  // Expose widget globally for potential customization
  window.ClonefyWidget = chatWidget;
})();