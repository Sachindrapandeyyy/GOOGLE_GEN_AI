import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Bell } from 'lucide-react';
import useStore from '../../store';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Sukoon AI' }) => {
  const { isNavOpen, toggleNav } = useStore();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleNav} 
            className="mr-3 p-2 rounded-full hover:bg-gray-100 md:hidden"
            aria-label={isNavOpen ? "Close menu" : "Open menu"}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isNavOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isNavOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </button>
          
          <motion.h1 
            className="text-xl font-heading font-bold gradient-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button 
            className="p-2 rounded-full hover:bg-gray-100 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            <Bell size={20} className="text-neutral-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-400 rounded-full"></span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
