export type User = {
  id: string;
  name: string;
  age: number;
  dob: string; // ISO 8601 date string
  gender: 'male' | 'female' | 'other';
  bio: string;
  profilePicture: string;
  interests: string[];
  isCertified: boolean;
  coins: number;
  friends: number;
  following: number;
  followers: number;
  visitors: number;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'voice';
  content: string; 
};

export type Conversation = {
  id: string;
  participantIds: string[];
  participants: User[];
  messages: Message[];
};
