'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, VolumeX } from 'lucide-react';

interface NarrationChunk {
  type: 'narration' | 'npc_response';
  content: string;
  timestamp?: string;
}

interface NarrationPanelProps {
  sessionId: string;
  isStreaming?: boolean;
  onNarrationComplete?: () => void;
}

export const NarrationPanel: React.FC<NarrationPanelProps> = ({
  sessionId,
  isStreaming = false,
  onNarrationComplete
}) => {
  const [narration, setNarration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [narrationHistory, setNarrationHistory] = useState<NarrationChunk[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [narration]);

  const startNarration = async () => {
    setIsLoading(true);
    setNarration('');
    
    try {
      const response = await fetch(`/api/v1/narration/${sessionId}/narrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            sessionId,
            timestamp: new Date().toISOString(),
          },
          style: 'default',
          length: 'medium'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start narration');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedNarration = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'narration') {
                accumulatedNarration += data.content;
                setNarration(accumulatedNarration);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Add to history when complete
      setNarrationHistory(prev => [...prev, {
        type: 'narration',
        content: accumulatedNarration,
        timestamp: new Date().toISOString()
      }]);

      onNarrationComplete?.();
      
    } catch (error) {
      console.error('Narration error:', error);
      setNarration('The narration falters... Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearNarration = () => {
    setNarration('');
    setNarrationHistory([]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Narration</span>
            {isStreaming && (
              <Badge variant="secondary" className="animate-pulse">
                Live
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearNarration}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="space-y-4">
              {/* Current narration */}
              {narration && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">
                    Current Scene
                  </div>
                  <div className="text-sm leading-relaxed">
                    {narration}
                    {isLoading && (
                      <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              )}
              
              {/* Narration history */}
              {narrationHistory.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    History
                  </div>
                  {narrationHistory.map((chunk, index) => (
                    <div key={index} className="p-3 bg-background border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {chunk.type === 'narration' ? 'DM' : 'NPC'}
                        </Badge>
                        {chunk.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed">
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Controls */}
        <div className="flex-shrink-0">
          <Button
            onClick={startNarration}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Narrating...
              </>
            ) : (
              'Start Narration'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
