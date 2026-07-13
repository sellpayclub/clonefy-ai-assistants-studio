import { useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';

import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/lib/admin';

export const RestrictedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!isAdminEmail(user?.email)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
