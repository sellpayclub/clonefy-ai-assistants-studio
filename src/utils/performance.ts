// Utilitários de performance para otimização geral

// Debounce otimizado
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle otimizado
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Preload de imagens críticas
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Cache em memória simples mas eficiente
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxAge: number;

  constructor(maxAge = 5 * 60 * 1000) { // 5 minutos default
    this.maxAge = maxAge;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const performanceCache = new SimpleCache();

// Otimização de scroll
export function optimizeScroll(element: HTMLElement, callback: () => void) {
  let isScrolling = false;
  
  const scrollHandler = () => {
    if (!isScrolling) {
      requestAnimationFrame(() => {
        callback();
        isScrolling = false;
      });
      isScrolling = true;
    }
  };

  element.addEventListener('scroll', scrollHandler, { passive: true });
  
  return () => element.removeEventListener('scroll', scrollHandler);
}

// Detecta se o device é mobile para otimizações específicas
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detecta conexão lenta
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  }
  return false;
};