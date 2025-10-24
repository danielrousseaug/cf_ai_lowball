'use client';

import { useEffect, useRef } from 'react';
import { useChatHistory, useSendMessage, useClearHistory } from '@/hooks/use-chat';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/features/chat/chat-message';
import { ChatInput } from '@/components/features/chat/chat-input';

const MOCK_USER_ID = 'test-user-1';

export default function ChatPage() {
  const { data: messages, isLoading } = useChatHistory(MOCK_USER_ID);
  const sendMessage = useSendMessage();
  const clearHistory = useClearHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    try {
      await sendMessage.mutateAsync({
        userId: MOCK_USER_ID,
        message,
      });
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    }
  };

  const handleClear = async () => {
    if (confirm('Clear all chat history?')) {
      try {
        await clearHistory.mutateAsync(MOCK_USER_ID);
      } catch (error: any) {
        alert(error.message || 'Failed to clear history');
      }
    }
  };

  return (
    <Container className="py-8 max-w-4xl">
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Ask me anything about Lowball, reverse auctions, or bidding strategies
              </p>
            </div>
            {messages && messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={clearHistory.isPending}
              >
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading chat history...</p>
            </div>
          )}

          {!isLoading && (!messages || messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600 max-w-md">
                Ask me about how reverse auctions work, bidding strategies, or anything about the Lowball platform!
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => handleSend("How do reverse auctions work?")}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 text-left"
                >
                  How do reverse auctions work?
                </button>
                <button
                  onClick={() => handleSend("What's the best bidding strategy?")}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 text-left"
                >
                  What&apos;s the best bidding strategy?
                </button>
                <button
                  onClick={() => handleSend("Explain the currency types")}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 text-left"
                >
                  Explain the currency types
                </button>
                <button
                  onClick={() => handleSend("How do I win more tasks?")}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 text-left"
                >
                  How do I win more tasks?
                </button>
              </div>
            </div>
          )}

          {messages && messages.length > 0 && (
            <div>
              {messages.map((message: any) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        <ChatInput
          onSend={handleSend}
          isLoading={sendMessage.isPending}
        />
      </Card>
    </Container>
  );
}
