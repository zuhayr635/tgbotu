export interface Broadcast {
  id: string;
  title: string;
  message: string;
  status: 'active' | 'completed' | 'pending' | 'failed';
  progress: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  scheduledFor?: string;
  groups: string[];
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  type: 'public' | 'private';
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  category: string;
}

export interface Stats {
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalGroups: number;
  totalMembers: number;
  messagesSent: number;
  successRate: number;
}

export interface BotSettings {
  botToken: string;
  botName: string;
  rateLimit: number;
  autoRetry: boolean;
  retryAttempts: number;
  notificationEmail: string;
  webhookUrl: string;
}

export type Page = 'dashboard' | 'new-broadcast' | 'groups' | 'active' | 'settings';
