'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Dice, RotateCcw } from 'lucide-react';

interface DiceRoll {
  id: string;
  expression: string;
  advantage: string;
  rolls: number[];
  total: number;
  timestamp: string;
}

interface DiceTrayProps {
  onRollComplete?: (roll: DiceRoll) => void;
}

export const DiceTray: React.FC<DiceTrayProps> = ({ onRollComplete }) => {
  const [expression, setExpression] = useState('1d20');
  const [advantage, setAdvantage] = useState('normal');
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);

  const quickRolls = [
    { label: 'd20', value: '1d20' },
    { label: '2d20 (Adv)', value: '2d20kh1' },
    { label: 'd6', value: '1d6' },
    { label: '2d6', value: '2d6' },
    { label: 'd8', value: '1d8' },
    { label: 'd10', value: '1d10' },
    { label: 'd12', value: '1d12' },
    { label: 'd100', value: '1d100' },
  ];

  const rollDice = async () => {
    if (!expression.trim()) return;

    setIsRolling(true);
    
    try {
      const response = await fetch('/api/v1/combat/roll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression: expression.trim(),
          advantage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to roll dice');
      }

      const result = await response.json();
      
      const roll: DiceRoll = {
        id: Date.now().toString(),
        expression: result.expression,
        advantage: result.advantage,
        rolls: result.rolls,
        total: result.total,
        timestamp: new Date().toISOString(),
      };

      setRollHistory(prev => [roll, ...prev.slice(0, 9)]); // Keep last 10 rolls
      onRollComplete?.(roll);
      
    } catch (error) {
      console.error('Dice roll error:', error);
      // You might want to show a toast notification here
    } finally {
      setIsRolling(false);
    }
  };

  const quickRoll = (value: string) => {
    setExpression(value);
    // Auto-roll for quick rolls
    setTimeout(() => rollDice(), 100);
  };

  const clearHistory = () => {
    setRollHistory([]);
  };

  const formatRolls = (rolls: number[]): string => {
    if (rolls.length === 1) return rolls[0].toString();
    return `[${rolls.join(', ')}]`;
  };

  const getRollColor = (total: number, expression: string): string => {
    if (expression.includes('d20')) {
      if (total === 20) return 'text-green-600 font-bold';
      if (total === 1) return 'text-red-600 font-bold';
      if (total >= 15) return 'text-green-600';
      if (total <= 5) return 'text-red-600';
    }
    return '';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dice className="h-5 w-5" />
            Dice Tray
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Roll Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickRolls.map((roll) => (
            <Button
              key={roll.value}
              variant="outline"
              size="sm"
              onClick={() => quickRoll(roll.value)}
              disabled={isRolling}
              className="text-xs"
            >
              {roll.label}
            </Button>
          ))}
        </div>

        {/* Custom Roll Input */}
        <div className="space-y-2">
          <Label htmlFor="expression">Custom Roll</Label>
          <div className="flex gap-2">
            <Input
              id="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g., 2d20kh1 + 5"
              disabled={isRolling}
              className="flex-1"
            />
            <Select value={advantage} onValueChange={setAdvantage}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="advantage">Adv</SelectItem>
                <SelectItem value="disadvantage">Dis</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={rollDice}
              disabled={isRolling || !expression.trim()}
              className="px-4"
            >
              {isRolling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Dice className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Roll History */}
        <div className="flex-1 min-h-0">
          <Label className="text-sm font-medium">Recent Rolls</Label>
          <ScrollArea className="h-full mt-2">
            <div className="space-y-2">
              {rollHistory.map((roll) => (
                <div
                  key={roll.id}
                  className="p-3 bg-muted rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{roll.expression}</span>
                      {roll.advantage !== 'normal' && (
                        <Badge variant="outline" className="text-xs">
                          {roll.advantage === 'advantage' ? 'Adv' : 'Dis'}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(roll.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rolls: {formatRolls(roll.rolls)}
                    </span>
                    <span className="text-sm font-bold">
                      Total: 
                      <span className={`ml-1 ${getRollColor(roll.total, roll.expression)}`}>
                        {roll.total}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
              {rollHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Dice className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rolls yet</p>
                  <p className="text-xs">Use the quick roll buttons or enter a custom expression</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
