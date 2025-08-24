// Created automatically by Cursor AI (2024-12-19)

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NarrationPanel } from '../../../../apps/frontend/src/components/NarrationPanel/NarrationPanel';

// Mock the API client
vi.mock('../../../../packages/sdk/src/client/api-client', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    generateNarration: vi.fn(),
    getSessionHistory: vi.fn(),
  })),
}));

// Mock the WebSocket client
vi.mock('../../../../packages/sdk/src/client/websocket-client', () => ({
  WebSocketClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('NarrationPanel', () => {
  const mockProps = {
    sessionId: 'test-session-id',
    campaignId: 'test-campaign-id',
    onNarrationUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders narration panel with initial state', () => {
    render(<NarrationPanel {...mockProps} />);
    
    expect(screen.getByText('Narration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask the DM something...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('handles user input and sends narration request', async () => {
    const mockGenerateNarration = vi.fn().mockResolvedValue({
      narration: 'The DM responds to your question...',
      timestamp: new Date().toISOString(),
    });

    const { ApiClient } = await import('../../../../packages/sdk/src/client/api-client');
    (ApiClient as any).mockImplementation(() => ({
      generateNarration: mockGenerateNarration,
      getSessionHistory: vi.fn(),
    }));

    render(<NarrationPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Ask the DM something...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'What do I see in the tavern?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockGenerateNarration).toHaveBeenCalledWith({
        sessionId: 'test-session-id',
        prompt: 'What do I see in the tavern?',
        context: expect.any(Object),
      });
    });
  });

  it('displays loading state while generating narration', async () => {
    const mockGenerateNarration = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        narration: 'The DM responds...',
        timestamp: new Date().toISOString(),
      }), 100))
    );

    const { ApiClient } = await import('../../../../packages/sdk/src/client/api-client');
    (ApiClient as any).mockImplementation(() => ({
      generateNarration: mockGenerateNarration,
      getSessionHistory: vi.fn(),
    }));

    render(<NarrationPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Ask the DM something...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'What do I see?' } });
    fireEvent.click(sendButton);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
  });

  it('handles narration generation errors', async () => {
    const mockGenerateNarration = vi.fn().mockRejectedValue(new Error('API Error'));

    const { ApiClient } = await import('../../../../packages/sdk/src/client/api-client');
    (ApiClient as any).mockImplementation(() => ({
      generateNarration: mockGenerateNarration,
      getSessionHistory: vi.fn(),
    }));

    render(<NarrationPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Ask the DM something...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'What do I see?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error generating narration')).toBeInTheDocument();
    });
  });

  it('displays narration history', async () => {
    const mockHistory = [
      {
        id: '1',
        content: 'The tavern is dimly lit...',
        timestamp: '2024-01-01T10:00:00Z',
        type: 'narration',
      },
      {
        id: '2',
        content: 'You see a mysterious figure...',
        timestamp: '2024-01-01T10:05:00Z',
        type: 'narration',
      },
    ];

    const mockGetSessionHistory = vi.fn().mockResolvedValue(mockHistory);

    const { ApiClient } = await import('../../../../packages/sdk/src/client/api-client');
    (ApiClient as any).mockImplementation(() => ({
      generateNarration: vi.fn(),
      getSessionHistory: mockGetSessionHistory,
    }));

    render(<NarrationPanel {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('The tavern is dimly lit...')).toBeInTheDocument();
      expect(screen.getByText('You see a mysterious figure...')).toBeInTheDocument();
    });
  });

  it('handles empty input validation', () => {
    render(<NarrationPanel {...mockProps} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(sendButton).toBeDisabled();
  });

  it('handles keyboard shortcuts', async () => {
    const mockGenerateNarration = vi.fn().mockResolvedValue({
      narration: 'The DM responds...',
      timestamp: new Date().toISOString(),
    });

    const { ApiClient } = await import('../../../../packages/sdk/src/client/api-client');
    (ApiClient as any).mockImplementation(() => ({
      generateNarration: mockGenerateNarration,
      getSessionHistory: vi.fn(),
    }));

    render(<NarrationPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Ask the DM something...');
    
    fireEvent.change(input, { target: { value: 'What do I see?' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockGenerateNarration).toHaveBeenCalled();
    });
  });
});
