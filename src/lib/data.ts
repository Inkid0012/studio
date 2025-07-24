import type { User, Conversation, Message } from '@/types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex',
  age: 28,
  gender: 'male',
  bio: 'Software engineer by day, adventurer by weekend. Looking for someone to join me on my next journey. I enjoy hiking, photography, and trying new craft beers.',
  profilePicture: 'https://placehold.co/400x400.png',
  interests: ['Hiking', 'Photography', 'Craft Beer', 'Traveling', 'Sci-Fi Movies'],
  isCertified: true,
  coins: 250,
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Bella',
    age: 26,
    gender: 'female',
    bio: 'Artist and dog lover. My perfect date involves a walk in the park with my golden retriever, Leo, followed by a cozy night in with a good movie.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Painting', 'Dogs', 'Yoga', 'Indie Music', 'Thrift Shopping'],
    isCertified: true,
    coins: 0,
  },
  {
    id: 'user-3',
    name: 'Charlie',
    age: 31,
    gender: 'male',
    bio: 'Chef with a passion for Italian cuisine. I can make you the best pasta you\'ve ever had. Seeking a fellow foodie to explore the city\'s culinary scene.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Cooking', 'Wine Tasting', 'Jazz Music', 'Cycling', 'History'],
    isCertified: false,
    coins: 150,
  },
  {
    id: 'user-4',
    name: 'Diana',
    age: 29,
    gender: 'female',
    bio: 'Fitness enthusiast and personal trainer. I believe in a healthy body and a healthy mind. Let\'s hit the gym together or go for a run!',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Weightlifting', 'Running', 'Meal Prep', 'Podcasts', 'Beach Days'],
    isCertified: true,
    coins: 0,
  },
    {
    id: 'user-5',
    name: 'Ethan',
    age: 27,
    gender: 'male',
    bio: 'Musician and coffee aficionado. You can usually find me at a local coffee shop with my guitar, writing songs. Looking for my muse.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Guitar', 'Songwriting', 'Coffee', 'Live Music', 'Philosophy'],
    isCertified: false,
    coins: 500,
  },
  {
    id: 'user-6',
    name: 'Fiona',
    age: 25,
    gender: 'female',
    bio: 'Bookworm and aspiring novelist. I love getting lost in a good story. Tell me about the last book you read and couldn\'t put down.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Reading', 'Creative Writing', 'Cats', 'Tea', 'Museums'],
    isCertified: false,
    coins: 0,
  },
];

const messages: Message[] = [
    { id: 'msg-1', senderId: 'user-2', text: 'Hey! I saw you like hiking. Me too!', timestamp: new Date(Date.now() - 1000 * 60 * 5), type: 'text', content: 'Hey! I saw you like hiking. Me too!' },
    { id: 'msg-2', senderId: 'user-1', text: 'Awesome! We should totally go sometime. Any favorite trails?', timestamp: new Date(Date.now() - 1000 * 60 * 4), type: 'text', content: 'Awesome! We should totally go sometime. Any favorite trails?' },
    { id: 'msg-3', senderId: 'user-3', text: 'Hi there! Your bio is intriguing.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'text', content: 'Hi there! Your bio is intriguing.' },
];

export const conversations: Conversation[] = [
    {
        id: 'convo-1',
        participantIds: ['user-1', 'user-2'],
        participants: [currentUser, users.find(u => u.id === 'user-2')!],
        messages: [messages[0], messages[1]],
    },
    {
        id: 'convo-2',
        participantIds: ['user-1', 'user-3'],
        participants: [currentUser, users.find(u => u.id === 'user-3')!],
        messages: [messages[2]],
    },
];

export function getUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
}

export function getDiscoverProfiles(): User[] {
    return users.filter(user => user.id !== currentUser.id);
}

export function getConversationsForUser(userId: string): Conversation[] {
    return conversations.filter(convo => convo.participantIds.includes(userId));
}

export function getConversationById(id: string): Conversation | undefined {
    return conversations.find(convo => convo.id === id);
}
