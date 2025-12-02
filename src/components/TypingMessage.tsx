import { memo } from 'react';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { ExternalLink } from 'lucide-react';

interface TypingMessageProps {
  content: string;
  onTypingComplete?: () => void;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

// Função para detectar e renderizar links como botões
const renderTextWithLinks = (text: string) => {
  // Regex para detectar URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Adiciona texto antes do link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Adiciona o link como botão
    const url = match[0];
    const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
    
    parts.push(
      <a
        key={match.index}
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 mx-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium no-underline"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Acessar link</span>
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Adiciona o texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

const TypingMessage = memo(({ 
  content, 
  onTypingComplete, 
  speed = 5, // Muito mais rápido!
  className = "",
  children 
}: TypingMessageProps) => {
  const { displayedText, isTypingComplete } = useTypingEffect(content, { 
    speed,
    startDelay: 30 // Início quase instantâneo
  });

  // Chamar callback quando terminar de digitar
  if (isTypingComplete && onTypingComplete) {
    onTypingComplete();
  }

  return (
    <div className={className}>
      {children}
      <div className="space-y-3">
        {displayedText.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
          const trimmedParagraph = paragraph.trim();
          
          // Detecta listas numeradas
          if (/^\d+\./.test(trimmedParagraph)) {
            const items = trimmedParagraph.split(/(?=\d+\.)/g).filter(item => item.trim());
            return (
              <ol key={index} className="list-decimal list-inside space-y-1 ml-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm leading-relaxed">
                    {item.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            );
          }
          
          // Detecta listas com bullets
          if (/^[-•*]/.test(trimmedParagraph)) {
            const items = trimmedParagraph.split(/(?=[-•*])/g).filter(item => item.trim());
            return (
              <ul key={index} className="list-disc list-inside space-y-1 ml-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm leading-relaxed">
                    {item.replace(/^[-•*]\s*/, '')}
                  </li>
                ))}
              </ul>
            );
          }
          
          // Detecta títulos/cabeçalhos
          if (trimmedParagraph.endsWith(':') && trimmedParagraph.length < 100) {
            return (
              <h4 key={index} className="font-semibold text-sm mb-1 text-foreground">
                {trimmedParagraph}
              </h4>
            );
          }
          
          // Parágrafos normais
          const lines = trimmedParagraph.split('\n').filter(line => line.trim());
          return (
            <div key={index} className="space-y-1">
              {lines.map((line, lineIndex) => (
                <p key={lineIndex} className="text-sm leading-relaxed break-words">
                  {renderTextWithLinks(line.trim())}
                </p>
              ))}
            </div>
          );
        })}
        
        {/* Cursor piscando durante a digitação */}
        {!isTypingComplete && (
          <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
});

TypingMessage.displayName = 'TypingMessage';

export default TypingMessage;