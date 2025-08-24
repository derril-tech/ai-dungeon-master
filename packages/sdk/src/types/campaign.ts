export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  ruleset: string;
  tone: Record<string, any>;
  difficulty: string;
  worldSeed?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  ruleset?: string;
  tone?: Record<string, any>;
  difficulty?: string;
  worldSeed?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  ruleset?: string;
  tone?: Record<string, any>;
  difficulty?: string;
  worldSeed?: string;
}
