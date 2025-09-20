'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { chat, ChatOutput } from '@/ai/flows/chat-flow';
import { Send, User, Bot } from 'lucide-react';
import { AILoader } from './ai-loader';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';

type ChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Message = {
    role: 'user' | 'bot';
    content: string;
};

export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([{ role: 'bot', content: t('dialogs.chatWelcome') }]);
    }
  }, [open, t]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to the bottom.
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div');
            if(viewport) viewport.scrollTop = viewport.scrollHeight;
        }, 100);
    }
  }, [messages]);


  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatOutput = await chat({ question: input });
      const botMessage: Message = { role: 'bot', content: response.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: Message = { role: 'bot', content: 'Sorry, I encountered an error.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('dialogs.chatTitle')}</DialogTitle>
          <DialogDescription>Ask the AI assistant a question.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'bot' && (
                        <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                            <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("p-3 rounded-lg max-w-[80%]", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                        {msg.content}
                    </div>
                     {msg.role === 'user' && (
                        <Avatar className="w-8 h-8">
                            <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
            {isLoading && <AILoader text="Assistant is typing..." />}
            </div>
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('dialogs.chatPlaceholder')}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
