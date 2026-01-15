export default {
  // Header
  header: {
    login: "Iniciar Sesión",
    startFree: "Comenzar Gratis"
  },

  // Footer
  footer: {
    copyright: "© 2024 CLONEFY. Todos los derechos reservados."
  },

  // Auth Pages
  auth: {
    title: "CLONEFY",
    subtitle: "Plataforma de Clones de IA para WhatsApp",
    signin: "Iniciar Sesión",
    signup: "Registrarse",
    email: "Email",
    password: "Contraseña",
    fullName: "Nombre Completo",
    emailPlaceholder: "tu@email.com",
    passwordPlaceholder: "••••••••",
    fullNamePlaceholder: "Tu Nombre",
    signInButton: "Entrar",
    signUpButton: "Crear Cuenta",
    signingIn: "Entrando...",
    signingUp: "Creando cuenta...",
    accountCreated: "¡Cuenta creada con éxito!",
    checkEmail: "Revisa tu correo para confirmar tu cuenta.",
    signInError: "Error al iniciar sesión",
    signUpError: "Error al crear cuenta",
    signOutError: "Error al cerrar sesión"
  },

  // Hero Section
  hero: {
    badge: "🚀 Conoce la Inteligencia Artificial que vende por ti 24 horas al día",
    title: "Clona tu mejor",
    roles: {
      vendedor: "vendedor",
      sdr: "SDR",
      atendente: "agente",
      funcionario: "empleado"
    },
    titleEnd: "con IA!",
    subtitle: "Ten Agentes IA entrenados para tu empresa, atendiendo en WhatsApp, 24 horas al día.",
    subtitleBold: "¡100% automática y humanizada!",
    createAssistant: "Crear Mi Primer Clon de IA",
    watchDemo: "Ver Demostración",
    description1: "Enseña a tu Clon a Seguir tu Script de Ventas o tu Servicio y Automatiza 100% tu WhatsApp",
    description2: "Tu Empleado Disponible 24 horas al día, sin descanso y pagando el 10% de un salario."
  },

  // Features Section
  features: {
    title: "Funcionalidades Poderosas",
    subtitle: "Todo lo que necesitas para automatizar y escalar tu servicio al cliente",
    salesAgent: {
      title: "Agente de Ventas",
      description: "¡SDR, Closer, Vendedor profesional! Enseña a tu Clon a vender tu Producto/Servicio y crea un vendedor profesional que se ajusta y mejora con cada conversación, enviando enlaces personalizados, videos y mucho más."
    },
    scheduling: {
      title: "Programación",
      description: "Crea una secretar.IA y deja que se encargue de tu agenda y gestione el servicio de tus clientes de manera inteligente y personalizada."
    },
    multiService: {
      title: "Multi-Servicio",
      description: "Tu Clon tendrá un historial de conversación, atendiendo de forma personalizada a cada cliente, recordando a todos y creando un servicio 100% personalizado."
    },
    support: {
      title: "Soporte y Servicio",
      description: "Usa tu clon para automatizar tu soporte y servicio al cliente, incluye toda la información sobre tu negocio y déjalo disponible para ayudar a tus clientes."
    },
    naturalConversations: {
      title: "Conversaciones Naturales",
      description: "Tu Inteligencia Artificial conversa de forma natural y humanizada siempre con mucha simpatía y profesionalismo."
    },
    fastService: {
      title: "Servicio Rápido",
      description: "¡Tus clientes y Leads respondidos rápidamente en cualquier momento! Toma el control y supervisa todo lo que dice la IA."
    }
  },

  // Assistants Section
  assistants: {
    used: "agentes creados",
    createNew: "Crear Nuevo Agente",
    editAgent: "Editar Agente",
    editInstructions: "Editar Instrucciones",
    createDialog: {
      createTitle: "Crear Nuevo Agente",
      editTitle: "Editar Agente",
      createDescription: "Configura tu agente de IA personalizado",
      editDescription: "Modifica las configuraciones de tu agente y gestiona archivos"
    },
    instructionsDialog: {
      title: "Editar Instrucciones",
      description: "Usa este espacio más grande para escribir instrucciones detalladas para tu agente",
      label: "Instrucciones Completas",
      placeholder: "Describe en detalle cómo debe comportarse el agente, su tono de voz, conocimientos específicos, ejemplos de respuesta...",
      expandButton: "Expandir",
      saveButton: "Guardar Instrucciones"
    },
    form: {
      name: "Nombre del Agente",
      namePlaceholder: "Ej: Vendedor Virtual",
      description: "Descripción",
      descriptionPlaceholder: "Descripción breve del agente",
      instructions: "Instrucciones",
      instructionsPlaceholder: "Instrucciones detalladas para el agente..."
    },
    tabs: {
      myAgents: "Mis Agentes",
      templates: "Plantillas"
    },
    actions: {
      test: "Probar",
      edit: "Editar",
      delete: "Eliminar",
      create: "Crear Agente"
    },
    files: {
      title: "Archivos del Agente",
      description: "Añade imágenes, videos y documentos que la IA podrá enviar automáticamente en las conversaciones de WhatsApp."
    },
    errors: {
      loadTitle: "Error al cargar agentes",
      loadGeneric: "Ocurrió un error inesperado al cargar los agentes. Intenta recargar la página.",
      apiTitle: "Error en la API de OpenAI",
      apiMessage: "Hubo un problema al conectar con OpenAI. Intenta nuevamente en algunos instantes.",
      duplicateName: "Ya existe un agente con este nombre. Por favor, elija un nombre diferente.",
      networkTitle: "Error de conexión",
      networkMessage: "Problema de conectividad. Verifica tu conexión a internet.",
      authTitle: "Error de autenticación",
      authMessage: "Tu sesión expiró. Por favor, inicia sesión nuevamente.",
      quotaTitle: "Límite alcanzado",
      quotaMessage: "Has alcanzado el límite de agentes. Contacta al soporte para más información."
    },
    success: {
      created: "Agente creado exitosamente",
      updated: "Agente actualizado exitosamente",
      deleted: "Agente eliminado exitosamente"
    }
  },

  // Dashboard
  dashboard: {
    title: "Panel de Control",
    welcome: "Bienvenido de vuelta",
    loading: "Cargando...",
    signOut: "Cerrar Sesión",
    stats: {
      agents: "Agentes",
      agentsDesc: "Total de agentes creados",
      connections: "Conexiones WhatsApp",
      connectionsDesc: "Instancias conectadas"
    },
    quickActions: {
      createAgent: {
        title: "Crear Agente",
        description: "Configura un nuevo agente de IA personalizado",
        button: "Nuevo Agente"
      },
      connectWhatsApp: {
        title: "Conectar WhatsApp",
        description: "Añade una nueva conexión de WhatsApp vía código QR",
        button: "Nueva Conexión"
      },
      startChat: {
        title: "Iniciar Chat",
        description: "Prueba tus clones de IA en una conversación",
        button: "Chat de Prueba"
      }
    }
  },

  // Sidebar
  sidebar: {
    mainMenu: "Menú Principal",
    dashboard: {
      title: "Panel",
      description: "Vista general del sistema"
    },
    agents: {
      title: "Clones de IA",
      description: "Tus Agentes"
    },
    whatsapp: {
      title: "WhatsApp",
      description: "Conexiones"
    },
    conversations: {
      title: "Conversaciones",
      description: "Chats activos"
    },
    admin: {
      title: "Admin",
      description: "Admin"
    },
    signOut: "Cerrar Sesión"
  },

  // Navigation
  nav: {
    dashboard: "Panel",
    assistants: "Clones de IA",
    conversations: "Conversaciones",
    whatsapp: "WhatsApp",
    settings: "Configuración",
    logout: "Cerrar Sesión"
  },

  // Common
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    create: "Crear",
    back: "Atrás",
    next: "Siguiente",
    previous: "Anterior",
    loading: "Cargando...",
    reload: "Recargar",
    error: "Error",
    success: "Éxito",
    confirm: "Confirmar",
    close: "Cerrar"
  },

  // Admin Panel
  admin: {
    title: "Panel de Administración",
    totalAgents: "Total Agentes",
    editLimits: "Editar Límites",
    edit: "Editar",
    agents: "Agentes",
    whatsappConnections: "Conexiones WhatsApp"
  },

  // WhatsApp
  whatsapp: {
    connect: "Conectar WhatsApp",
    scanCode: "Escanea este código QR con tu WhatsApp para conectar",
    howToConnect: "Cómo conectar:",
    steps: {
      step1: "1. Abre WhatsApp en tu teléfono",
      step2: "2. Toca los tres puntos (⋮) y selecciona \"Dispositivos vinculados\"",
      step3: "3. Toca en \"Vincular un dispositivo\"",
      step4: "4. Apunta la cámara hacia este código QR"
    },
    qrExpired: "Código QR expirado",
    qrExpiredDesc: "Genera un nuevo código QR para conectar.",
    qrGenerated: "Código QR generado",
    qrGeneratedDesc: "Escanea el código para conectar WhatsApp. Expira en 45 segundos.",
    qrAvailable: "Código QR disponible"
  },

  // Conversations
  conversations: {
    title: "Conversaciones",
    loadingAgents: "Cargando agentes...",
    noAgents: "Ningún agente encontrado",
    selectConversation: "Elige una conversación existente o inicia una nueva con tus agentes"
  },

  // Widget Customization
  widgetCustomization: {
    title: "Personalización del Widget",
    subtitle: "Personaliza la apariencia y comportamiento de tu chat flotante",
    selectAssistant: "Seleccionar Asistente",
    selectAssistantPlaceholder: "Elige un asistente para personalizar",
    appearance: "Apariencia",
    behavior: "Comportamiento",
    basicInfo: {
      title: "Información Básica",
      assistantName: "Nombre del Asistente",
      assistantNamePlaceholder: "Ej: Asistente Virtual",
      welcomeMessage: "Mensaje de Bienvenida",
      welcomeMessagePlaceholder: "Ej: ¡Hola! ¿Cómo puedo ayudarte hoy?"
    },
    images: {
      title: "Imágenes",
      avatar: "Avatar del Asistente",
      avatarDescription: "Imagen que aparecerá en el chat",
      buttonIcon: "Icono del Botón",
      buttonIconDescription: "Icono personalizado para el botón flotante"
    },
    colors: {
      title: "Colores",
      primaryColor: "Color Primario",
      secondaryColor: "Color Secundario",
      textColor: "Color del Texto"
    },
    position: {
      title: "Posición",
      buttonPosition: "Posición del Botón",
      left: "Izquierda",
      right: "Derecha"
    },
    status: {
      title: "Estado",
      active: "Activo",
      inactive: "Inactivo"
    },
    actions: {
      save: "Guardar Personalización",
      saving: "Guardando...",
      testChat: "Probar Chat",
      analytics: "Analytics"
    },
    preview: {
      title: "Vista Previa del Widget",
      description: "Ve cómo aparecerá tu widget en el sitio"
    }
  },

  // Widget Analytics
  widgetAnalytics: {
    title: "Analytics del Widget",
    subtitle: "Rastrea el rendimiento de tu widget de chat",
    backToDashboard: "Volver al Panel",
    selectAssistant: "Asistente",
    selectAssistantPlaceholder: "Selecciona un asistente",
    period: "Período",
    generateSampleData: "Generar Datos de Ejemplo",
    generatingData: "Generando datos...",
    noAssistantSelected: "Selecciona un asistente",
    noAssistantSelectedDescription: "Elige un asistente para ver las métricas de rendimiento del widget"
  },

  // Lead Capture
  leadCapture: {
    title: "Calificación de Lead",
    subtitle: "Completa los datos para continuar",
    form: {
      name: "Nombre Completo",
      namePlaceholder: "Tu nombre completo",
      email: "Email",
      emailPlaceholder: "tu@email.com",
      phone: "Teléfono",
      phonePlaceholder: "(555) 123-4567",
      company: "Empresa",
      companyPlaceholder: "Nombre de tu empresa",
      businessType: "Tipo de Negocio",
      businessTypePlaceholder: "Selecciona el tipo",
      employees: "Número de Empleados",
      employeesPlaceholder: "¿Cuántos empleados?",
      monthlyRevenue: "Ingresos Mensuales",
      monthlyRevenuePlaceholder: "Ingresos aproximados",
      submit: "Continuar"
    },
    businessTypes: {
      ecommerce: "E-commerce",
      services: "Servicios",
      consulting: "Consultoría",
      technology: "Tecnología",
      retail: "Retail",
      other: "Otro"
    },
    employeeRanges: {
      "1-5": "1-5 empleados",
      "6-20": "6-20 empleados",
      "21-50": "21-50 empleados",
      "51-200": "51-200 empleados",
      "200+": "Más de 200 empleados"
    },
    revenueRanges: {
      "0-10k": "Hasta €10.000",
      "10k-50k": "€10.000 - €50.000",
      "50k-100k": "€50.000 - €100.000",
      "100k-500k": "€100.000 - €500.000",
      "500k+": "Por encima de €500.000"
    },
    qualified: {
      title: "¡Felicidades! ¡Te calificaste!",
      description: "Basado en tus respuestas, eres un candidato ideal para nuestra solución.",
      benefits: [
        "Servicio 24/7 automatizado",
        "Aumento de conversiones",
        "Reducción de costos operativos",
        "Escalabilidad ilimitada"
      ],
      cta: "Comenzar Ahora por €17/mes"
    },
    notQualified: {
      title: "¡Ups! Aún no te has calificado",
      description: "Nuestra solución es ideal para empresas con al menos 2 empleados.",
      suggestion: "¿Qué tal crecer un poco más y volver aquí?",
      cta: "Volver al Inicio"
    }
  },

  // Pricing Section
  pricing: {
    title: "Planes y Precios",
    subtitle: "Elige el mejor plan para tu negocio",
    currency: "$",
    finalMessage: "¡Comienza ahora y transforma tu servicio al cliente con IA!",
    finalMessageHighlight: "Sin compromiso, cancela cuando quieras.",
    plans: {
      basic: {
        title: "Básico",
        price: "97",
        period: "por mes",
        features: [
          "1 Clon de IA",
          "1.000 mensajes/mes",
          "Soporte por email",
          "Integración WhatsApp"
        ],
        button: "Comenzar Ahora"
      },
      professional: {
        title: "Profesional",
        price: "197",
        period: "por mes",
        recommended: "Recomendado",
        features: [
          "3 Clones de IA",
          "5.000 mensajes/mes",
          "Soporte prioritario",
          "Integración WhatsApp",
          "Widget para sitio web",
          "Programación inteligente"
        ],
        button: "Comenzar Ahora"
      },
      enterprise: {
        title: "Empresarial",
        price: "497",
        period: "por mes",
        installment: "o 12x de $49,70",
        features: [
          "Clones ilimitados",
          "20.000 mensajes/mes",
          "Soporte VIP 24/7",
          "Todas las integraciones",
          "Widget personalizado",
          "Programación ilimitada",
          "Informes avanzados"
        ],
        button: "Comenzar Ahora"
      }
    }
  },

  // Demo Section
  demo: {
    title: "Qué Simple es Usar CLONEFY",
    subtitle: "Ve en la práctica cómo crear y configurar tus agentes de IA en pocos clics",
    steps: {
      step1: {
        title: "Crear Tu Agente",
        description: "¡Haz clic en \"Nuevo Agente\" y listo! Una interfaz simple e intuitiva para comenzar a configurar tu asistente virtual.",
        features: [
          "Interfaz limpia y fácil de usar",
          "Proceso guiado paso a paso",
          "Configuración en minutos"
        ]
      },
      step2: {
        title: "Personalizar Completamente",
        description: "Define el nombre, descripción e instrucciones detalladas. Enseña a tu agente a ser exactamente lo que necesitas - un vendedor, atendente, secretaria o cualquier función!",
        features: [
          "Personaliza nombre y función",
          "Configura instrucciones específicas",
          "Añade archivos y conocimiento"
        ]
      },
      step3: {
        title: "Gestionar Tus Agentes",
        description: "Visualiza todos tus agentes creados, edita cuando sea necesario, prueba las conversaciones y monitorea el rendimiento.",
        features: [
          "Panel organizado y claro",
          "Botones de acción rápida",
          "Prueba antes de poner en marcha"
        ]
      },
      step4: {
        title: "Conectar a WhatsApp",
        description: "¡Conecta tus agentes a WhatsApp en segundos! Solo escanea el código QR y tu agente estará listo para atender a tus clientes 24/7.",
        features: [
          "Conexión por código QR",
          "Múltiples instancias de WhatsApp",
          "Servicio automático 24/7"
        ]
      },
      step5: {
        title: "Incorporar en Tu Sitio",
        description: "ADEMÁS de WhatsApp, puedes añadir un chat flotante a tu sitio! Copia y pega el código y listo - tus visitantes podrán hablar con tu agente directamente.",
        features: [
          "Código listo para copiar",
          "Widget responsivo",
          "Integración en cualquier sitio",
          "+ WhatsApp siempre activo"
        ]
      },
      result: {
        title: "¡Agente Funcionando Perfectamente!",
        description: "¡Ve tu agente en acción! Conversaciones naturales, respuestas inteligentes y servicio profesional 24 horas al día, todos los días.",
        features: [
          "Conversaciones naturales y fluidas",
          "Respuestas contextualizadas",
          "Disponible 24/7 sin pausas"
        ]
      }
    },
    final: {
      title: "¡Es Así de Simple!",
      description: "En menos de 10 minutos puedes tener tu propio agente de IA funcionando. Sin programación, sin complicaciones.",
      cta: "Ver Precios Ahora"
    }
  },

  // Video Section
  video: {
    title: "Ve Cómo Funciona Por Dentro",
    subtitle: "Demostración completa de la plataforma y cómo crear tu asistente inteligente"
  }
};