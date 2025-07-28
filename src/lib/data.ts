

import type { User, Conversation, Message, PersonalInfoOption, Transaction, Visitor, Call, Location } from '@/types';
import { Atom, Beer, Cigarette, Dumbbell, Ghost, GraduationCap, Heart, Sparkles, Smile } from 'lucide-react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, orderBy, onSnapshot, Timestamp, limit, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export const CHARGE_COSTS = {
  message: 40,
  call: 150,
};

let mockTransactions: Transaction[] = [];

// Helper to add initial transactions for a user if they don't have any
const seedInitialTransactions = (userId: string) => {
    if (!mockTransactions.some(tx => tx.userId === userId)) {
        mockTransactions.push(
            { id: `txn-1-${userId}`, userId: userId, type: 'purchase', amount: 500, description: 'Welcome coins package', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
            { id: `txn-2-${userId}`, userId: userId, type: 'spent', amount: 40, description: 'Message to @Bella', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
        );
    }
}


export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        seedInitialTransactions(user.id);
        return user;
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
  }
  return null;
}

export function setCurrentUser(user: User | null) {
    if (typeof window !== 'undefined') {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
}

export async function updateUserLocation(userId: string, location: Location) {
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, { location });
        const localUser = getCurrentUser();
        if (localUser && localUser.id === userId) {
            setCurrentUser({ ...localUser, location });
        }
    } catch (error) {
        console.error("Error updating user location:", error);
    }
}

export async function getUserById(id: string): Promise<User | null> {
    try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as User;
        } else {
            console.log(`User ${id} not found in Firestore.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user from Firestore:", error);
        return null;
    }
}

export async function getDiscoverProfiles(currentUserId?: string, forSearch = false): Promise<User[]> {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection);
    const querySnapshot = await getDocs(q);
    let allUsers: User[] = [];
    querySnapshot.forEach((doc) => {
        allUsers.push(doc.data() as User);
    });

    const currentUser = currentUserId ? await getUserById(currentUserId) : null;

    if (currentUser?.blockedUsers && currentUser.blockedUsers.length > 0) {
        allUsers = allUsers.filter(user => !currentUser.blockedUsers?.includes(user.id));
    }
    allUsers = allUsers.filter(user => !user.blockedUsers?.includes(currentUser?.id || ''));


    if (forSearch && currentUserId) {
      return allUsers.filter(user => user.id !== currentUserId);
    }

    let otherUsers = allUsers.filter(user => user.id !== currentUserId);

    if (currentUser && currentUser.gender !== 'other') {
        if (currentUser.gender === 'male') {
            return otherUsers.filter(user => user.gender === 'female');
        } else { // 'female'
            return otherUsers.filter(user => user.gender === 'male');
        }
    }
    
    return otherUsers;
}

export async function getConversationById(id: string): Promise<Conversation | null> {
    try {
        const convoRef = doc(db, 'conversations', id);
        const convoSnap = await getDoc(convoRef);

        if (convoSnap.exists()) {
            const convoData = convoSnap.data();
            const participants = await Promise.all(convoData.participantIds.map((id: string) => getUserById(id)));
            return {
                id: convoSnap.id,
                ...convoData,
                participants: participants.filter(p => p !== null) as User[],
            } as Conversation;
        } else {
            console.warn(`Conversation ${id} not found.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return null;
    }
}

export async function findOrCreateConversation(userId1: string, userId2: string): Promise<string> {
    const conversationsRef = collection(db, "conversations");
    const sortedIds = [userId1, userId2].sort();
    
    const q = query(conversationsRef, where("participantIds", "==", sortedIds), limit(1));
    
    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        } else {
            const newConversationRef = doc(collection(db, 'conversations'));
            await setDoc(newConversationRef, {
                participantIds: sortedIds,
                lastMessage: null,
            });
            return newConversationRef.id;
        }
    } catch(error) {
        console.error("Error finding or creating conversation:", error);
        throw error;
    }
}

