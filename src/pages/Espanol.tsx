import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight, Clock, Users, TrendingUp, Shield, Zap, HeadphonesIcon, Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import ChatWidget from "@/components/ChatWidget";
import { useTheme } from "@/components/ThemeProvider";

const Espanol = () => {
  const { setTheme } = useTheme();
  const [currentRole, setCurrentRole] = useState(0);
  const roles = [
    'Vendedor',
    'SDR',
    'Asistente',
    'Empleado'
  ];

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Força modo claro na página de vendas
    setTheme("light");
    
    // Facebook Pixel
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      fbq('init', '768462872382350');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [roles.length, setTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-16 w-auto sm:h-16 lg:h-20 xl:h-24"
              loading="eager"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-sm lg:text-base">
                Iniciar Sesión
              </Button>
            </Link>
            <a href="https://sellpay.thrivecart.com/clonefy-app/" target="_blank" rel="noopener noreferrer">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm lg:text-base px-3 sm:px-4 lg:px-6"
              >
                <span className="hidden sm:inline">Comenzar Gratis</span>
                <span className="sm:hidden">Comenzar</span>
              </Button>
            </a>
          </div>
        </div>
        {/* Mobile Language Selector */}
        <div className="md:hidden mt-4 flex justify-center">
          <LanguageSelector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              ¡Revoluciona tu atención al cliente!
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            Clona tu mejor{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block min-w-[140px] sm:min-w-[200px] lg:min-w-[300px] transition-all duration-500">
              {roles[currentRole]}
            </span>
            <br />
            con Inteligencia Artificial
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed">
            Crea agentes de IA para WhatsApp que trabajan 24/7 atendiendo a tus clientes.
            <br />
            <strong className="text-foreground">Sin programación, sin complicaciones.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 sm:mb-12 max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              onClick={scrollToPricing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 py-4 text-lg font-semibold"
            >
              <span className="sm:hidden">Ver Precios</span>
              <span className="hidden sm:inline">Ver Precios</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="bg-card/60 backdrop-blur-sm border rounded-2xl p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4">
              Conecta CLONEFY con tu WhatsApp y comienza a automatizar tu atención al cliente HOY MISMO.
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              ¡Todo funciona en piloto automático!
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Qué Tan Fácil es Usar CLONEFY</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg sm:text-xl">
            Mira en la práctica cómo crear y configurar tus agentes de IA en pocos clics
          </p>
        </div>
        
        <div className="space-y-20 sm:space-y-24">
          {/* Paso 1: Crear Agente - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Paso 1
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Crear Tu Agente</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Haz clic en "Nuevo Agente" y ¡listo! Una interfaz simple e intuitiva 
                para comenzar a configurar tu asistente virtual.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Interfaz limpia y fácil de usar</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Proceso guiado paso a paso</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Configuración en minutos</span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/78405cc7-ac71-4962-a65b-41f013b48492.png"
                alt="Crear Agente - Interfaz simple para comenzar"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Paso 2: Configurar - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/840c4611-5645-4a58-98c5-fea65bbb08fc.png"
                alt="Configurar Agente - Personalización completa"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Paso 2
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Personalizar Completamente</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Define el nombre, descripción e instrucciones detalladas. Enseña a tu agente 
                a ser exactamente como necesitas - ¡un vendedor, asistente, secretaria o cualquier función!
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Personaliza el nombre y función</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Configura instrucciones específicas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Agrega archivos y conocimiento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Paso 3: Gerenciar - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Paso 3
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Gestionar Tus Agentes</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Visualiza todos tus agentes creados, edita cuando sea necesario, 
                prueba las conversaciones y monitorea el rendimiento.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Dashboard organizado y claro</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Botones de acción rápida</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Prueba antes de poner en funcionamiento</span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/18248d32-3b27-4c30-b5b7-0fdcc905ae7b.png"
                alt="Lista de Agentes - Gestión fácil"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Paso 4: Conectar WhatsApp - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/6997528e-0637-4e0e-b1c5-189e6c76f917.png"
                alt="Conectar WhatsApp - Integración simple"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Paso 4
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Conectar a WhatsApp</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                ¡Conecta tus agentes a WhatsApp en segundos! Solo escanea el código QR 
                y tu agente estará listo para atender a tus clientes 24/7.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Conexión por código QR</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Múltiples instancias de WhatsApp</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Atención automática 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Paso 5: Chat Flutuante + WhatsApp - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Paso 5 - EXTRA
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-8 w-8 text-primary" />
                  Incorporar en Tu Sitio Web
                </span>
                <span className="text-green-500 text-xl font-medium">+ WhatsApp</span>
              </h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                <strong className="text-green-600">ADEMÁS de WhatsApp</strong>, ¡puedes agregar un chat flotante en tu sitio web! 
                Copia y pega el código y listo - tus visitantes podrán hablar con tu agente directamente.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Código listo para copiar</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Widget responsivo</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Integración en cualquier sitio</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg text-green-700">
                    <strong>+ WhatsApp siempre activo</strong>
                  </span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/1c3acef0-0f93-4eef-b3a5-2cb3614deb57.png"
                alt="Chat Flotante - Widget para sitio web"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Resultado Final - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/a9dc3a05-1c17-4478-9cc9-51f472d73ed6.png"
                alt="Conversación Real - Agente funcionando"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                ✅ Resultado
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">¡Agente Funcionando Perfectamente!</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                ¡Mira tu agente en acción! Conversaciones naturales, respuestas inteligentes 
                y atención profesional las 24 horas del día, todos los días.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Conversaciones naturales y fluidas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Respuestas contextualizadas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Disponible 24/7 sin pausas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-20 sm:mt-24">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 sm:p-10 lg:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">¡Así de Simple!</h3>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
              En menos de 10 minutos puedes tener tu propio agente de IA funcionando. 
              Sin programación, sin complicaciones.
            </p>
            <Button 
              size="lg" 
              onClick={scrollToPricing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold"
            >
              <span className="sm:hidden">Ver Precios</span>
              <span className="hidden sm:inline">Ver Precios Ahora</span>
              <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-2">¿Qué Puede Hacer Tu Agente?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-2">
            Descubre todas las funcionalidades poderosas que CLONEFY ofrece para automatizar tu negocio
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Agente de Ventas</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Convierte visitantes en clientes con conversaciones inteligentes y persuasivas 24/7
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Agendamiento</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Agenda citas y reuniones automáticamente, sincronizando con tu calendario preferido
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Multi-Servicio</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Un agente puede manejar múltiples funciones: ventas, soporte, información y más
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <HeadphonesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Soporte 24/7</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Resuelve dudas y problemas de clientes en cualquier momento, sin descanso
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Conversaciones Naturales</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Interacciones fluidas y naturales que hacen sentir a los clientes como si hablaran con una persona real
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Respuestas Instantáneas</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Respuestas inmediatas y precisas que mantienen a los clientes comprometidos
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-2">Precios que Te Sorprenderán</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-2">
            Compara el costo de un empleado tradicional vs CLONEFY y descubre el ahorro increíble
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Funcionário Tradicional */}
          <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/30">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-muted-foreground mb-2">Empleado Tradicional</h3>
              <div className="text-3xl sm:text-4xl font-bold text-muted-foreground">$2.500+</div>
              <p className="text-muted-foreground text-sm sm:text-base">por mes</p>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                Salario + beneficios + impuestos
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                Solo trabaja 8 horas por día
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                Vacaciones, licencias, faltas
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                Puede tener mal humor o cansancio
              </li>
            </ul>
          </div>

          {/* CLONEFY */}
          <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Recomendado
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">CLONEFY</h3>
              <div className="text-3xl sm:text-4xl font-bold text-primary">$97</div>
              <p className="text-muted-foreground text-sm sm:text-base">por mes</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                Trabaja 24 horas, 7 días a la semana
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                Nunca se enferma, nunca falta
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                Siempre tiene la mejor actitud
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                Múltiples agentes incluidos
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-6 sm:mb-8 px-2">
            ¡Ahorras más de <span className="text-primary">$2.400 por mes!</span>
          </p>
          <a href="https://sellpay.thrivecart.com/clonefy-app/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg">
              Comenzar Ahora Mismo
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-14 sm:h-10 lg:h-12 w-auto"
              loading="lazy"
            />
          </div>
          <p className="text-center text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base px-2">
            © 2024 CLONEFY. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Espanol;