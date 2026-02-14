import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const BYPASS_AUTH=true;
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!BYPASS_AUTH && !loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (!BYPASS_AUTH && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!BYPASS_AUTH && !user) {
    return null;
  }

  return <>{children}</>;
}