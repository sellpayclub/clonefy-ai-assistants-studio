import { memo } from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = memo(() => {
  return (
    <div className="flex justify-start mb-4 animate-fade-in" role="status" aria-live="polite">
      <div className="flex max-w-[80%] flex-row items-start space-x-2">
        <div className="flex-shrink-0 mr-2">
          <div className="bg-secondary text-secondary-foreground rounded-full p-2 shadow-sm">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
          <div className="flex space-x-1 items-end">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;