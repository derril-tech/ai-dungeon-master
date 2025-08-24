'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Users, 
  Sword,
  Shield,
  Zap
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  initiative_roll: number;
  initiative_total: number;
  initiative_modifier: number;
  turn_order: number;
  is_active: boolean;
  stats?: {
    current_hp?: number;
    max_hp?: number;
    armor_class?: number;
  };
}

interface InitiativeTrackerProps {
  encounterId: string;
  onTurnChange?: (participant: Participant) => void;
}

export function InitiativeTracker({ encounterId, onTurnChange }: InitiativeTrackerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitiativeOrder();
  }, [encounterId]);

  const loadInitiativeOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/combat/encounters/${encounterId}/initiative`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error('Failed to load initiative order:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCombat = () => {
    setIsActive(true);
    setCurrentTurn(0);
    setRound(1);
    if (participants.length > 0 && onTurnChange) {
      onTurnChange(participants[0]);
    }
  };

  const pauseCombat = () => {
    setIsActive(false);
  };

  const nextTurn = () => {
    if (participants.length === 0) return;

    const nextTurnIndex = (currentTurn + 1) % participants.length;
    setCurrentTurn(nextTurnIndex);

    // If we've completed a full round
    if (nextTurnIndex === 0) {
      setRound(round + 1);
    }

    if (onTurnChange) {
      onTurnChange(participants[nextTurnIndex]);
    }
  };

  const resetCombat = () => {
    setCurrentTurn(0);
    setRound(1);
    setIsActive(false);
  };

  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <Users className="h-4 w-4" />;
      case 'npc':
        return <Shield className="h-4 w-4" />;
      case 'monster':
        return <Sword className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getParticipantColor = (type: string) => {
    switch (type) {
      case 'player':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'npc':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'monster':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Initiative Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading initiative order...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Initiative Tracker
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Round: {round}</span>
          <span>Turn: {currentTurn + 1}</span>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Paused'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Combat Controls */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startCombat} size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Combat
              </Button>
            ) : (
              <Button onClick={pauseCombat} size="sm" variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={nextTurn} size="sm" disabled={!isActive}>
              <SkipForward className="h-4 w-4 mr-2" />
              Next Turn
            </Button>
            <Button onClick={resetCombat} size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <Separator />

          {/* Initiative Order */}
          <div>
            <h4 className="font-medium mb-2">Initiative Order</h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      index === currentTurn && isActive
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getParticipantIcon(participant.type)}
                        <span className="font-medium">{participant.name}</span>
                      </div>
                      <Badge variant="outline" className={getParticipantColor(participant.type)}>
                        {participant.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-mono">
                          {participant.initiative_total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({participant.initiative_roll} + {participant.initiative_modifier})
                        </div>
                      </div>
                      
                      {participant.stats && (
                        <div className="text-right">
                          <div className="font-mono">
                            {participant.stats.current_hp || 0}/{participant.stats.max_hp || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            AC: {participant.stats.armor_class || '?'}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          #{participant.turn_order}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Turn
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Current Turn Indicator */}
          {isActive && participants.length > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">Current Turn:</span>
                <span className="font-bold">
                  {participants[currentTurn]?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
