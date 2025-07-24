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
  visitors: number;
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