export async function sendMessage(conversationId: string, senderId: string, textOrDataUrl: string, type: Message['type'] = 'text'): Promise<void> {
    try {
        await runTransaction(db, async (transaction) => {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationSnap = await transaction.get(conversationRef);

            if (!conversationSnap.exists()) {
                throw new Error("Conversation does not exist!");
            }

            const participantIds = conversationSnap.data().participantIds;
            const otherId = participantIds.find((id: string) => id !== senderId);

            if (!otherId) {
                throw new Error("Other user not found in conversation");
            }
            
            const otherUserRef = doc(db, 'users', otherId);
            const otherUserSnap = await transaction.get(otherUserRef);

            if (!otherUserSnap.exists()) {
                throw new Error("Other user's profile does not exist");
            }

            const otherUser = otherUserSnap.data() as User;
            if (otherUser.blockedUsers?.includes(senderId)) {
                throw new Error("You may have been blocked by this user.");
            }

            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const newMessageRef = doc(messagesRef);

            let content = '';
            let messageText = '';

            switch (type) {
                case 'image':
                    content = textOrDataUrl;
                    messageText = '[Photo]';
                    break;
                case 'text':
                default:
                    content = textOrDataUrl;
                    messageText = textOrDataUrl;
                    break;
            }

            const newMessage: Omit<Message, 'id'> = {
                senderId, 
                text: messageText, 
                type, 
                content,
                timestamp: Timestamp.now(),
                readBy: [senderId],
            };
            
            transaction.set(newMessageRef, newMessage);

            transaction.update(conversationRef, {
                lastMessage: { text: messageText, senderId, timestamp: Timestamp.now() }
            });
        });
    } catch (e: any) {
        console.error("sendMessage transaction failed: ", e);
        throw e; // Re-throw to be handled by the UI
    }
}

export function getMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({ 
                id: doc.id, 
                ...data,
                content: data.content || '',
                readBy: data.readBy || [data.senderId],
            } as Message);
        });
        callback(messages);
    }, (error) => {
        console.error(`Error listening to messages for convo ${conversationId}: `, error);
    });

    return unsubscribe;
}

export async function markMessagesAsRead(conversationId: string, messageIds: string[], userId: string) {
    if (messageIds.length === 0) return;
    const batch = writeBatch(db);
    messageIds.forEach(messageId => {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        batch.update(messageRef, {
            readBy: arrayUnion(userId)
        });
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Failed to mark messages as read:", error);
    }
}


export function getConversationsForUser(userId: string, callback: (conversations: Conversation[]) => void) {
  const conversationsRef = collection(db, "conversations");
  const q = query(conversationsRef, where("participantIds", "array-contains", userId));

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const conversationsPromises = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        if (!data.lastMessage) return null;

        const participants = await Promise.all(
          data.participantIds.map((id: string) => getUserById(id))
        );
        
        const messagesRef = collection(db, 'conversations', docSnap.id, 'messages');
        // Correct query for unread messages: sender is not me, and my ID is not in the readBy array.
        const unreadQuery = query(messagesRef, where('senderId', '!=', userId));
        
        let unreadCount = 0;
        try {
            const unreadSnapshot = await getDocs(unreadQuery);
            // This client-side filter is necessary because Firestore can't do array-not-contains directly
            unreadCount = unreadSnapshot.docs.filter(doc => {
                 const msgData = doc.data();
                 return !msgData.readBy?.includes(userId);
            }).length;

        } catch (e) {
            console.error("Could not query unread messages.", e);
            unreadCount = 0;
        }

        return {
          id: docSnap.id,
          ...data,
          participants: participants.filter((p): p is User => p !== null),
          unreadCount: unreadCount,
        } as Conversation;
    });

    const conversations = (await Promise.all(conversationsPromises))
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.toMillis() || 0;
            const timeB = b.lastMessage?.timestamp?.toMillis() || 0;
            return timeB - timeA;
        });

    callback(conversations);
  }, (error) => {
    console.error(`Error listening to conversations for user ${userId}: `, error);
  });

  return unsubscribe;
}


export async function createUserInFirestore(userData: User) {
    const userRef = doc(db, 'users', userData.id);
    const { ...dataToSave } = userData;

    dataToSave.followers = Array.isArray(dataToSave.followers) ? dataToSave.followers : [];
    dataToSave.following = Array.isArray(dataToSave.following) ? dataToSave.following : [];
    dataToSave.visitors = Array.isArray(dataToSave.visitors) ? dataToSave.visitors : [];
    dataToSave.blockedUsers = Array.isArray(dataToSave.blockedUsers) ? dataToSave.blockedUsers : [];
    dataToSave.interests = Array.isArray(dataToSave.interests) ? dataToSave.interests : [];

    await setDoc(userRef, dataToSave, { merge: true });
}

