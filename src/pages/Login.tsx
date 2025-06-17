import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";

const Login: React.FC = () => {
  const {
    currentUser,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnonymously,
    resetPassword,
    loading,
  } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleAnonymousLogin = async () => {
    playSound("click");
    setError("");
    try {
      await signInAnonymously();
    } catch (err: any) {
      console.error("Anonymous login error:", err);
      setError("Unable to continue anonymously. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    playSound("click");
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google login error:", err);
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      setError("Unable to sign in with Google. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    playSound("click");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await resetPassword(email);
      setIsForgotPassword(false);
      setEmail("");
    } catch (err: any) {
      console.error("Password reset error:", err);

      if (err.code === "auth/user-not-found") {
        setError(
          "No account found with this email address. Please check your email or create a new account."
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Too many requests. Please wait a moment before trying again."
        );
      } else {
        setError("Unable to send password reset email. Please try again.");
      }
    }
  };

  const handleEmailAuth = async () => {
    playSound("click");
    setError("");

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long!");
        return;
      }
      try {
        await signUpWithEmail(email, password);
      } catch (err: any) {
        console.error("Email signup error:", err);
        setError("Unable to create account. Please try again.");
      }
    } else {
      try {
        await signInWithEmail(email, password);
      } catch (err: any) {
        console.error("Email login error:", err);
        setError(
          "Unable to sign in. Please check your credentials and try again."
        );
      }
    }
  };

  const toggleAuthMode = () => {
    playSound("click");
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError("");
  };

  const toggleForgotPassword = () => {
    playSound("click");
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 -z-10"></div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-200 opacity-30"
            style={
              {
                width: `${Math.random() * 50 + 20}px`,
                height: `${Math.random() * 50 + 20}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              } as React.CSSProperties
            }
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              delay: Math.random() * 2,
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-md w-full mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-block bg-purple-600 text-white p-6 rounded-full mb-4 shadow-lg"
            whileHover={{ rotate: 5, scale: 1.1 }}
          >
            <Sparkles size={48} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2">
            KidQuest Champions
          </h1>
          <p className="text-lg text-purple-600">
            Begin Your Legendary Adventure
          </p>
        </div>

        <motion.div
          className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-300"
          whileHover={{ y: -5 }}
        >
          <h2 className="text-2xl font-bold text-center text-purple-900 mb-6">
            {isForgotPassword
              ? "Reset Your Password"
              : isSignUp
              ? "Create Your Champion Account"
              : "Choose Your Portal"}
          </h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          {isForgotPassword ? (
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-4 text-center">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 pl-10 mb-4 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="btn-magic w-full py-3 mb-4"
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending Reset Email...
                    </>
                  ) : (
                    <>
                      <Mail size={18} className="mr-2" />
                      Send Reset Email
                    </>
                  )}
                </span>
              </button>
              <button
                onClick={toggleForgotPassword}
                className="w-full text-purple-600 hover:text-purple-800 text-sm transition-colors flex items-center justify-center"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Regular Email Authentication Form */
            <>
              <div className="mb-4">
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 pl-10 mb-2 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 mb-2 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full p-3 mb-2 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                )}
                <button
                  onClick={handleEmailAuth}
                  disabled={loading}
                  className="btn-magic w-full py-3 mb-2"
                >
                  <span className="flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isSignUp ? "Creating Account..." : "Logging in..."}
                      </>
                    ) : (
                      <>
                        {isSignUp ? (
                          <UserPlus size={18} className="mr-2" />
                        ) : (
                          <Mail size={18} className="mr-2" />
                        )}
                        {isSignUp ? "Sign Up with Email" : "Login with Email"}
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Forgot Password Link - Only show for login */}
              {!isSignUp && (
                <div className="text-center mb-4">
                  <button
                    onClick={toggleForgotPassword}
                    className="text-purple-600 hover:text-purple-800 text-sm transition-colors underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Toggle Auth Mode */}
              <button
                onClick={toggleAuthMode}
                className="w-full text-purple-600 hover:text-purple-800 text-sm mb-4 transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Log in"
                  : "Need an account? Sign up"}
              </button>

              {/* Google Sign-in */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 mb-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </span>
              </button>

              {/* Anonymous Sign-in - Only show for login */}
              {!isSignUp && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  <button
                    onClick={handleAnonymousLogin}
                    disabled={loading}
                    className="btn-magic w-full py-3 text-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Opening Portal...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Sparkles size={18} className="mr-2" />
                        Continue Anonymously
                      </span>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          <p className="text-sm text-gray-500 text-center mt-4">
            By entering, you agree to be awesome and have fun!
          </p>
        </motion.div>

        {/* Magical decorations */}
        <div className="flex justify-center mt-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              className="text-yellow-400 mx-1"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{
                duration: 2,
                delay: star * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
