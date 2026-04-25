/** Author: Chitron Bhattacharjee **/

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  photoURL?: string;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mediaUrl?: string; // ImageKit URL
  mediaType?: 'image' | 'video';
  createdAt: number;
}

export interface Story {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string;
  createdAt: number;
  expiresAt: number;
}

export interface SignalMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  reply?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIKnowledgeShard {
  id: string;
  content: string;
  source: string;
  createdAt: number;
}

export interface SiteSettings {
  geminiKey: string;
  profilePhoto: string;
  coverPhoto: string;
  telegramBotToken: string;
  telegramAdminId: string;
  mfaSecret?: string;
  mfaEnabled?: boolean;
}
