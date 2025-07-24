import type { User, Conversation, Message, PersonalInfoOption, Transaction, Visitor } from '@/types';
import { Atom, Beer, Cigarette, Dumbbell, Ghost, GraduationCap, Heart, Sparkles, Smile } from 'lucide-react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

let mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'NightWhisper',
    email: 'nightwhisper@example.com',
    isAnonymous: false,
    age: 28,
    dob: new Date('1996-05-15').toISOString(),
    gender: 'male',
    bio: 'Software engineer by day, adventurer by weekend. Looking for someone to join me on my next journey. I enjoy hiking, photography, and trying new craft beers.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Hiking', 'Photography', 'Craft Beer', 'Traveling', 'Sci-Fi Movies'],
    isCertified: true,
    coins: 250,
    followers: ['user-2', 'user-4', 'user-7'],
    following: ['user-2', 'user-3', 'user-4', 'user-5'],
    visitors: [
      { userId: 'user-2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { userId: 'user-4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
      { userId: 'user-8', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
    ],
    country: 'Kenya',
    exercise: 'Sometimes',
    education: 'Bachelor\'s Degree',
    smoking: 'Non-smoker',
    liquor: 'Socially',
    superpower: 'Invisibility',
    pets: 'Dog Person',
    personalityType: 'INTJ',
    horoscope: 'Taurus',
  },
  {
    id: 'user-2',
    name: 'Bella',
    email: 'bella@example.com',
    isAnonymous: false,
    age: 26,
    dob: new Date('1998-03-20').toISOString(),
    gender: 'female',
    bio: 'Artist and dog lover. My perfect date involves a walk in the park with my golden retriever, Leo, followed by a cozy night in with a good movie.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Painting', 'Dogs', 'Yoga', 'Indie Music', 'Thrift Shopping'],
    isCertified: true,
    coins: 1000,
    followers: ['user-1', 'user-3', 'user-8'],
    following: ['user-1', 'user-8'],
    visitors: [
      { userId: 'user-1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { userId: 'user-3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ],
    country: 'United States of America',
    exercise: 'Frequently',
    education: 'Master\'s Degree',
    smoking: 'Non-smoker',
    liquor: 'Rarely',
    superpower: 'Flying',
    pets: 'Dog Person',
    personalityType: 'ENFP',
    horoscope: 'Aries',
  },
  {
    id: 'user-3',
    name: 'Charlie',
    email: 'charlie@example.com',
    isAnonymous: false,
    age: 31,
    dob: new Date('1993-08-10').toISOString(),
    gender: 'male',
    bio: 'Chef with a passion for Italian cuisine. I can make you the best pasta you\'ve ever had. Seeking a fellow foodie to explore the city\'s culinary scene.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Cooking', 'Wine Tasting', 'Jazz Music', 'Cycling', 'History'],
    isCertified: false,
    coins: 150,
    followers: ['user-2'],
    following: ['user-2'],
    visitors: [],
    country: 'Italy',
    exercise: 'Rarely',
    education: 'Some College',
    smoking: 'Smoker',
    liquor: 'Frequently',
    superpower: 'Super strength',
    pets: 'Neither',
    personalityType: 'ESTP',
    horoscope: 'Leo',
  },
  {
    id: 'user-4',
    name: 'Diana',
    email: 'diana@example.com',
    isAnonymous: false,
    age: 29,
    dob: new Date('1995-11-25').toISOString(),
    gender: 'female',
    bio: 'Fitness enthusiast and personal trainer. I believe in a healthy body and a healthy mind. Let\'s hit the gym together or go for a run!',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Weightlifting', 'Running', 'Meal Prep', 'Podcasts', 'Beach Days'],
    isCertified: true,
    coins: 200,
    followers: ['user-1'],
    following: ['user-1'],
    visitors: [],
    country: 'Australia',
    exercise: 'Frequently',
    education: 'Associate Degree',
    smoking: 'Non-smoker',
    liquor: 'Sober',
    superpower: 'Teleportation',
    pets: 'Both',
    personalityType: 'ESTJ',
    horoscope: 'Sagittarius',
  },
  {
    id: 'user-5',
    name: 'Ethan',
    email: 'ethan@example.com',
    isAnonymous: false,
    age: 27,
    dob: new Date('1997-02-12').toISOString(),
    gender: 'male',
    bio: 'Musician and coffee aficionado. You can usually find me at a local coffee shop with my guitar, writing songs. Looking for my muse.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Guitar', 'Songwriting', 'Coffee', 'Live Music', 'Philosophy'],
    isCertified: false,
    coins: 500,
    followers: [],
    following: ['user-1'],
    visitors: [],
    country: 'Canada',
    exercise: 'Sometimes',
    education: 'High School',
    smoking: 'Social smoker',
    liquor: 'Socially',
    superpower: 'Time travel',
    pets: 'Cat Person',
    personalityType: 'INFP',
    horoscope: 'Aquarius',
  },
  {
    id: 'user-6',
    name: 'Fiona',
    email: 'fiona@example.com',
    isAnonymous: false,
    age: 25,
    dob: new Date('1999-07-01').toISOString(),
    gender: 'female',
    bio: 'Bookworm and aspiring novelist. I love getting lost in a good story. Tell me about the last book you read and couldn\'t put down.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Reading', 'Creative Writing', 'Cats', 'Tea', 'Museums'],
    isCertified: false,
    coins: 50,
    followers: [],
    following: [],
    visitors: [],
    country: 'United Kingdom',
    exercise: 'Rarely',
    education: 'Master\'s Degree',
    smoking: 'Non-smoker',
    liquor: 'Rarely',
    superpower: 'Invisibility',
    pets: 'Cat Person',
    personalityType: 'INFJ',
    horoscope: 'Cancer',
  },
  {
    id: 'user-7',
    name: 'George',
    email: 'george@example.com',
    isAnonymous: false,
    age: 35,
    dob: new Date('1989-09-05').toISOString(),
    gender: 'male',
    bio: 'Travel blogger who has been to 30 countries and counting. My goal is to see the world. Join me?',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Traveling', 'Blogging', 'Photography', 'Culture', 'Food'],
    isCertified: true,
    coins: 1200,
    followers: ['user-1'],
    following: [],
    visitors: [],
    country: 'Germany',
    exercise: 'Sometimes',
    education: 'PhD',
    smoking: 'Non-smoker',
    liquor: 'Socially',
    superpower: 'Flying',
    pets: 'Neither',
    personalityType: 'ENTJ',
    horoscope: 'Virgo',
  },
  {
    id: 'user-8',
    name: 'Hannah',
    email: 'hannah@example.com',
    isAnonymous: false,
    age: 22,
    dob: new Date('2002-01-30').toISOString(),
    gender: 'female',
    bio: 'University student studying graphic design. I\'m passionate about all things creative. Let\'s make something beautiful together.',
    profilePicture: 'https://placehold.co/400x400.png',
    interests: ['Graphic Design', 'Art', 'Video Games', 'Anime', 'K-Pop'],
    isCertified: false,
    coins: 80,
    followers: ['user-2'],
    following: ['user-2'],
    visitors: [],
    country: 'South Korea',
    exercise: 'Sometimes',
    education: 'Some College',
    smoking: 'Non-smoker',
    liquor: 'Socially',
    superpower: 'Teleportation',
    pets: 'Have other pets',
    personalityType: 'ISFP',
    horoscope: 'Aquarius',
  },
];


