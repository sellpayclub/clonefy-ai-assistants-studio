import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={`Current language: ${currentLanguage?.name}`}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline" role="img" aria-label={currentLanguage?.name}>
            {currentLanguage?.flag}
          </span>
          <span className="hidden md:inline font-medium">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border z-50 shadow-md">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
              language === lang.code ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            <span className="text-lg" role="img" aria-label={lang.name}>{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === lang.code && (
              <div className="ml-auto h-2 w-2 rounded-full bg-primary" aria-label="Selected" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};