import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SoundProvider } from "./contexts/SoundContext";
import { ModalProvider } from "./contexts/ModalContext";
// Lazy load components for better performance
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const HobbiesPage = React.lazy(() => import("./pages/HobbiesPage"));
const QuestsPage = React.lazy(() => import("./pages/QuestsPage"));
const ThemePage = React.lazy(() => import("./pages/ThemePage"));
const RoomsPage = React.lazy(() => import("./pages/RoomsPage"));
const RoomDetail = React.lazy(() => import("./pages/RoomDetail"));
const FriendsPage = React.lazy(() => import("./pages/FriendsPage"));
const LeaderboardPage = React.lazy(() => import("./pages/LeaderboardPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Mascot from "./components/Mascot";
import "./styles/globals.css";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 KidQuest Champions Error:", error);
    console.error("📍 Error Info:", errorInfo);
    console.error("🔍 Stack Trace:", error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-100 via-purple-50 to-blue-100">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-purple-600 mb-6">
              The magical portal encountered an unexpected error. Let's try
              refreshing to get back to your adventure!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              🔄 Refresh Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inner app component that has access to auth context
const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-blue-100">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-100 via-purple-50 to-blue-100 -z-10"></div>

      {/* Magical floating background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-yellow-200 opacity-20"
            style={
              {
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              } as React.CSSProperties
            }
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Only show header if user is logged in */}
        {currentUser && <Header />}

        <main className={`container mx-auto px-4 ${currentUser ? "py-8" : ""}`}>
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg text-purple-600">
                    Loading magical content...
                  </p>
                </div>
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  currentUser ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hobbies"
                element={
                  <ProtectedRoute>
                    <HobbiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quests"
                element={
                  <ProtectedRoute>
                    <QuestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/themes"
                element={
                  <ProtectedRoute>
                    <ThemePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <RoomsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:roomId"
                element={
                  <ProtectedRoute>
                    <RoomDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <FriendsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              {/* Catch all route - redirect to appropriate page */}
              <Route
                path="*"
                element={
                  currentUser ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </React.Suspense>
        </main>

        {/* Only show mascot if user is logged in */}
        {currentUser && <Mascot />}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SoundProvider>
          <ModalProvider>
            <AuthProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </AuthProvider>
          </ModalProvider>
        </SoundProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