// Use a function to get the current user, prioritizing localStorage
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  }
  return null;
}

// Use a function to set the current user in localStorage
export function setCurrentUser(user: User | null) {
    if (typeof window !== 'undefined') {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
}

export const users: User[] = mockUsers;

const messages: Message[] = [
    { id: 'msg-1', senderId: 'user-2', text: 'Hey! I saw you like hiking. Me too!', timestamp: new Date(Date.now() - 1000 * 60 * 5), type: 'text', content: 'Hey! I saw you like hiking. Me too!' },
    { id: 'msg-2', senderId: 'user-1', text: 'Awesome! We should totally go sometime. Any favorite trails?', timestamp: new Date(Date.now() - 1000 * 60 * 4), type: 'text', content: 'Awesome! We should totally go sometime. Any favorite trails?' },
    { id: 'msg-3', senderId: 'user-3', text: 'Hi there! Your bio is intriguing.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'text', content: 'Hi there! Your bio is intriguing.' },
    { id: 'msg-4', senderId: 'user-4', text: 'That gym picture on your profile is impressive!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), type: 'text', content: 'That gym picture on your profile is impressive!' },
    { id: 'msg-5', senderId: 'user-1', text: 'Thanks! I try to stay consistent.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000*60*5), type: 'text', content: 'Thanks! I try to stay consistent.' },
    { id: 'msg-6', senderId: 'user-8', text: 'I love your art style, Bella!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), type: 'text', content: 'I love your art style, Bella!' },
    { id: 'msg-7', senderId: 'user-2', text: 'Thank you so much, Hannah! :)', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7), type: 'text', content: 'Thank you so much, Hannah! :)' },
];

export const conversations: Conversation[] = [
    {
        id: 'convo-1',
        participantIds: ['user-1', 'user-2'],
        participants: [users.find(u => u.id === 'user-1')!, users.find(u => u.id === 'user-2')!],
        messages: [messages[0], messages[1]],
    },
    {
        id: 'convo-2',
        participantIds: ['user-1', 'user-3'],
        participants: [users.find(u => u.id === 'user-1')!, users.find(u => u.id === 'user-3')!],
        messages: [messages[2]],
    },
     {
        id: 'convo-3',
        participantIds: ['user-1', 'user-4'],
        participants: [users.find(u => u.id === 'user-1')!, users.find(u => u.id === 'user-4')!],
        messages: [messages[3], messages[4]],
    },
     {
        id: 'convo-4',
        participantIds: ['user-2', 'user-8'],
        participants: [users.find(u => u.id === 'user-2')!, users.find(u => u.id === 'user-8')!],
        messages: [messages[5], messages[6]],
    },
];

// This is a mock, in a real app this would be a firestore collection
let mockTransactions: Transaction[] = [
    { id: 'txn-1', userId: 'user-1', type: 'purchase', amount: 500, description: 'Coin package purchase', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { id: 'txn-2', userId: 'user-1', type: 'spent', amount: 10, description: 'Message to @Bella', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
    { id: 'txn-3', userId: 'user-1', type: 'spent', amount: 50, description: 'Voice call with @Diana', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'txn-4', userId: 'user-1', type: 'purchase', amount: 1000, description: 'Coin package purchase', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
];


export async function getUserById(id: string): Promise<User | null> {
    try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as User;
        } else {
            console.log(`User ${id} not found in Firestore.`);
            // Fallback to local data if not in Firestore, useful for dev/demo
            const localUser = mockUsers.find(user => user.id === id);
            if (localUser) return localUser;
        }
    } catch (error) {
        console.error("Error fetching user from Firestore:", error);
        // If firestore fails (e.g., offline), fallback to local data
        const localUser = mockUsers.find(user => user.id === id);
        if (localUser) return localUser;
    }
    return null;
}

export async function getDiscoverProfiles(): Promise<User[]> {
    const currentUser = getCurrentUser();
    
    // In a real app, you'd have more complex discovery logic.
    // Here we just get all users and filter them.
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection); // Get all users
    const querySnapshot = await getDocs(q);
    const allUsers: User[] = [];
    querySnapshot.forEach((doc) => {
        allUsers.push(doc.data() as User);
    });

    // Fallback to mock data if firestore is empty
    if (allUsers.length === 0) {
        allUsers.push(...mockUsers);
    }
    
    if (!currentUser) {
        return allUsers; // Return all if no user is logged in
    }

    // Filter out the current user first
    const otherUsers = allUsers.filter(user => user.id !== currentUser.id);

    // Then, filter by opposite gender
    if (currentUser.gender === 'male') {
        return otherUsers.filter(user => user.gender === 'female');
    } else if (currentUser.gender === 'female') {
        return otherUsers.filter(user => user.gender === 'male');
    }
    
    return [];
}

export function getConversationsForUser(userId: string): Conversation[] {
    return conversations.filter(convo => convo.participantIds.includes(userId));
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
    const convo = conversations.find(convo => convo.id === id);
    if(convo) {
        const participants = await Promise.all(convo.participantIds.map(id => getUserById(id)));
        convo.participants = participants.filter(p => p !== null) as User[];
    }
    return convo;
}


export async function createUserInFirestore(userData: User) {
    const userRef = doc(db, 'users', userData.id);
    const { ...dataToSave } = userData;

    // Ensure arrays are initialized
    if (!Array.isArray(dataToSave.followers)) {
        dataToSave.followers = [];
    }
     if (!Array.isArray(dataToSave.following)) {
        dataToSave.following = [];
    }
     if (!Array.isArray(dataToSave.visitors)) {
        dataToSave.visitors = [];
    }

    await setDoc(userRef, dataToSave, { merge: true });
}

export const personalInfoOptions: PersonalInfoOption[] = [
    {
      key: 'exercise',
      label: 'Exercise',
      icon: Dumbbell,
      options: ['Frequently', 'Sometimes', 'Rarely', 'Never'],
    },
    {
      key: 'education',
      label: 'Education',
      icon: GraduationCap,
      options: ['High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'],
    },
    {
      key: 'smoking',
      label: 'Smoking',
      icon: Cigarette,
      options: ['Smoker', 'Social smoker', 'Non-smoker', 'Trying to quit'],
    },
    {
      key: 'liquor',
      label: 'Liquor',
      icon: Beer,
      options: ['Frequently', 'Socially', 'Rarely', 'Sober'],
    },
    {
      key: 'superpower',
      label: 'Superpower',
      icon: Sparkles,
      options: ['Flying', 'Invisibility', 'Super strength', 'Teleportation', 'Time travel'],
    },
    {
      key: 'pets',
      label: 'Pets',
      icon: Ghost,
      options: ['Dog Person', 'Cat Person', 'Both', 'Neither', 'Have other pets'],
    },
    {
      key: 'personalityType',
      label: 'Personality type',
      icon: Smile,
      options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
    },
    {
      key: 'horoscope',
      label: 'Horoscopes',
      icon: Atom,
      options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    },
  ];

  export const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua new Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];

  export function getTransactionsForUser(userId: string): Transaction[] {
    // In a real app, this would filter transactions based on the userId from firestore
    return mockTransactions.filter(tx => tx.userId === userId);
  }

  export async function addTransaction(data: Omit<Transaction, 'id' | 'timestamp'>) {
      const newTransaction: Transaction = {
          ...data,
          id: `txn-${Date.now()}`,
          timestamp: new Date().toISOString(),
      };
      // In a real app, this would be saved to a 'transactions' collection in Firestore
      mockTransactions.push(newTransaction);
      console.log('Transaction added:', newTransaction);
      return newTransaction;
  }

export async function followUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Add target to current user's following list
    await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
    });
    // Add current user to target's followers list
    await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId)
    });

    // Mock data update
    const currentUserIndex = mockUsers.findIndex(u => u.id === currentUserId);
    const targetUserIndex = mockUsers.findIndex(u => u.id === targetUserId);
    if (currentUserIndex !== -1 && !mockUsers[currentUserIndex].following.includes(targetUserId)) {
        mockUsers[currentUserIndex].following.push(targetUserId);
    }
    if (targetUserIndex !== -1 && !mockUsers[targetUserIndex].followers.includes(currentUserId)) {
        mockUsers[targetUserIndex].followers.push(currentUserId);
    }
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Remove target from current user's following list
    await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
    });
    // Remove current user from target's followers list
    await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId)
    });

    // Mock data update
     const currentUserIndex = mockUsers.findIndex(u => u.id === currentUserId);
    const targetUserIndex = mockUsers.findIndex(u => u.id === targetUserId);
    if (currentUserIndex !== -1) {
        mockUsers[currentUserIndex].following = mockUsers[currentUserIndex].following.filter(id => id !== targetUserId);
    }
    if (targetUserIndex !== -1) {
        mockUsers[targetUserIndex].followers = mockUsers[targetUserIndex].followers.filter(id => id !== currentUserId);
    }
}

