import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  ArrowLeft,
  Award,
  Clock,
  MessageCircle,
  Copy,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import { Room, UserInfo } from "../types/Room";

const RoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser, userProfile, addCompletedTask } = useAuth();
  const { themes } = useTheme();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [player1Info, setPlayer1Info] = useState<UserInfo | null>(null);
  const [player2Info, setPlayer2Info] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isTaskSelectOpen, setIsTaskSelectOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to room changes
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const roomData = { id: snapshot.id, ...snapshot.data() } as Room;
          setRoom(roomData);

          // Play sound for new messages
          if (roomData.messages && roomData.messages.length > 0) {
            const lastMessage = roomData.messages[roomData.messages.length - 1];
            if (
              lastMessage.senderId !== currentUser.uid &&
              roomData.messages.length > (room?.messages?.length || 0)
            ) {
              playSound("click");
            }
          }

          // Play sound for challenge updates
          if (
            roomData.currentChallenge &&
            room?.currentChallenge?.status !== roomData.currentChallenge.status
          ) {
            if (roomData.currentChallenge.status === "accepted") {
              playSound("success");
            } else if (roomData.currentChallenge.status === "completed") {
              playSound("complete");
            }
          }
        } else {
          showModal({
            title: "Room Not Found",
            message: "This challenge room doesn't exist anymore!",
            type: "error",
            onConfirm: () => navigate("/rooms"),
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to room:", error);
        showModal({
          title: "Connection Error",
          message:
            "We had trouble connecting to the challenge room. Try again!",
          type: "error",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, currentUser, room?.messages?.length]);

  // Fetch player information
  useEffect(() => {
    const fetchPlayerInfo = async () => {
      if (!room || !currentUser) return;

      try {
        // Fetch player 1 info
        if (room.participants && room.participants.length > 0) {
          const player1 = room.participants.find(
            (p) => p.userId === currentUser.uid
          );
          if (player1) {
            setPlayer1Info({
              userId: player1.userId,
              username: player1.username,
              avatarUrl: player1.avatarUrl,
            });
          }
        }

        // Fetch player 2 info if exists
        if (room.participants && room.participants.length > 1) {
          const player2 = room.participants.find(
            (p) => p.userId !== currentUser.uid
          );
          if (player2) {
            setPlayer2Info({
              userId: player2.userId,
              username: player2.username,
              avatarUrl: player2.avatarUrl,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching player info:", error);
      }
    };

    fetchPlayerInfo();
  }, [room, currentUser]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [room?.messages]);

  // Join room if user is not a player
  const joinRoom = async () => {
    if (!roomId || !currentUser || !room) return;

    try {
      playSound("click");

      // Can't join if already full
      if (room.participants.length >= room.maxPlayers) {
        return;
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);

      // Add participant and update current player count
      await updateDoc(roomRef, {
        participants: arrayUnion({
          userId: currentUser.uid,
          username: userProfile?.username || "A new player",
          avatarUrl: userProfile?.avatarUrl || "",
          score: 0,
          joinedAt: Date.now(),
        }),
        currentPlayers: room.participants.length + 1,
      });

      // Add welcome message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${
            userProfile?.username || "A new player"
          } has joined the room!`,
          timestamp: Date.now(),
        }),
      });

      playSound("success");
    } catch (error) {
      console.error("Error joining room:", error);
      showModal({
        title: "Couldn't Join Room",
        message: "We had trouble joining this challenge room. Try again!",
        type: "error",
      });
    }
  };

  // Send a chat message
  const sendMessage = async () => {
    if (!roomId || !currentUser || !room || !message.trim()) return;

    try {
      playSound("click");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: currentUser.uid,
          text: message.trim(),
          timestamp: Date.now(),
        }),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      showModal({
        title: "Message Failed",
        message: "We couldn't send your message. Try again!",
        type: "error",
      });
    }
  };

  // Handle sending emoji reactions
  const sendEmoji = async (emoji: string) => {
    if (!roomId || !currentUser || !room) return;

    try {
      playSound("click");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: currentUser.uid,
          text: emoji,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Error sending emoji:", error);
    }
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    if (!roomId) return;

    navigator.clipboard.writeText(roomId);
    playSound("click");
    showModal({
      title: "Room ID Copied!",
      message:
        "You can now share this with a friend to join your challenge room!",
      type: "success",
    });
  };

  // Challenge the other player
  const challengePlayer = async () => {
    if (!roomId || !currentUser || !room || !selectedTheme || !selectedTask)
      return;

    try {
      playSound("challenge");

      // Determine the other player's ID
      const otherPlayer = room.participants.find(
        (p) => p.userId !== currentUser.uid
      );

      if (!otherPlayer) {
        showModal({
          title: "Challenge Failed",
          message: "There's no one else in the room to challenge!",
          type: "warning",
        });
        return;
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        currentChallenge: {
          themeId: selectedTheme,
          taskId: selectedTask,
          challengerId: currentUser.uid,
          challengedId: otherPlayer.userId,
          status: "pending",
          winnerId: null,
          suggestedAt: Date.now(),
        },
      });

      // Add system message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${
            userProfile?.username || "A player"
          } has suggested a challenge!`,
          timestamp: Date.now(),
        }),
      });

      setIsTaskSelectOpen(false);
      setSelectedTheme(null);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error creating challenge:", error);
      showModal({
        title: "Challenge Failed",
        message: "We couldn't create your challenge. Try again!",
        type: "error",
      });
    }
  };

  // Accept a challenge
  const acceptChallenge = async () => {
    if (!roomId || !currentUser || !room || !room.currentChallenge) return;

    try {
      playSound("click");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        "currentChallenge.status": "accepted",
      });

      // Add system message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${
            userProfile?.username || "A player"
          } has accepted the challenge!`,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Error accepting challenge:", error);
      showModal({
        title: "Accept Failed",
        message: "We couldn't accept this challenge. Try again!",
        type: "error",
      });
    }
  };

  // Reject a challenge
  const rejectChallenge = async () => {
    if (!roomId || !currentUser || !room || !room.currentChallenge) return;

    try {
      playSound("click");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        "currentChallenge.status": "rejected",
      });

      // Add system message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${
            userProfile?.username || "A player"
          } has declined the challenge.`,
          timestamp: Date.now(),
        }),
      });

      // Reset the challenge after a short delay
      setTimeout(async () => {
        await updateDoc(roomRef, {
          currentChallenge: null,
        });
      }, 3000);
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      showModal({
        title: "Reject Failed",
        message: "We couldn't decline this challenge. Try again!",
        type: "error",
      });
    }
  };

  // Complete a challenge
  const completeChallenge = async () => {
    if (!roomId || !currentUser || !room || !room.currentChallenge) return;

    try {
      playSound("complete");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      await updateDoc(roomRef, {
        "currentChallenge.status": "completed",
        "currentChallenge.winnerId": currentUser.uid,
      });

      // Find the task to get coin reward
      const theme = themes.find((t) => t.id === room.currentChallenge?.themeId);
      const task = theme?.tasks.find(
        (t) => t.id === room.currentChallenge?.taskId
      );

      if (task) {
        // Add task to completed tasks and earn coins
        await addCompletedTask(task.id, task.coinReward);

        // Create flying coins animation
        createFlyingCoins(task.coinReward);
      }

      // Add system message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${
            userProfile?.username || "A player"
          } has completed the challenge first and won!`,
          timestamp: Date.now(),
        }),
      });

      // Reset the challenge after a delay
      setTimeout(async () => {
        await updateDoc(roomRef, {
          currentChallenge: null,
        });
      }, 5000);
    } catch (error) {
      console.error("Error completing challenge:", error);
      showModal({
        title: "Completion Failed",
        message: "We couldn't mark this challenge as complete. Try again!",
        type: "error",
      });
    }
  };

  // Create flying coins animation
  const createFlyingCoins = (count: number) => {
    const coinCounter = document.querySelector(".coin-counter");
    if (!coinCounter) return;

    const coinCounterRect = coinCounter.getBoundingClientRect();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const coin = document.createElement("div");
      coin.classList.add("coin");

      // Random starting position
      const startX = Math.random() * 200 - 100;
      const startY = Math.random() * 100 - 50;

      // Calculate target position (coin counter)
      const targetX = coinCounterRect.left + coinCounterRect.width / 2;
      const targetY = coinCounterRect.top + coinCounterRect.height / 2;

      // Set position and animate
      coin.style.left = `calc(50% + ${startX}px)`;
      coin.style.top = `calc(50% + ${startY}px)`;
      coin.style.setProperty(
        "--targetX",
        `${targetX - parseInt(coin.style.left)}px`
      );
      coin.style.setProperty(
        "--targetY",
        `${targetY - parseInt(coin.style.top)}px`
      );

      // Add to DOM
      document.body.appendChild(coin);

      // Remove after animation
      setTimeout(() => {
        coin.remove();
      }, 1000 + i * 100);
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if a message is an emoji-only message
  const isEmojiOnly = (text: string) => {
    const emojiRegex =
      /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}|\p{Emoji_Component})+$/u;
    return emojiRegex.test(text);
  };

  // Get current challenge details
  const getCurrentChallengeDetails = () => {
    if (!room?.currentChallenge) return null;

    const theme = themes.find((t) => t.id === room.currentChallenge?.themeId);
    const task = theme?.tasks.find(
      (t) => t.id === room.currentChallenge?.taskId
    );

    if (!theme || !task) return null;

    const challenger =
      room.currentChallenge.challengerId === room.participants[0].userId
        ? player1Info
        : player2Info;
    const challenged =
      room.currentChallenge.challengedId === room.participants[0].userId
        ? player1Info
        : player2Info;

    return {
      theme,
      task,
      challenger,
      challenged,
      status: room.currentChallenge.status,
      winnerId: room.currentChallenge.winnerId,
    };
  };

  // Check if user is a player in this room
  const isPlayerInRoom = () => {
    if (!currentUser || !room) return false;
    return room.participants.some((p) => p.userId === currentUser.uid);
  };

  // Check if both players are in the room
  const areBothPlayersPresent = () => {
    return room && room.participants && room.participants.length > 1;
  };

  // Handle enter key in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Leave the room
  const leaveRoom = async () => {
    if (!roomId || !currentUser || !room) return;

    try {
      playSound("click");

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);

      // Remove current user from participants
      const updatedParticipants = room.participants.filter(
        (p) => p.userId !== currentUser.uid
      );

      // If no participants left, delete the room
      if (updatedParticipants.length === 0) {
        await updateDoc(roomRef, {
          isActive: false,
          status: "completed",
          participants: [],
          currentPlayers: 0,
        });

        showModal({
          title: "Room Left",
          message:
            "You've left the room. Since it's now empty, it will be cleaned up.",
          type: "success",
          onConfirm: () => navigate("/rooms"),
        });
        return;
      }

      // Update participants and player count
      await updateDoc(roomRef, {
        participants: updatedParticipants,
        currentPlayers: updatedParticipants.length,
      });

      // Add system message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${userProfile?.username || "A player"} has left the room.`,
          timestamp: Date.now(),
        }),
      });

      playSound("success");

      showModal({
        title: "Room Left",
        message: "You've successfully left the challenge room.",
        type: "success",
        onConfirm: () => navigate("/rooms"),
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      showModal({
        title: "Leave Failed",
        message: "We couldn't remove you from this room. Try again!",
        type: "error",
      });
    }
  };

  // Handle browser close/navigation - auto leave room
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomId && currentUser && room && isPlayerInRoom()) {
        // Use navigator.sendBeacon for reliable cleanup on page unload
        const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);

        try {
          // Quick cleanup - remove user from participants
          const updatedParticipants = room.participants.filter(
            (p) => p.userId !== currentUser.uid
          );

          // Send cleanup request
          const cleanupData = {
            participants: updatedParticipants,
            currentPlayers: updatedParticipants.length,
            isActive: updatedParticipants.length > 0,
            status: updatedParticipants.length > 0 ? room.status : "completed",
          };

          // Use fetch with keepalive for better reliability
          fetch(
            `https://firestore.googleapis.com/v1/projects/kidquest-champions/databases/(default)/documents/${getBasePath().replace(
              /^\//,
              ""
            )}/rooms/${roomId}`,
            {
              method: "PATCH",
              keepalive: true,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: Object.fromEntries(
                  Object.entries(cleanupData).map(([key, value]) => [
                    key,
                    typeof value === "number"
                      ? { integerValue: value.toString() }
                      : typeof value === "boolean"
                      ? { booleanValue: value }
                      : Array.isArray(value)
                      ? {
                          arrayValue: {
                            values: value.map((item) => ({
                              mapValue: {
                                fields: Object.fromEntries(
                                  Object.entries(item).map(([k, v]) => [
                                    k,
                                    { stringValue: v.toString() },
                                  ])
                                ),
                              },
                            })),
                          },
                        }
                      : { stringValue: value.toString() },
                  ])
                ),
              }),
            }
          );
        } catch (error) {
          console.error("Error during auto-cleanup:", error);
        }
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      // Cleanup on component unmount
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [roomId, currentUser, room]);

  const challenge = getCurrentChallengeDetails();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-purple-800">
            Opening the magical portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Room Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => {
              playSound("click");
              navigate("/rooms");
            }}
            className="mr-4 p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors duration-300"
            aria-label="Back to rooms"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-purple-900">
              Challenge Room
            </h1>
            <div className="flex items-center text-purple-600">
              <span className="mr-2">Room ID:</span>
              <code className="bg-purple-50 px-2 py-1 rounded text-sm font-mono">
                {roomId}
              </code>
              <button
                onClick={copyRoomId}
                className="ml-2 p-1 text-purple-500 hover:text-purple-700"
                aria-label="Copy Room ID"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Players Status */}
        <div className="hidden md:flex items-center">
          <div className="flex -space-x-2">
            {player1Info && (
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img
                  src={player1Info.avatarUrl}
                  alt={player1Info.username}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {player2Info ? (
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img
                  src={player2Info.avatarUrl}
                  alt={player2Info.username}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 border-2 border-white text-gray-500">
                ?
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-purple-900">
              {player1Info?.username || "Loading..."}
              {player2Info ? ` vs ${player2Info.username}` : " waiting..."}
            </p>
          </div>

          {/* Leave Room Button */}
          {isPlayerInRoom() && (
            <button
              onClick={leaveRoom}
              className="ml-4 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors duration-300"
              aria-label="Leave Room"
              title="Leave Room"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Room Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="bg-purple-50 p-4 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle size={20} className="text-purple-600 mr-2" />
                  <h2 className="font-bold text-purple-900">Chat Room</h2>
                </div>

                {/* Mobile Leave Button */}
                {isPlayerInRoom() && (
                  <button
                    onClick={leaveRoom}
                    className="md:hidden p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors duration-300"
                    aria-label="Leave Room"
                    title="Leave Room"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Join Button (if not in room) */}
            {!isPlayerInRoom() && (
              <div className="p-6 text-center">
                <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-4">
                  <AlertTriangle
                    size={24}
                    className="text-yellow-600 mx-auto mb-2"
                  />
                  <p className="text-yellow-800">
                    You are not a player in this room yet.
                  </p>
                </div>
                <button onClick={joinRoom} className="btn-magic">
                  <span className="flex items-center justify-center">
                    <Users size={18} className="mr-2" />
                    Join This Room
                  </span>
                </button>
              </div>
            )}

            {/* Chat Messages */}
            {isPlayerInRoom() && (
              <>
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4"
                >
                  {room?.messages && room.messages.length > 0 ? (
                    <div className="space-y-4">
                      {room.messages.map((msg, index) => {
                        const isCurrentUser = msg.senderId === currentUser?.uid;
                        const isSystem = msg.senderId === "system";
                        const isEmoji = isEmojiOnly(msg.text);

                        if (isSystem) {
                          return (
                            <div key={index} className="text-center my-2">
                              <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {msg.text}
                              </span>
                            </div>
                          );
                        }

                        const sender = room.participants.find(
                          (p) => p.userId === msg.senderId
                        );

                        return (
                          <div
                            key={index}
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isCurrentUser && !isEmoji && (
                              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                {sender?.avatarUrl ? (
                                  <img
                                    src={sender.avatarUrl}
                                    alt={sender.username || "User"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-purple-200 flex items-center justify-center text-purple-700">
                                    {(sender?.username || "U").charAt(0)}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              {!isEmoji && (
                                <div
                                  className={`text-xs text-gray-500 mb-1 ${
                                    isCurrentUser ? "text-right" : ""
                                  }`}
                                >
                                  {isCurrentUser
                                    ? "You"
                                    : sender?.username || "User"}
                                  , {formatTime(msg.timestamp)}
                                </div>
                              )}

                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`
                                  ${
                                    isEmoji
                                      ? "text-4xl"
                                      : `${
                                          isCurrentUser
                                            ? "bg-purple-600 text-white"
                                            : "bg-gray-100 text-gray-800"
                                        } py-2 px-4 rounded-2xl max-w-xs break-words`
                                  }
                                `}
                              >
                                {msg.text}
                              </motion.div>
                            </div>

                            {isCurrentUser && !isEmoji && (
                              <div className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0">
                                {userProfile?.avatarUrl ? (
                                  <img
                                    src={userProfile.avatarUrl}
                                    alt={userProfile.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-purple-200 flex items-center justify-center text-purple-700">
                                    {(userProfile?.username || "U").charAt(0)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <MessageCircle
                          size={32}
                          className="text-purple-300 mx-auto mb-2"
                        />
                        <p className="text-purple-400">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Emoji Reactions */}
                <div className="px-4 py-2 border-t border-purple-100 flex justify-center space-x-3">
                  {["👍", "❤️", "😊", "🎉", "👏", "🙌"].map((emoji) => (
                    <motion.button
                      key={emoji}
                      onClick={() => sendEmoji(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-purple-100">
                  <div className="flex">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="storybook-input flex-1 rounded-r-none"
                      disabled={!areBothPlayersPresent()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!message.trim() || !areBothPlayersPresent()}
                      className="px-4 py-3 bg-purple-600 text-white rounded-r-full hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-300"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Challenge Section */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-md border-2 border-purple-100 overflow-hidden h-[600px] flex flex-col">
            <div className="bg-purple-50 p-4 border-b border-purple-100">
              <div className="flex items-center">
                <Award size={20} className="text-purple-600 mr-2" />
                <h2 className="font-bold text-purple-900">Challenge</h2>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto">
              {!isPlayerInRoom() ? (
                <div className="text-center p-6">
                  <p className="text-purple-600">
                    Join the room to participate in challenges!
                  </p>
                </div>
              ) : !areBothPlayersPresent() ? (
                <div className="text-center p-6">
                  <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-4">
                    <AlertTriangle
                      size={24}
                      className="text-yellow-600 mx-auto mb-2"
                    />
                    <p className="text-yellow-800">
                      Waiting for another player to join...
                    </p>
                  </div>
                  <p className="text-purple-600 mb-4">
                    Share your room ID with a friend:
                  </p>
                  <div className="flex justify-center">
                    <code className="bg-purple-50 px-3 py-2 rounded text-sm font-mono">
                      {roomId}
                    </code>
                    <button
                      onClick={copyRoomId}
                      className="ml-2 p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                      aria-label="Copy Room ID"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              ) : challenge ? (
                <div>
                  <div
                    className={`p-4 rounded-xl mb-4 ${
                      challenge.status === "pending"
                        ? "bg-yellow-50 border-2 border-yellow-200"
                        : challenge.status === "accepted"
                        ? "bg-blue-50 border-2 border-blue-200"
                        : challenge.status === "completed"
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-red-50 border-2 border-red-200"
                    }`}
                  >
                    <h3 className="font-bold text-lg mb-2">
                      {challenge.theme.name}
                    </h3>
                    <p className="mb-4">{challenge.task.description}</p>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-600">Reward:</span>
                      <span className="font-medium text-yellow-600 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {challenge.task.coinReward} coins
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-600">Challenger:</span>
                      <span className="font-medium">
                        {challenge.challenger?.username || "Unknown"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-600">Challenged:</span>
                      <span className="font-medium">
                        {challenge.challenged?.username || "Unknown"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          challenge.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : challenge.status === "accepted"
                            ? "bg-blue-100 text-blue-800"
                            : challenge.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {challenge.status.charAt(0).toUpperCase() +
                          challenge.status.slice(1)}
                      </span>
                    </div>

                    {challenge.status === "completed" && challenge.winnerId && (
                      <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-center">
                        <p className="font-bold text-yellow-800">
                          Winner:{" "}
                          {challenge.winnerId === currentUser?.uid
                            ? "You!"
                            : challenge.winnerId === player1Info?.userId
                            ? player1Info.username
                            : challenge.winnerId === player2Info?.userId
                            ? player2Info.username
                            : "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Challenge Actions */}
                  {challenge.status === "pending" &&
                    challenge.challenged?.userId === currentUser?.uid && (
                      <div className="flex space-x-2">
                        <button
                          onClick={acceptChallenge}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={rejectChallenge}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                  {challenge.status === "accepted" && (
                    <button
                      onClick={completeChallenge}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 font-bold"
                    >
                      I Completed It First!
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-center text-purple-600 mb-6">
                    Start a new challenge with your friend!
                  </p>

                  {isTaskSelectOpen ? (
                    <div className="space-y-4">
                      <h3 className="font-bold text-purple-900">
                        Select a Quest:
                      </h3>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {themes.map((theme) => (
                          <div
                            key={theme.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedTheme === theme.id
                                ? "bg-purple-100 border-2 border-purple-300"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => {
                              playSound("click");
                              setSelectedTheme(theme.id);
                              setSelectedTask(null);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-purple-900">
                                {theme.name}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  theme.difficulty === "Easy"
                                    ? "bg-green-100 text-green-800"
                                    : theme.difficulty === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {theme.difficulty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTheme && (
                        <div className="mt-4">
                          <h3 className="font-bold text-purple-900 mb-2">
                            Select a Task:
                          </h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {themes
                              .find((t) => t.id === selectedTheme)
                              ?.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedTask === task.id
                                      ? "bg-purple-100 border-2 border-purple-300"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }`}
                                  onClick={() => {
                                    playSound("click");
                                    setSelectedTask(task.id);
                                  }}
                                >
                                  <p className="text-sm mb-1">
                                    {task.description}
                                  </p>
                                  <div className="flex justify-end">
                                    <span className="text-xs text-yellow-600 flex items-center">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      {task.coinReward} coins
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => {
                            playSound("click");
                            setIsTaskSelectOpen(false);
                            setSelectedTheme(null);
                            setSelectedTask(null);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={challengePlayer}
                          disabled={!selectedTheme || !selectedTask}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-300"
                        >
                          Challenge
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        playSound("click");
                        setIsTaskSelectOpen(true);
                      }}
                      className="w-full btn-magic py-4"
                    >
                      <span className="flex items-center justify-center">
                        <Award size={18} className="mr-2" />
                        Create Challenge
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
