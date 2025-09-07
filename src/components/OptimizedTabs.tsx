import React, { memo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OptimizedTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

// Componente de abas otimizado para evitar re-renders desnecessários
export const OptimizedTabs = memo<OptimizedTabsProps>(({ 
  value, 
  onValueChange, 
  children, 
  className 
}) => {
  const handleValueChange = useCallback((newValue: string) => {
    if (newValue !== value) {
      onValueChange(newValue);
    }
  }, [value, onValueChange]);

  return (
    <Tabs 
      value={value} 
      onValueChange={handleValueChange}
      className={className}
    >
      {children}
    </Tabs>
  );
});

OptimizedTabs.displayName = 'OptimizedTabs';

interface OptimizedTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const OptimizedTabsContent = memo<OptimizedTabsContentProps>(({ 
  value, 
  children,
  className 
}) => {
  return (
    <TabsContent value={value} className={className}>
      {children}
    </TabsContent>
  );
});

OptimizedTabsContent.displayName = 'OptimizedTabsContent';

export { TabsList, TabsTrigger };