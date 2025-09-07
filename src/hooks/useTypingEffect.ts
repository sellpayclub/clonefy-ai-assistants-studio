import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  speed?: number; // caracteres por segundo
  startDelay?: number; // delay antes de começar
}

export const useTypingEffect = (
  text: string, 
  options: UseTypingEffectOptions = {}
) => {
  const { speed = 50, startDelay = 100 } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset quando o texto muda
    setDisplayedText('');
    setIsTypingComplete(false);
    indexRef.current = 0;

    if (!text) return;

    const typeText = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        
        // Velocidade variável - mais lento em pontuação
        const currentChar = text[indexRef.current - 1];
        const isSlowChar = ['.', '!', '?', ',', ';', ':'].includes(currentChar);
        const delay = isSlowChar ? speed * 3 : speed;
        
        timeoutRef.current = setTimeout(typeText, delay);
      } else {
        setIsTypingComplete(true);
      }
    };

    // Delay inicial antes de começar a digitar
    timeoutRef.current = setTimeout(typeText, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay]);

  // Função para pular a animação
  const skipTyping = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayedText(text);
    setIsTypingComplete(true);
  };

  return {
    displayedText,
    isTypingComplete,
    skipTyping
  };
};