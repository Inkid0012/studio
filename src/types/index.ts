export type User = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bio: string;
  profilePicture: string;
  interests: string[];
  isCertified: boolean;
  coins: number;
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
