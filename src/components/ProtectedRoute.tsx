import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UnifiedLoader from "./UnifiedLoader";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show unified loading state while auth state is being determined
  if (loading) {
    return (
      <UnifiedLoader
        title="Opening the magical portal..."
        subtitle="Preparing your adventure..."
        showProgress={true}
      />
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