export async function addVisitor(profileOwnerId: string, visitorId: string) {
    if (profileOwnerId === visitorId) return; // Don't track self-visits

    const profileOwnerRef = doc(db, 'users', profileOwnerId);
    
    // First, get the current user data to manipulate the array
    const userSnap = await getDoc(profileOwnerRef);
    if (!userSnap.exists()) {
        console.error("Profile owner not found for adding a visitor");
        return;
    }

    const userData = userSnap.data() as User;
    const visitors = userData.visitors || [];

    // Remove previous visit from the same user to keep the list unique
    const filteredVisitors = visitors.filter(v => v.userId !== visitorId);

    const newVisitor: Visitor = {
        userId: visitorId,
        timestamp: new Date().toISOString(),
    };

    // Add the new visit to the front of the array
    const updatedVisitors = [newVisitor, ...filteredVisitors];
    
    await updateDoc(profileOwnerRef, {
        visitors: updatedVisitors
    });
    
    // Also update mock data
    const profileOwnerIndex = mockUsers.findIndex(u => u.id === profileOwnerId);
    if (profileOwnerIndex !== -1) {
        const mockVisitors = mockUsers[profileOwnerIndex].visitors || [];
        const filteredMockVisitors = mockVisitors.filter(v => v.userId !== visitorId);
        mockUsers[profileOwnerIndex].visitors = [newVisitor, ...filteredMockVisitors];
    }
}
