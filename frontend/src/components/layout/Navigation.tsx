import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Book, Heart, MessageCircle, BarChart2 } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/diary', icon: Book, label: 'Diary' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/mood', icon: Heart, label: 'Mood' },
    { path: '/insights', icon: BarChart2, label: 'Insights' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:shadow-none md:border-0 md:left-auto md:top-0 md:w-20 md:h-full z-10">
      <div className="flex justify-around md:flex-col md:h-full md:py-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-3 px-2 md:py-6 md:my-2"
            >
              {isActive && (
                <div
                  className="absolute inset-0 bg-primary-100 rounded-xl -z-10"
                />
              )}
              <div className="flex flex-col items-center">
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-primary-500' : 'text-neutral-400'
                  }`}
                />
                <span
                  className={`text-xs mt-1 ${
                    isActive ? 'text-primary-500 font-medium' : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
