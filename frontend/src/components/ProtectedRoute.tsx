import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode; // Changed from JSX.Element to ReactNode
  allowedRoles?: string[]; // Optional: Specify roles that are allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading authentication state...</div>; // Or a spinner component
  }

  if (!isAuthenticated()) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for role-based access if allowedRoles are provided
  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // User is authenticated but does not have the required role
    // Redirect to an unauthorized page or back to dashboard/home with a message
    // For simplicity, redirecting to dashboard. Consider an "Unauthorized" page.
    alert('You do not have permission to access this page.'); // Simple alert for now
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>; // Ensure children are rendered correctly as React nodes
};

export default ProtectedRoute; 