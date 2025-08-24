import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Campaign, 
  CreateCampaignRequest, 
  UpdateCampaignRequest,
  Session,
  CreateSessionRequest,
  SessionStateTransition
} from '../types';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, token?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }

  // Campaign endpoints
  async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.client.post('/campaigns', data);
    return response.data;
  }

  async getCampaigns(): Promise<Campaign[]> {
    const response: AxiosResponse<Campaign[]> = await this.client.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.client.get(`/campaigns/${id}`);
    return response.data;
  }

  async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.client.put(`/campaigns/${id}`, data);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.client.delete(`/campaigns/${id}`);
  }

  // Session endpoints
  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response: AxiosResponse<Session> = await this.client.post('/sessions', data);
    return response.data;
  }

  async getSessions(campaignId: string): Promise<Session[]> {
    const response: AxiosResponse<Session[]> = await this.client.get(`/sessions/campaign/${campaignId}`);
    return response.data;
  }

  async getSession(id: string): Promise<Session> {
    const response: AxiosResponse<Session> = await this.client.get(`/sessions/${id}`);
    return response.data;
  }

  async transitionSession(id: string, transition: SessionStateTransition): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/sessions/${id}/transition`, transition);
    return response.data;
  }

  async getAvailableEvents(id: string): Promise<string[]> {
    const response: AxiosResponse<{ available_events: string[] }> = await this.client.get(`/sessions/${id}/available-events`);
    return response.data.available_events;
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const response: AxiosResponse = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/auth/me');
    return response.data;
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}
