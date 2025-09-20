import React, { ReactNode } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import OfflineIndicator from '../ui/OfflineIndicator';
import useStore from '../../store';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showNavigation?: boolean;
  showHeader?: boolean;
  fullHeight?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showNavigation = true,
  showHeader = true,
  fullHeight = false,
}) => {
  const isOffline = useStore(state => state.isOffline);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {showHeader && <Header title={title} />}
      
      {isOffline && <OfflineIndicator />}
      
      <main
        className={`flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6 md:pl-24 ${fullHeight ? 'h-[calc(100vh-4rem)]' : ''}`}
      >
        {children}
      </main>
      
      {showNavigation && <Navigation />}
    </div>
  );
};

export default Layout;
