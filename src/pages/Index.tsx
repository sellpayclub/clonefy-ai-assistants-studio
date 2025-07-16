import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight, Clock, Users, TrendingUp, Shield, Zap, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const Index = () => {
  const { t } = useLanguage();
  const [currentRole, setCurrentRole] = useState(0);
  const roles = [
    t('hero.roles.vendedor'),
    t('hero.roles.sdr'),
    t('hero.roles.atendente'),
    t('hero.roles.funcionario')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [roles.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/a49c53ef-ee9d-47be-8b56-db4d0c8768ed.png" 
            alt="CLONEFY Logo" 
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <Link to="/auth">
            <Button variant="outline">{t('header.login')}</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              {t('header.startFree')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              {t('hero.badge')}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block min-w-[200px] transition-all duration-500">
              {roles[currentRole]}
            </span>
            <br />
            {t('hero.titleEnd')}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
            <br />
            <strong className="text-foreground">{t('hero.subtitleBold')}</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 py-6 text-lg">
                {t('hero.createAssistant')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg">
              {t('hero.watchDemo')}
            </Button>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-4">
              {t('hero.description1')}
            </p>
            <p className="text-2xl font-bold text-primary">
              {t('hero.description2')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.salesAgent.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.salesAgent.description')}
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.scheduling.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.scheduling.description')}
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.multiService.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.multiService.description')}
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <HeadphonesIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.support.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.support.description')}
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.naturalConversations.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.naturalConversations.description')}
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t('features.fastService.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('features.fastService.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Funcionário Tradicional */}
          <div className="p-8 rounded-2xl border bg-card/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">{t('pricing.traditional.title')}</h3>
              <div className="text-4xl font-bold text-muted-foreground">{t('pricing.currency')}{t('pricing.traditional.price')}</div>
              <p className="text-muted-foreground">{t('pricing.traditional.period')}</p>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                {t('pricing.traditional.features.0')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                {t('pricing.traditional.features.1')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                {t('pricing.traditional.features.2')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                {t('pricing.traditional.features.3')}
              </li>
            </ul>
          </div>

          {/* CLONEFY */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {t('pricing.clonefy.recommended')}
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{t('pricing.clonefy.title')}</h3>
              <div className="text-4xl font-bold text-primary">{t('pricing.currency')}{t('pricing.clonefy.price')}</div>
              <p className="text-muted-foreground">{t('pricing.clonefy.period')}</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                {t('pricing.clonefy.features.0')}
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                {t('pricing.clonefy.features.1')}
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                {t('pricing.clonefy.features.2')}
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                {t('pricing.clonefy.features.3')}
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-bold mb-8">
            {t('pricing.finalMessage')} <span className="text-primary">{t('pricing.finalMessageHighlight')}</span>
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-12 py-6 text-lg">
              {t('pricing.startNow')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/a49c53ef-ee9d-47be-8b56-db4d0c8768ed.png" 
              alt="CLONEFY Logo" 
              className="h-6 w-auto"
            />
          </div>
          <p className="text-center text-muted-foreground mt-4">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
