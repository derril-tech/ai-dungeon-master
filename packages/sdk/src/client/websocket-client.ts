import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketClientOptions {
  url: string;
  token?: string;
  autoConnect?: boolean;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.options.url, {
        auth: this.options.token ? { token: this.options.token } : undefined,
        autoConnect: this.options.autoConnect ?? true,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('join_session', { sessionId });
    }
  }

  leaveSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('leave_session', { sessionId });
    }
  }

  onNarration(callback: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('narration', callback);
    }
  }

  onCombatUpdate(callback: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('combat_update', callback);
    }
  }

  onMapUpdate(callback: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('map_update', callback);
    }
  }

  onRollResult(callback: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('roll_result', callback);
    }
  }

  onSessionStateChange(callback: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('session_state_change', callback);
    }
  }

  // Send messages
  sendRoll(expression: string, advantage?: string): void {
    if (this.socket) {
      this.socket.emit('roll', { expression, advantage });
    }
  }

  sendAction(action: string, data?: any): void {
    if (this.socket) {
      this.socket.emit('action', { action, data });
    }
  }

  sendMapUpdate(update: any): void {
    if (this.socket) {
      this.socket.emit('map_update', update);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
