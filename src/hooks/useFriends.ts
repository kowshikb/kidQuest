import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  friendlyUserId: string;
  isOnline: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatarUrl: string;
  fromFriendlyId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

export const useFriends = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setFriendRequests([]);
      setFriendsCount(0);
      setLoading(false);
      return;
    }

    const unsubscribes: Unsubscribe[] = [];

    // Listen to friends with optimized batch fetching
    const friendsQuery = query(
      collection(db, "friendships"),
      where("participants", "array-contains", currentUser.uid),
      where("status", "==", "accepted")
    );

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      try {
        // Fast path: if no friends, set immediately
        if (snapshot.empty) {
          setFriends([]);
          setFriendsCount(0);
          setLoading(false);
          return;
        }

        // Extract all friend IDs first
        const friendIds = snapshot.docs
          .map((docSnap) => {
            const friendship = docSnap.data();
            return friendship.participants.find(
              (id: string) => id !== currentUser.uid
            );
          })
          .filter(Boolean);

        // Set count immediately for fast UI update
        setFriendsCount(friendIds.length);
        setLoading(false);

        // Batch fetch all friend data with timeout
        const fetchPromises = friendIds.map(async (friendId) => {
          try {
            const friendDoc = await Promise.race([
              getDoc(doc(db, "users", friendId)),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 8000)
              ),
            ]);

            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              return {
                id: friendId,
                username: friendData.username || "Unknown",
                avatarUrl: friendData.avatarUrl || "/default-avatar.png",
                friendlyUserId: friendData.friendlyUserId || friendId,
                isOnline: friendData.isOnline || false,
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch friend ${friendId}:`, error);
            // Return minimal friend data as fallback
            return {
              id: friendId,
              username: "Unknown Friend",
              avatarUrl: "/default-avatar.png",
              friendlyUserId: friendId,
              isOnline: false,
            };
          }
          return null;
        });

        // Process results as they come in
        const friendsData = (await Promise.allSettled(fetchPromises))
          .map((result) =>
            result.status === "fulfilled" ? result.value : null
          )
          .filter(Boolean) as Friend[];

        setFriends(friendsData);
      } catch (error) {
        console.error("Error in friends subscription:", error);
        setFriendsCount(0);
        setFriends([]);
        setLoading(false);
      }
    });

    unsubscribes.push(unsubscribeFriends);

    // Listen to friend requests with timeout
    const requestsQuery = query(
      collection(db, "friendRequests"),
      where("toUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      try {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FriendRequest[];

        setFriendRequests(requestsData);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        setFriendRequests([]);
      }
    });

    unsubscribes.push(unsubscribeRequests);

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser]);

  return {
    friends,
    friendRequests,
    friendsCount,
    loading,
  };
};
