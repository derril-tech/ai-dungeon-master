'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Search, CheckCircle, XCircle, Sword, Shield, Zap } from 'lucide-react';

interface Ruling {
  id: string;
  ruleRef: string;
  context: Record<string, any>;
  outcome: Record<string, any>;
  timestamp: string;
}

interface CombatRule {
  id: string;
  name: string;
  type: 'action' | 'reaction' | 'bonus_action' | 'movement' | 'condition';
  description: string;
  requirements?: string[];
  effects?: string[];
}

interface RulesPanelProps {
  sessionId: string;
  onRulingCreated?: (ruling: Ruling) => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ 
  sessionId, 
  onRulingCreated 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [rulings, setRulings] = useState<Ruling[]>([]);
  const [activeTab, setActiveTab] = useState('combat');

  const combatRules: CombatRule[] = [
    {
      id: '1',
      name: 'Attack Action',
      type: 'action',
      description: 'Make one melee or ranged attack',
      requirements: ['Action available'],
      effects: ['Make attack roll', 'Apply damage on hit']
    },
    {
      id: '2',
      name: 'Dash Action',
      type: 'action',
      description: 'Gain extra movement equal to your speed',
      requirements: ['Action available'],
      effects: ['Double movement speed for this turn']
    },
    {
      id: '3',
      name: 'Disengage Action',
      type: 'action',
      description: 'Your movement doesn\'t provoke opportunity attacks',
      requirements: ['Action available'],
      effects: ['No opportunity attacks until end of turn']
    },
    {
      id: '4',
      name: 'Dodge Action',
      type: 'action',
      description: 'Until the start of your next turn, any attack roll made against you has disadvantage',
      requirements: ['Action available'],
      effects: ['Attackers have disadvantage against you']
    },
    {
      id: '5',
      name: 'Help Action',
      type: 'action',
      description: 'Aid another creature in completing a task',
      requirements: ['Action available', 'Target within 5 feet'],
      effects: ['Target has advantage on next ability check']
    },
    {
      id: '6',
      name: 'Hide Action',
      type: 'action',
      description: 'Make a Dexterity (Stealth) check to hide',
      requirements: ['Action available', 'Suitable hiding place'],
      effects: ['Become hidden if check succeeds']
    },
    {
      id: '7',
      name: 'Ready Action',
      type: 'action',
      description: 'Prepare to take a reaction when a trigger occurs',
      requirements: ['Action available'],
      effects: ['Can use reaction when trigger occurs']
    },
    {
      id: '8',
      name: 'Search Action',
      type: 'action',
      description: 'Devote your attention to finding something',
      requirements: ['Action available'],
      effects: ['Make Wisdom (Perception) check to find hidden objects/creatures']
    },
    {
      id: '9',
      name: 'Use an Object',
      type: 'action',
      description: 'Interact with a second object or feature of the environment',
      requirements: ['Action available'],
      effects: ['Interact with object or feature']
    }
  ];

  const searchRules = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      const response = await fetch('/api/v1/rules/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search rules');
      }

      const results = await response.json();
      setSearchResults(results);
      
    } catch (error) {
      console.error('Rules search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const createRuling = async (ruleRef: string, context: Record<string, any>) => {
    try {
      const response = await fetch('/api/v1/rules/ruling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleRef,
          context,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ruling');
      }

      const ruling = await response.json();
      setRulings(prev => [ruling, ...prev]);
      onRulingCreated?.(ruling);
      
    } catch (error) {
      console.error('Ruling creation error:', error);
    }
  };

  const getSuccessIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'action':
        return <Sword className="h-4 w-4" />;
      case 'reaction':
        return <Zap className="h-4 w-4" />;
      case 'bonus_action':
        return <Shield className="h-4 w-4" />;
      case 'movement':
        return <Zap className="h-4 w-4" />;
      case 'condition':
        return <Shield className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'action':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reaction':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bonus_action':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'movement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'condition':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Rules & Rulings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combat" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Combat Actions
            </TabsTrigger>
            <TabsTrigger value="search">Search Rules</TabsTrigger>
            <TabsTrigger value="rulings">Recent Rulings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="combat" className="flex-1 flex flex-col gap-4">
            <div>
              <Label className="text-base font-medium">Standard Actions</Label>
              <ScrollArea className="h-full mt-2">
                <div className="space-y-3">
                  {combatRules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-muted rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getActionIcon(rule.type)}
                          <span className="font-medium">{rule.name}</span>
                        </div>
                        <Badge variant="outline" className={getActionColor(rule.type)}>
                          {rule.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rule.description}
                      </p>
                      {rule.requirements && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Requirements:</span>
                          <ul className="text-xs text-muted-foreground ml-2">
                            {rule.requirements.map((req, index) => (
                              <li key={index}>• {req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rule.effects && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Effects:</span>
                          <ul className="text-xs text-muted-foreground ml-2">
                            {rule.effects.map((effect, index) => (
                              <li key={index}>• {effect}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="search" className="flex-1 flex flex-col gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="rules-search">Search Rules</Label>
              <div className="flex gap-2">
                <Input
                  id="rules-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for rules, spells, abilities..."
                  disabled={isSearching}
                  onKeyPress={(e) => e.key === 'Enter' && searchRules()}
                  className="flex-1"
                />
                <Button
                  onClick={searchRules}
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {result.section}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {result.ruleset}
                        </span>
                      </div>
                      <div className="text-sm mb-3">
                        {result.text}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createRuling(result.id, { query: searchQuery })}
                      >
                        Create Ruling
                      </Button>
                    </div>
                  ))}
                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-center text-muted-foreground py-8">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No rules found</p>
                      <p className="text-xs">Try searching for specific terms</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="rulings" className="flex-1 flex flex-col">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {rulings.map((ruling) => (
                  <div
                    key={ruling.id}
                    className="p-3 bg-muted rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Ruling</span>
                        {ruling.outcome.success !== undefined && 
                          getSuccessIcon(ruling.outcome.success)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ruling.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm mb-2">
                      <strong>Rule:</strong> {ruling.ruleRef}
                    </div>
                    
                    {ruling.context && Object.keys(ruling.context).length > 0 && (
                      <div className="text-sm mb-2">
                        <strong>Context:</strong>
                        <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(ruling.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {ruling.outcome && Object.keys(ruling.outcome).length > 0 && (
                      <div className="text-sm">
                        <strong>Outcome:</strong>
                        <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(ruling.outcome, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {rulings.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rulings yet</p>
                    <p className="text-xs">Search for rules to create rulings</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
