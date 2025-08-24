'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { NarrationPanel } from '@/components/NarrationPanel/NarrationPanel';
import { DiceTray } from '@/components/DiceTray/DiceTray';
import { RulesPanel } from '@/components/RulesPanel/RulesPanel';
import { InitiativeTracker } from '@/components/InitiativeTracker/InitiativeTracker';
import { EffectOverlays } from '@/components/EffectOverlays/EffectOverlays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface Session {
  id: string;
  campaignId: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  settings: Record<string, any>;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('narration');
  const [currentParticipant, setCurrentParticipant] = useState<string | undefined>();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transitionSession = async (event: string) => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event }),
      });

      if (response.ok) {
        await loadSession(); // Reload session data
      }
    } catch (error) {
      console.error('Failed to transition session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-500';
      case 'staging': return 'bg-blue-500';
      case 'exploring': return 'bg-green-500';
      case 'encounter': return 'bg-yellow-500';
      case 'combat': return 'bg-red-500';
      case 'downtime': return 'bg-purple-500';
      case 'paused': return 'bg-orange-500';
      case 'completed': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <p className="text-gray-600">The session you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Session</h1>
              <Badge className={getStatusColor(session.status)}>
                {getStatusLabel(session.status)}
              </Badge>
              {session.startedAt && (
                <span className="text-sm text-muted-foreground">
                  Started: {new Date(session.startedAt).toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {session.status === 'created' && (
                <Button onClick={() => transitionSession('start')}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              )}
              
              {['exploring', 'encounter', 'combat'].includes(session.status) && (
                <Button 
                  variant="outline" 
                  onClick={() => transitionSession('pause')}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {session.status === 'paused' && (
                <Button onClick={() => transitionSession('resume')}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              
              {!['completed', 'failed'].includes(session.status) && (
                <Button 
                  variant="destructive" 
                  onClick={() => transitionSession('end')}
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Narration */}
        <div className="w-1/2 p-4">
          <NarrationPanel 
            sessionId={sessionId}
            isStreaming={session.status === 'exploring'}
          />
        </div>

        {/* Right Panel - Tools */}
        <div className="w-1/2 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dice">Dice Tray</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="initiative">Initiative</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dice" className="flex-1 mt-4">
              <DiceTray 
                onRollComplete={(roll) => {
                  console.log('Dice roll completed:', roll);
                  // You could trigger narration or other effects here
                }}
              />
            </TabsContent>
            
            <TabsContent value="rules" className="flex-1 mt-4">
              <RulesPanel 
                sessionId={sessionId}
                onRulingCreated={(ruling) => {
                  console.log('Ruling created:', ruling);
                  // You could trigger narration or other effects here
                }}
              />
            </TabsContent>
            
            <TabsContent value="initiative" className="flex-1 mt-4">
              <InitiativeTracker 
                encounterId="mock-encounter-id"
                onTurnChange={(participant) => {
                  setCurrentParticipant(participant.name);
                  console.log('Turn changed to:', participant.name);
                }}
              />
            </TabsContent>
            
            <TabsContent value="effects" className="flex-1 mt-4">
              <EffectOverlays 
                encounterId="mock-encounter-id"
                currentParticipant={currentParticipant}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
