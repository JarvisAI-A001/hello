import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
}

const REDIRECT_KEY = "auth:redirect";

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading, isGuest } = useAuth();

  useEffect(() => {
    if (!user) {
      const target = `${location.pathname}${location.search}`;
      localStorage.setItem(REDIRECT_KEY, target);
    }
  }, [location.pathname, location.search, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MessageSquare className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
