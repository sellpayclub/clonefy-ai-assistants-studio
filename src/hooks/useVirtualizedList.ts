import { useState, useEffect, useMemo } from 'react';

interface UseVirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const itemCount = items.length;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, itemCount);
    const adjustedStartIndex = Math.max(0, startIndex - overscan);

    return {
      items: items.slice(adjustedStartIndex, endIndex),
      startIndex: adjustedStartIndex,
      endIndex,
      totalHeight: itemCount * itemHeight,
      offsetY: adjustedStartIndex * itemHeight,
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    handleScroll,
    virtualizedProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
  };
}