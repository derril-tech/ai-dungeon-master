'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Gem, 
  Crown, 
  Sword, 
  Package, 
  Download,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface LootItem {
  id: string;
  name: string;
  type: 'coin' | 'gem' | 'art' | 'magic_item';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  value: number;
  description: string;
  quantity?: number;
  attunement_required?: boolean;
}

interface LootData {
  coins: Record<string, number>;
  gems: LootItem[];
  art_objects: LootItem[];
  magic_items: LootItem[];
  total_value: number;
  rarity_breakdown: Record<string, number>;
}

interface LootDrawerProps {
  sessionId: string;
  onLootUpdate?: (loot: LootData) => void;
}

export function LootDrawer({ sessionId, onLootUpdate }: LootDrawerProps) {
  const [lootData, setLootData] = useState<LootData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    loadLoot();
  }, [sessionId]);

  const loadLoot = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/sessions/${sessionId}/loot`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setLootData(data);
      // }
      
      // Mock data for now
      setLootData({
        coins: {
          copper: 150,
          silver: 75,
          gold: 250,
          platinum: 10
        },
        gems: [
          {
            id: '1',
            name: 'Ruby',
            type: 'gem',
            rarity: 'rare',
            value: 500,
            description: 'A precious ruby of exceptional quality.',
            quantity: 1
          },
          {
            id: '2',
            name: 'Diamond',
            type: 'gem',
            rarity: 'very_rare',
            value: 1000,
            description: 'A magnificent diamond that seems to glow with inner light.',
            quantity: 1
          }
        ],
        art_objects: [
          {
            id: '3',
            name: 'Golden Crown',
            type: 'art',
            rarity: 'rare',
            value: 1500,
            description: 'A beautifully crafted golden crown.',
            quantity: 1
          }
        ],
        magic_items: [
          {
            id: '4',
            name: 'Sword of Sharpness',
            type: 'magic_item',
            rarity: 'rare',
            value: 2000,
            description: 'A magical sword that cuts through armor with ease.',
            quantity: 1,
            attunement_required: true
          },
          {
            id: '5',
            name: 'Potion of Healing',
            type: 'magic_item',
            rarity: 'common',
            value: 50,
            description: 'A magical potion that restores health.',
            quantity: 3,
            attunement_required: false
          }
        ],
        total_value: 5375,
        rarity_breakdown: {
          common: 1,
          rare: 2,
          very_rare: 1
        }
      });
    } catch (error) {
      console.error('Failed to load loot:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLoot = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/sessions/${sessionId}/loot/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     challenge_rating: 5,
      //     hoard_type: 'standard',
      //     party_size: 4,
      //     party_level: 3
      //   })
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   setLootData(data);
      //   onLootUpdate?.(data);
      // }
      
      // Mock loot generation
      const newLoot: LootData = {
        coins: {
          gold: Math.floor(Math.random() * 500) + 100,
          platinum: Math.floor(Math.random() * 20) + 5
        },
        gems: [
          {
            id: Date.now().toString(),
            name: 'Emerald',
            type: 'gem',
            rarity: 'rare',
            value: 750,
            description: 'A precious emerald of exceptional quality.',
            quantity: 1
          }
        ],
        art_objects: [],
        magic_items: [
          {
            id: (Date.now() + 1).toString(),
            name: 'Ring of Protection',
            type: 'magic_item',
            rarity: 'uncommon',
            value: 500,
            description: 'A magical ring that provides protection.',
            quantity: 1,
            attunement_required: true
          }
        ],
        total_value: 1250,
        rarity_breakdown: {
          uncommon: 1,
          rare: 1
        }
      };
      
      setLootData(newLoot);
      onLootUpdate?.(newLoot);
    } catch (error) {
      console.error('Failed to generate loot:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLoot = async (format: string) => {
    if (!lootData) return;
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/sessions/${sessionId}/loot/export`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ format })
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   // Handle file download
      // }
      
      // Mock export
      const exportData = {
        session_id: sessionId,
        loot: lootData,
        export_date: new Date().toISOString(),
        format
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loot_export_${sessionId}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export loot:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'uncommon':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'very_rare':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'coin':
        return <Coins className="h-4 w-4" />;
      case 'gem':
        return <Gem className="h-4 w-4" />;
      case 'art':
        return <Crown className="h-4 w-4" />;
      case 'magic_item':
        return <Sword className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loot Drawer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading loot...</div>
        </CardContent>
      </Card>
    );
  }

  if (!lootData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loot Drawer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No loot found</p>
            <Button onClick={generateLoot}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Loot
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Loot Drawer</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showValues ? 'default' : 'outline'}
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Values
            </Button>
            <Button size="sm" onClick={generateLoot}>
              <Plus className="h-4 w-4 mr-1" />
              Generate
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total Value: {showValues ? `${lootData.total_value} gp` : 'Hidden'}</span>
          <span>Items: {lootData.gems.length + lootData.art_objects.length + lootData.magic_items.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coins" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="coins" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="gems" className="flex items-center gap-2">
              <Gem className="h-4 w-4" />
              Gems
            </TabsTrigger>
            <TabsTrigger value="art" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Art
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Magic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coins" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(lootData.coins).map(([coinType, amount]) => (
                <div key={coinType} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      <span className="font-medium capitalize">{coinType}</span>
                    </div>
                    <span className="font-mono text-lg">{amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gems" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {lootData.gems.map((gem) => (
                  <div key={gem.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Gem className="h-4 w-4 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{gem.name}</span>
                            <Badge variant="outline" className={getRarityColor(gem.rarity)}>
                              {gem.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {gem.description}
                          </p>
                          {showValues && (
                            <div className="text-sm">
                              <span className="font-mono">{gem.value} gp</span>
                              {gem.quantity && gem.quantity > 1 && (
                                <span className="text-muted-foreground ml-2">
                                  (×{gem.quantity})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {lootData.gems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gem className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No gems found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="art" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {lootData.art_objects.map((art) => (
                  <div key={art.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Crown className="h-4 w-4 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{art.name}</span>
                            <Badge variant="outline" className={getRarityColor(art.rarity)}>
                              {art.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {art.description}
                          </p>
                          {showValues && (
                            <div className="text-sm">
                              <span className="font-mono">{art.value} gp</span>
                              {art.quantity && art.quantity > 1 && (
                                <span className="text-muted-foreground ml-2">
                                  (×{art.quantity})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {lootData.art_objects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No art objects found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="magic" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {lootData.magic_items.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Sword className="h-4 w-4 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className={getRarityColor(item.rarity)}>
                              {item.rarity}
                            </Badge>
                            {item.attunement_required && (
                              <Badge variant="secondary">Attunement</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          {showValues && (
                            <div className="text-sm">
                              <span className="font-mono">{item.value} gp</span>
                              {item.quantity && item.quantity > 1 && (
                                <span className="text-muted-foreground ml-2">
                                  (×{item.quantity})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {lootData.magic_items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sword className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No magic items found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {Object.entries(lootData.rarity_breakdown).map(([rarity, count]) => (
              <span key={rarity} className="mr-4">
                {rarity}: {count}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportLoot('json')}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