export const personalInfoOptions: PersonalInfoOption[] = [
    { key: 'exercise', label: 'Exercise', icon: Dumbbell, options: ['Frequently', 'Sometimes', 'Rarely', 'Never'] },
    { key: 'education', label: 'Education', icon: GraduationCap, options: ['High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] },
    { key: 'smoking', label: 'Smoking', icon: Cigarette, options: ['Smoker', 'Social smoker', 'Non-smoker', 'Trying to quit'] },
    { key: 'liquor', label: 'Liquor', icon: Beer, options: ['Frequently', 'Socially', 'Rarely', 'Sober'] },
    { key: 'superpower', label: 'Superpower', icon: Sparkles, options: ['Flying', 'Invisibility', 'Super strength', 'Teleportation', 'Time travel'] },
    { key: 'pets', label: 'Pets', icon: Ghost, options: ['Dog Person', 'Cat Person', 'Both', 'Neither', 'Have other pets'] },
    { key: 'personalityType', label: 'Personality type', icon: Smile, options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] },
    { key: 'horoscope', label: 'Horoscopes', icon: Atom, options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
];

export const countries = [ "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua new Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe" ];

export function getTransactionsForUser(userId: string): Transaction[] {
    return mockTransactions.filter(tx => tx.userId === userId);
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'timestamp'>) {
    const newTransaction: Transaction = {
        ...data,
        id: `txn-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    mockTransactions.push(newTransaction);
    return newTransaction;
}

export async function followUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const batch = writeBatch(db);
    batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
    batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
    await batch.commit();
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const batch = writeBatch(db);
    batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
    batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
    await batch.commit();
}

export async function blockUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(targetUserId)
    });
    await unfollowUser(currentUserId, targetUserId).catch(e => console.error("Error unfollowing after block:", e));
    await unfollowUser(targetUserId, currentUserId).catch(e => console.error("Error unfollowing after block (reverse):", e));
}

export async function unblockUser(currentUserId: string, targetUserId: string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(targetUserId)
    });
}

export async function addVisitor(profileOwnerId: string, visitorId: string) {
    if (profileOwnerId === visitorId) return;
    const profileOwnerRef = doc(db, 'users', profileOwnerId);
    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(profileOwnerRef);
        if (!userSnap.exists()) {
            throw "Profile owner not found";
        }
        const userData = userSnap.data() as User;
        const visitors = userData.visitors || [];
        const filteredVisitors = visitors.filter(v => v.userId !== visitorId);
        const newVisitor: Visitor = { userId: visitorId, timestamp: new Date().toISOString() };
        const updatedVisitors = [newVisitor, ...filteredVisitors].slice(0, 50);
        transaction.update(profileOwnerRef, { visitors: updatedVisitors });
      });
    } catch (error) {
        console.error("Failed to add visitor:", error);
    }
}

export async function startCall(from: string, to: string): Promise<string | null> {
    try {
        const callId = await runTransaction(db, async (transaction) => {
            const fromUserRef = doc(db, 'users', from);
            const toUserRef = doc(db, 'users', to);

            const fromUserDoc = await transaction.get(fromUserRef);
            const toUserDoc = await transaction.get(toUserRef);

            if (!fromUserDoc.exists() || !toUserDoc.exists()) {
                throw new Error("One or both users do not exist.");
            }

            const fromUserData = fromUserDoc.data() as User;
            const toUserData = toUserDoc.data() as User;

            if (toUserData.blockedUsers?.includes(from)) {
                throw new Error("Cannot start call: You are blocked by this user.");
            }
             if (fromUserData.blockedUsers?.includes(to)) {
                throw new Error("Cannot start call: You have blocked this user.");
            }

            if (fromUserData.gender === 'male') {
                if (fromUserData.coins < CHARGE_COSTS.call) {
                    throw new Error("Insufficient coins.");
                }
            }
            
            const newCallRef = doc(collection(db, 'calls'));
            transaction.set(newCallRef, {
                from, to, status: 'ringing', timestamp: serverTimestamp(),
            });
            return newCallRef.id;
        });

        return callId;
    } catch (e: any) {
        console.error("Error starting call:", e);
        // We can pass the error message to the UI if we want
        throw e;
    }
}

export async function updateCallStatus(callId: string, status: Call['status']) {
    try {
        const callRef = doc(db, 'calls', callId);
        await updateDoc(callRef, { status });
    } catch (e) {
        console.error(`Failed to update call ${callId} to status ${status}:`, e);
    }
}

export function onCallUpdate(callId: string, callback: (call: Call | null) => void) {
    const callRef = doc(db, 'calls', callId);
    const unsubscribe = onSnapshot(callRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Call);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to call updates:", error);
    });
    return unsubscribe;
}

export function onIncomingCall(userId: string, callback: (call: Call) => void) {
    const callsRef = collection(db, "calls");
    const q = query(
        callsRef, 
        where("to", "==", userId), 
        where("status", "==", "ringing"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const callData = { id: change.doc.id, ...change.doc.data() } as Call;
                callback(callData);
            }
        });
    }, (error) => {
        console.error("Error listening for incoming calls:", error);
    });

    return unsubscribe;
}

// Helper function to calculate distance between two points (Haversine formula)
export function getDistance(loc1: Location, loc2: Location) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}
