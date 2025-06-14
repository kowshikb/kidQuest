import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Check, 
  X, 
  Users, 
  UserMinus,
  UserCheck,
  Search,
  MessagesSquare
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { useModal } from '../contexts/ModalContext';
import { useNavigate } from 'react-router-dom';

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername?: string;
  fromAvatarUrl?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
}

const FriendsPage: React.FC = () => {
  const { currentUser, userProfile, addFriend, removeFriend } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const navigate = useNavigate();
  
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendId, setFriendId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch friend requests
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchFriendRequests = async () => {
      try {
        const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
        const q = query(
          requestsRef,
          where('toUserId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const requests: FriendRequest[] = [];
          
          for (const docSnap of snapshot.docs) {
            const requestData = docSnap.data() as FriendRequest;
            
            // Fetch sender info
            try {
              const senderRef = doc(db, `${getBasePath()}/users/${requestData.fromUserId}`);
              const senderSnap = await getDoc(senderRef);
              
              if (senderSnap.exists()) {
                const senderData = senderSnap.data();
                requests.push({
                  id: docSnap.id,
                  ...requestData,
                  fromUsername: senderData.username,
                  fromAvatarUrl: senderData.avatarUrl
                });
              } else {
                requests.push({
                  id: docSnap.id,
                  ...requestData,
                  fromUsername: 'Unknown User'
                });
              }
            } catch (error) {
              console.error("Error fetching sender data:", error);
              requests.push({
                id: docSnap.id,
                ...requestData,
                fromUsername: 'Unknown User'
              });
            }
          }
          
          setFriendRequests(requests);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        showModal({
          title: "Friend Request Error",
          message: "We couldn't load your friend requests. Try again later!",
          type: "error"
        });
      }
    };
    
    const unsubscribe = fetchFriendRequests();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(fn => fn());
      }
    };
  }, [currentUser]);

  // Fetch friends list
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    const fetchFriends = async () => {
      try {
        setLoading(true);
        
        if (!userProfile.friendsList || userProfile.friendsList.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }
        
        const friendsList: Friend[] = [];
        
        for (const friendId of userProfile.friendsList) {
          try {
            const friendRef = doc(db, `${getBasePath()}/users/${friendId}`);
            const friendSnap = await getDoc(friendRef);
            
            if (friendSnap.exists()) {
              const friendData = friendSnap.data();
              
              // Check if user has updated their profile recently (last 5 minutes)
              const isOnline = friendData.lastActive ? 
                (Date.now() - friendData.lastActive) < 5 * 60 * 1000 : 
                false;
              
              friendsList.push({
                id: friendId,
                username: friendData.username,
                avatarUrl: friendData.avatarUrl,
                isOnline
              });
            }
          } catch (error) {
            console.error("Error fetching friend data:", error);
          }
        }
        
        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
        showModal({
          title: "Friends List Error",
          message: "We couldn't load your friends list. Try again later!",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriends();
    
    // Update user's lastActive status
    const updateLastActive = async () => {
      try {
        const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
        await updateDoc(userRef, {
          lastActive: Date.now()
        });
      } catch (error) {
        console.error("Error updating last active status:", error);
      }
    };
    
    updateLastActive();
    
    // Update last active status periodically
    const interval = setInterval(updateLastActive, 2 * 60 * 1000); // Every 2 minutes
    
    return () => clearInterval(interval);
  }, [currentUser, userProfile]);

  // Send friend request
  const sendFriendRequest = async () => {
    if (!currentUser || !friendId.trim()) return;
    
    // Validate friend ID
    if (friendId.trim() === currentUser.uid) {
      showModal({
        title: "Friend Request Error",
        message: "You can't send a friend request to yourself!",
        type: "warning"
      });
      return;
    }
    
    // Check if already friends
    if (userProfile?.friendsList?.includes(friendId.trim())) {
      showModal({
        title: "Already Friends",
        message: "You're already friends with this user!",
        type: "info"
      });
      return;
    }
    
    try {
      playSound('click');
      
      // Check if user exists
      const userRef = doc(db, `${getBasePath()}/users/${friendId.trim()}`);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        showModal({
          title: "User Not Found",
          message: "We couldn't find a user with that ID. Check the ID and try again!",
          type: "error"
        });
        return;
      }
      
      // Check if request already exists
      const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
      const q = query(
        requestsRef,
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', friendId.trim()),
        where('status', '==', 'pending')
      );
      
      const existingRequests = await getDocs(q);
      
      if (!existingRequests.empty) {
        showModal({
          title: "Request Already Sent",
          message: "You've already sent a friend request to this user!",
          type: "info"
        });
        return;
      }
      
      // Create friend request
      await addDoc(requestsRef, {
        fromUserId: currentUser.uid,
        toUserId: friendId.trim(),
        status: 'pending',
        createdAt: Date.now()
      });
      
      playSound('success');
      
      showModal({
        title: "Friend Request Sent!",
        message: "Your friend request has been sent successfully!",
        type: "success"
      });
      
      setFriendId('');
    } catch (error) {
      console.error("Error sending friend request:", error);
      showModal({
        title: "Friend Request Failed",
        message: "We couldn't send your friend request. Try again later!",
        type: "error"
      });
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!currentUser) return;
    
    try {
      playSound('success');
      
      // Update request status
      const requestRef = doc(db, `${getBasePath()}/friendRequests/${request.id}`);
      await updateDoc(requestRef, {
        status: 'accepted'
      });
      
      // Add each user to the other's friends list
      await addFriend(request.fromUserId);
      
      // Add current user to the sender's friends list
      const senderRef = doc(db, `${getBasePath()}/users/${request.fromUserId}`);
      const senderSnap = await getDoc(senderRef);
      
      if (senderSnap.exists()) {
        const senderData = senderSnap.data();
        const updatedFriendsList = [...(senderData.friendsList || []), currentUser.uid];
        
        await updateDoc(senderRef, {
          friendsList: updatedFriendsList
        });
      }
      
      // Remove request from state
      setFriendRequests(friendRequests.filter(r => r.id !== request.id));
      
      // Add friend to local state
      if (request.fromUsername && request.fromAvatarUrl) {
        setFriends([...friends, {
          id: request.fromUserId,
          username: request.fromUsername,
          avatarUrl: request.fromAvatarUrl,
          isOnline: false
        }]);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showModal({
        title: "Accept Failed",
        message: "We couldn't accept this friend request. Try again later!",
        type: "error"
      });
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (request: FriendRequest) => {
    if (!currentUser) return;
    
    try {
      playSound('click');
      
      // Update request status
      const requestRef = doc(db, `${getBasePath()}/friendRequests/${request.id}`);
      await updateDoc(requestRef, {
        status: 'rejected'
      });
      
      // Remove request from state
      setFriendRequests(friendRequests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      showModal({
        title: "Reject Failed",
        message: "We couldn't reject this friend request. Try again later!",
        type: "error"
      });
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: string) => {
    try {
      playSound('click');
      
      showModal({
        title: "Remove Friend",
        message: "Are you sure you want to remove this friend?",
        type: "warning",
        confirmText: "Remove",
        cancelText: "Cancel",
        onConfirm: async () => {
          await removeFriend(friendId);
          
          // Also remove current user from friend's list
          const friendRef = doc(db, `${getBasePath()}/users/${friendId}`);
          const friendSnap = await getDoc(friendRef);
          
          if (friendSnap.exists() && currentUser) {
            const friendData = friendSnap.data();
            const updatedFriendsList = (friendData.friendsList || []).filter(
              (id: string) => id !== currentUser.uid
            );
            
            await updateDoc(friendRef, {
              friendsList: updatedFriendsList
            });
          }
          
          // Update local state
          setFriends(friends.filter(f => f.id !== friendId));
          
          playSound('success');
        }
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      showModal({
        title: "Remove Failed",
        message: "We couldn't remove this friend. Try again later!",
        type: "error"
      });
    }
  };

  // Invite friend to a room
  const inviteFriendToRoom = async (friendId: string) => {
    if (!currentUser) return;
    
    try {
      playSound('click');
      
      // Create a new room
      const roomsRef = collection(db, `${getBasePath()}/rooms`);
      const newRoom = {
        player1Id: currentUser.uid,
        player2Id: null,
        status: 'waiting',
        createdAt: Date.now(),
        messages: [{
          senderId: 'system',
          text: `${userProfile?.username || 'A player'} created this room and invited their friend.`,
          timestamp: Date.now()
        }],
        currentChallenge: null
      };
      
      const docRef = await addDoc(roomsRef, newRoom);
      
      // Create a notification (friendship request with special type)
      const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
      await addDoc(requestsRef, {
        fromUserId: currentUser.uid,
        toUserId: friendId,
        status: 'pending',
        type: 'room_invitation',
        roomId: docRef.id,
        createdAt: Date.now()
      });
      
      playSound('success');
      
      showModal({
        title: "Invitation Sent!",
        message: "You've invited your friend to join your challenge room!",
        type: "success",
        confirmText: "Go to Room",
        cancelText: "Stay Here",
        onConfirm: () => navigate(`/rooms/${docRef.id}`)
      });
    } catch (error) {
      console.error("Error inviting friend:", error);
      showModal({
        title: "Invitation Failed",
        message: "We couldn't invite your friend. Try again later!",
        type: "error"
      });
    }
  };

  // Filter friends by search term
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Friend Alliance
        </motion.h1>
        <motion.p 
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Connect with other explorers on your journey!
        </motion.p>
      </div>

      {/* Add Friend Section */}
      <motion.div 
        className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-purple-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-purple-900 mb-4">Add a New Friend</h2>
        <p className="text-gray-600 mb-4">Enter your friend's User ID to send them a friend request.</p>
        <div className="flex">
          <input
            type="text"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            placeholder="Enter Friend's User ID"
            className="storybook-input flex-1 rounded-r-none"
          />
          <button
            onClick={sendFriendRequest}
            disabled={!friendId.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-r-full hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-300 flex items-center"
          >
            <UserPlus size={20} className="mr-2" />
            Add
          </button>
        </div>
        {currentUser && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <p className="text-purple-800 text-sm">Your User ID: <span className="font-mono font-medium">{currentUser.uid}</span></p>
            <p className="text-purple-600 text-xs mt-1">Share this with friends so they can add you!</p>
          </div>
        )}
      </motion.div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Friend Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendRequests.map((request) => (
              <motion.div
                key={request.id}
                className="bg-white rounded-xl shadow-md p-4 border-2 border-purple-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    {request.fromAvatarUrl ? (
                      <img 
                        src={request.fromAvatarUrl} 
                        alt={request.fromUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                        {(request.fromUsername || 'U').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900">{request.fromUsername}</h3>
                    <p className="text-sm text-gray-500">User ID: {request.fromUserId}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(request)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
                  >
                    <Check size={18} className="mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center justify-center"
                  >
                    <X size={18} className="mr-2" />
                    Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-900">My Friends</h2>
          
          {/* Search */}
          {friends.length > 0 && (
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="storybook-input w-full pl-10 py-2 text-sm"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-600">Loading your magical friends...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center border-2 border-purple-100">
            <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
              <Users size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">No Friends Yet</h3>
            <p className="text-purple-600 mb-6">Add friends to start building your alliance!</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center border-2 border-purple-100">
            <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
              <Search size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">No Matching Friends</h3>
            <p className="text-purple-600">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-purple-100"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <img 
                          src={friend.avatarUrl} 
                          alt={friend.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-purple-900">{friend.username}</h3>
                      <p className="text-sm text-gray-500 truncate" title={friend.id}>
                        ID: {friend.id}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        friend.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {friend.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => inviteFriendToRoom(friend.id)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center text-sm"
                    >
                      <MessagesSquare size={16} className="mr-2" />
                      Challenge
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center text-sm"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FriendsPage;