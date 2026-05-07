import type { User } from './auth.types';

export interface GroupMember {
  user: User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface ItineraryItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  datetime?: string;
  createdBy: User;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  inviteCode: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'archived';
  membersCanPin: boolean;
  owner: string;
  members: GroupMember[];
  itinerary: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}
