'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Map, 
  Grid, 
  Users, 
  Settings, 
  Save, 
  Download,
  Upload,
  Plus,
  Trash2,
  Move,
  Eye,
  EyeOff
} from 'lucide-react';

interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  grid_type: 'square' | 'hex' | 'none';
  grid_size: number;
  background?: any;
  tokens: Token[];
}

interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  grid_x?: number;
  grid_y?: number;
  appearance?: any;
  is_visible: boolean;
  is_locked: boolean;
}

interface MapEditorProps {
  mapId: string;
  onMapUpdate?: (mapData: MapData) => void;
}

export function MapEditor({ mapId, onMapUpdate }: MapEditorProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showTokens, setShowTokens] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    loadMap();
  }, [mapId]);

  useEffect(() => {
    if (canvasRef.current && mapData) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        contextRef.current = context;
        drawMap();
      }
    }
  }, [mapData, showGrid, showTokens]);

  const loadMap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/maps/${mapId}`);
      if (response.ok) {
        const data = await response.json();
        setMapData(data);
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawMap = useCallback(() => {
    if (!contextRef.current || !mapData) return;

    const canvas = canvasRef.current!;
    const ctx = contextRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = mapData.width;
    canvas.height = mapData.height;
    
    // Draw background
    if (mapData.background) {
      // TODO: Draw background image or color
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw grid
    if (showGrid && mapData.grid_type !== 'none') {
      drawGrid(ctx, mapData);
    }
    
    // Draw tokens
    if (showTokens) {
      drawTokens(ctx, mapData.tokens);
    }
  }, [mapData, showGrid, showTokens]);

  const drawGrid = (ctx: CanvasRenderingContext2D, map: MapData) => {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    
    if (map.grid_type === 'square') {
      // Draw square grid
      for (let x = 0; x <= map.width; x += map.grid_size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, map.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= map.height; y += map.grid_size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(map.width, y);
        ctx.stroke();
      }
    } else if (map.grid_type === 'hex') {
      // Draw hex grid
      const hexSize = map.grid_size;
      const hexWidth = hexSize * 2;
      const hexHeight = hexSize * Math.sqrt(3);
      
      for (let row = 0; row < map.height / hexHeight; row++) {
        for (let col = 0; col < map.width / (hexWidth * 0.75); col++) {
          const x = col * hexWidth * 0.75;
          const y = row * hexHeight;
          if (col % 2 === 1) {
            y += hexHeight / 2;
          }
          
          drawHexagon(ctx, x + hexSize, y + hexHeight / 2, hexSize);
        }
      }
    }
  };

  const drawHexagon = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawTokens = (ctx: CanvasRenderingContext2D, tokens: Token[]) => {
    tokens.forEach(token => {
      if (!token.is_visible) return;
      
      const size = token.size * (mapData?.grid_size || 50);
      
      // Draw token background
      ctx.fillStyle = selectedToken?.id === token.id ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(token.x, token.y, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw token border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw token name
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(token.name, token.x, token.y + 4);
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapData) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicked on a token
    const clickedToken = mapData.tokens.find(token => {
      const distance = Math.sqrt((x - token.x) ** 2 + (y - token.y) ** 2);
      return distance <= (token.size * mapData.grid_size) / 2;
    });
    
    setSelectedToken(clickedToken || null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedToken || selectedToken.is_locked) return;
    
    setIsDragging(true);
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    setDragStart({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedToken || !mapData) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Snap to grid if enabled
    let newX = x;
    let newY = y;
    
    if (mapData.grid_type !== 'none') {
      newX = Math.round(x / mapData.grid_size) * mapData.grid_size;
      newY = Math.round(y / mapData.grid_size) * mapData.grid_size;
    }
    
    // Update token position
    const updatedTokens = mapData.tokens.map(token =>
      token.id === selectedToken.id
        ? { ...token, x: newX, y: newY }
        : token
    );
    
    setMapData({ ...mapData, tokens: updatedTokens });
    setSelectedToken({ ...selectedToken, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging && selectedToken) {
      // Save token position
      saveTokenPosition(selectedToken.id, selectedToken.x, selectedToken.y);
    }
    setIsDragging(false);
  };

  const saveTokenPosition = async (tokenId: string, x: number, y: number) => {
    try {
      await fetch(`/api/v1/maps/tokens/${tokenId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
    } catch (error) {
      console.error('Failed to save token position:', error);
    }
  };

  const addToken = async () => {
    if (!mapData) return;
    
    try {
      const newToken: Partial<Token> = {
        name: `Token ${mapData.tokens.length + 1}`,
        x: mapData.width / 2,
        y: mapData.height / 2,
        size: 1,
        is_visible: true,
        is_locked: false
      };
      
      const response = await fetch('/api/v1/maps/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newToken,
          map_id: mapId
        })
      });
      
      if (response.ok) {
        const token = await response.json();
        setMapData({
          ...mapData,
          tokens: [...mapData.tokens, token]
        });
      }
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!mapData) return;
    
    try {
      await fetch(`/api/v1/maps/tokens/${tokenId}`, {
        method: 'DELETE'
      });
      
      setMapData({
        ...mapData,
        tokens: mapData.tokens.filter(t => t.id !== tokenId)
      });
      
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading map...</div>
        </CardContent>
      </Card>
    );
  }

  if (!mapData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Map not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full">
      {/* Map Canvas */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                {mapData.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showGrid ? 'default' : 'outline'}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  size="sm"
                  variant={showTokens ? 'default' : 'outline'}
                  onClick={() => setShowTokens(!showTokens)}
                >
                  {showTokens ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  Tokens
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="cursor-crosshair"
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  width: `${mapData.width}px`,
                  height: `${mapData.height}px`,
                  maxWidth: '100%',
                  maxHeight: '70vh'
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-80 p-4 border-l">
        <div className="space-y-4">
          {/* Map Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>Size</Label>
                <p className="text-sm text-muted-foreground">
                  {mapData.width} × {mapData.height} px
                </p>
              </div>
              <div>
                <Label>Grid</Label>
                <p className="text-sm text-muted-foreground">
                  {mapData.grid_type} ({mapData.grid_size}px)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tokens */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tokens</CardTitle>
                <Button size="sm" onClick={addToken}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {mapData.tokens.map(token => (
                    <div
                      key={token.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedToken?.id === token.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{token.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ({token.x}, {token.y})
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {token.is_locked && <Badge variant="outline">Locked</Badge>}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteToken(token.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Selected Token */}
          {selectedToken && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Token</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedToken.name}
                    onChange={(e) => {
                      const updatedToken = { ...selectedToken, name: e.target.value };
                      setSelectedToken(updatedToken);
                      // TODO: Save token name
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedToken.x)}
                      onChange={(e) => {
                        const updatedToken = { ...selectedToken, x: parseInt(e.target.value) };
                        setSelectedToken(updatedToken);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedToken.y)}
                      onChange={(e) => {
                        const updatedToken = { ...selectedToken, y: parseInt(e.target.value) };
                        setSelectedToken(updatedToken);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedToken.size}
                    onChange={(e) => {
                      const updatedToken = { ...selectedToken, size: parseInt(e.target.value) };
                      setSelectedToken(updatedToken);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
