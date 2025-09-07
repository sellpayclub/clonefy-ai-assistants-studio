import { memo } from 'react';
import { useTypingEffect } from '@/hooks/useTypingEffect';

interface TypingMessageProps {
  content: string;
  onTypingComplete?: () => void;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

const TypingMessage = memo(({ 
  content, 
  onTypingComplete, 
  speed = 30,
  className = "",
  children 
}: TypingMessageProps) => {
  const { displayedText, isTypingComplete } = useTypingEffect(content, { 
    speed,
    startDelay: 200 
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
                  {line.trim()}
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