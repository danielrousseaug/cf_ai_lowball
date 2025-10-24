import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
        isUser ? 'bg-gray-200 text-gray-900' : 'bg-gray-300 text-gray-900'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={cn('flex-1 max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'px-4 py-3 rounded-lg',
          isUser
            ? 'bg-gray-100 border border-gray-200'
            : 'bg-white border border-gray-200'
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap text-gray-900">{message.content}</p>
          ) : (
            <div className="text-sm text-gray-900">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-gray-900 mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-gray-900 font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="text-gray-900 list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="text-gray-900 list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-900">{children}</li>,
                  h1: ({ children }) => <h1 className="text-gray-900 text-lg font-semibold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-gray-900 text-base font-semibold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-gray-900 text-sm font-semibold mb-1">{children}</h3>,
                  code: ({ children }) => <code className="text-gray-900 bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
