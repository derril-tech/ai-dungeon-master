export enum SessionStatus {
  CREATED = 'created',
  STAGING = 'staging',
  EXPLORING = 'exploring',
  ENCOUNTER = 'encounter',
  COMBAT = 'combat',
  DOWNTIME = 'downtime',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SessionEvent {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  END = 'end',
  ENCOUNTER_START = 'encounter_start',
  ENCOUNTER_END = 'encounter_end',
  COMBAT_START = 'combat_start',
  COMBAT_END = 'combat_end',
  DOWNTIME_START = 'downtime_start',
  DOWNTIME_END = 'downtime_end'
}

export interface Session {
  id: string;
  campaignId: string;
  status: SessionStatus;
  startedAt?: string;
  endedAt?: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  campaignId: string;
  settings?: Record<string, any>;
}

export interface SessionStateTransition {
  event: SessionEvent;
  data?: Record<string, any>;
}
