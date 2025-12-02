import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  speed?: number; // caracteres por segundo
  startDelay?: number; // delay antes de começar
}

export const useTypingEffect = (
  text: string, 
  options: UseTypingEffectOptions = {}
) => {
  const { speed = 8, startDelay = 50 } = options; // Muito mais rápido!
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

    // Para mensagens muito longas, mostrar mais caracteres por vez
    const charsPerTick = text.length > 200 ? 3 : text.length > 100 ? 2 : 1;

    const typeText = () => {
      if (indexRef.current < text.length) {
        // Avançar múltiplos caracteres para mensagens longas
        indexRef.current = Math.min(indexRef.current + charsPerTick, text.length);
        setDisplayedText(text.slice(0, indexRef.current));
        
        // Pequena pausa em pontuação de fim de frase
        const currentChar = text[indexRef.current - 1];
        const isPause = ['.', '!', '?'].includes(currentChar);
        const delay = isPause ? speed * 2 : speed;
        
        timeoutRef.current = setTimeout(typeText, delay);
      } else {
        setIsTypingComplete(true);
      }
    };

    // Delay inicial mínimo
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