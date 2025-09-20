import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import useStore from '../../store';

const OfflineIndicator: React.FC = () => {
  const { isOffline, setOfflineStatus } = useStore();

  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-yellow-50 border-b border-yellow-200 px-4 py-2"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <WifiOff size={16} className="text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You're offline. Changes will sync when you reconnect.
              </span>
            </div>
            <button className="text-xs text-yellow-600 font-medium hover:text-yellow-800">
              Learn more
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
