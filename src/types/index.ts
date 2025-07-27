
import type { Timestamp } from 'firebase/firestore';

export type Visitor = {
  userId: string;
  timestamp: string; // ISO 8601 date string
};

export type User = {
  id: string;
  name: string;
  email: string;
  isAnonymous: boolean;
  age: number;
  dob: string; // ISO 8601 date string
  gender: 'male' | 'female' | 'other';
  bio: string;
  profilePicture: string;
  interests: string[];
  isCertified: boolean;
  coins: number;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  visitors: Visitor[];
  blockedUsers?: string[]; // Array of user IDs
  country?: string;
  exercise?: string;
  education?: string;
  smoking?: string;
  liquor?: string;
  superpower?: string;
  pets?: string;
  personalityType?: string;
  horoscope?: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp; // Keep as Timestamp for Firestore
  type: 'text' | 'image' | 'voice';
  content: string; 
  readBy: string[]; // Array of user IDs who have read the message
};

export type Conversation = {
  id: string;
  participantIds: string[];
  participants: User[];
  messages: Message[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
};

export type Call = {
  id: string;
  from: string; // callerId
  to: string;   // receiverId
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'timeout';
  timestamp: Timestamp;
};


export type PersonalInfoOption = {
    key: keyof User;
    label: string;
    icon: React.ElementType;
    options: string[];
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'purchase' | 'spent';
  amount: number;
  description: string;
  timestamp: string; // ISO 8601 date string
};
