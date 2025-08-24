'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Shield, 
  Sword, 
  Heart, 
  Skull, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Effect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'damage' | 'healing' | 'status';
  target: string;
  value?: number;
  duration?: number;
  remaining_rounds?: number;
  description: string;
  timestamp: string;
}

interface EffectOverlaysProps {
  encounterId: string;
  currentParticipant?: string;
}

export function EffectOverlays({ encounterId, currentParticipant }: EffectOverlaysProps) {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEffects();
  }, [encounterId]);

  const loadEffects = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/combat/encounters/${encounterId}/effects`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setEffects(data);
      // }
      
      // Mock data for now
      setEffects([
        {
          id: '1',
          name: 'Bless',
          type: 'buff',
          target: 'Fighter',
          value: 1,
          duration: 10,
          remaining_rounds: 8,
          description: 'Advantage on attack rolls and saving throws',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Poisoned',
          type: 'debuff',
          target: 'Goblin',
          value: -2,
          duration: 5,
          remaining_rounds: 3,
          description: 'Disadvantage on attack rolls and ability checks',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Fireball Damage',
          type: 'damage',
          target: 'Multiple',
          value: 28,
          description: 'Fire damage from Fireball spell',
          timestamp: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Cure Wounds',
          type: 'healing',
          target: 'Cleric',
          value: 12,
          description: 'Healing from Cure Wounds spell',
          timestamp: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Unconscious',
          type: 'status',
          target: 'Rogue',
          description: 'Unconscious due to failed death saves',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load effects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'buff':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'debuff':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'damage':
        return <Sword className="h-4 w-4 text-red-500" />;
      case 'healing':
        return <Heart className="h-4 w-4 text-green-500" />;
      case 'status':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getEffectColor = (type: string) => {
    switch (type) {
      case 'buff':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'debuff':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'damage':
        return 'bg-red-50 text-red-700 border-red-300';
      case 'healing':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'status':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffectPriority = (type: string) => {
    switch (type) {
      case 'status':
        return 1;
      case 'damage':
        return 2;
      case 'debuff':
        return 3;
      case 'healing':
        return 4;
      case 'buff':
        return 5;
      default:
        return 6;
    }
  };

  const sortedEffects = [...effects].sort((a, b) => {
    const priorityA = getEffectPriority(a.type);
    const priorityB = getEffectPriority(b.type);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const activeEffects = sortedEffects.filter(effect => 
    !effect.remaining_rounds || effect.remaining_rounds > 0
  );

  const expiredEffects = sortedEffects.filter(effect => 
    effect.remaining_rounds !== undefined && effect.remaining_rounds <= 0
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Combat Effects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading effects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Combat Effects
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{activeEffects.length} active</span>
          {expiredEffects.length > 0 && (
            <>
              <span>•</span>
              <span>{expiredEffects.length} expired</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Effects */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Effects
            </h4>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {activeEffects.map((effect) => (
                  <div
                    key={effect.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      effect.target === currentParticipant
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getEffectIcon(effect.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{effect.name}</span>
                            <Badge variant="outline" className={getEffectColor(effect.type)}>
                              {effect.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {effect.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Target: {effect.target}</span>
                            {effect.value !== undefined && (
                              <span>Value: {effect.value > 0 ? '+' : ''}{effect.value}</span>
                            )}
                            {effect.remaining_rounds !== undefined && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {effect.remaining_rounds} rounds left
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeEffects.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No active effects
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Expired Effects */}
          {expiredEffects.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Skull className="h-4 w-4" />
                  Recently Expired
                </h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {expiredEffects.slice(0, 5).map((effect) => (
                      <div
                        key={effect.id}
                        className="p-2 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          {getEffectIcon(effect.type)}
                          <span className="font-medium text-sm">{effect.name}</span>
                          <span className="text-xs text-muted-foreground">
                            on {effect.target}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
