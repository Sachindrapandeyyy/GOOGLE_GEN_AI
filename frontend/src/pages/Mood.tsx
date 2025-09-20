import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import MoodSlider from '../components/ui/MoodSlider';
import Toast from '../components/ui/Toast';
import useStore from '../store';

const Mood: React.FC = () => {
  const { moodEntries, addMoodEntry } = useStore();
  const [moodScore, setMoodScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const handleMoodChange = (value: number) => {
    setMoodScore(value);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await addMoodEntry(moodScore, notes);
      setNotes('');
      setToastMessage('Mood logged successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to log mood');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    switch (score) {
      case 1: return '😔';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😃';
      default: return '😐';
    }
  };

  const getMoodText = (score: number) => {
    switch (score) {
      case 1: return 'Very Bad';
      case 2: return 'Bad';
      case 3: return 'Neutral';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return 'Neutral';
    }
  };

  const getMoodColor = (score: number) => {
    switch (score) {
      case 1: return 'from-red-400 to-red-500';
      case 2: return 'from-orange-400 to-orange-500';
      case 3: return 'from-yellow-400 to-yellow-500';
      case 4: return 'from-green-400 to-green-500';
      case 5: return 'from-primary-400 to-primary-500';
      default: return 'from-yellow-400 to-yellow-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group entries by date
  const groupedEntries = moodEntries.reduce((groups: Record<string, any[]>, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  return (
    <Layout title="Mood Tracker">
      <AnimatePresence>
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>

      {/* Mood Entry Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <Card>
          <h2 className="text-xl font-semibold mb-6">How are you feeling today?</h2>
          
          <MoodSlider value={moodScore} onChange={handleMoodChange} />
          
          <div className="mt-6">
            <TextArea
              label="Add notes (optional)"
              placeholder="What's contributing to your mood today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Log Mood
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Mood History */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mood History</h2>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center"
          onClick={() => setShowHistory(!showHistory)}
          icon={showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        >
          {showHistory ? 'Hide' : 'Show'}
        </Button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {Object.keys(groupedEntries).length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500 mb-3">No mood entries yet</p>
                <p className="text-sm text-gray-400">
                  Log your first mood above to start tracking
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEntries).map(([date, entries]) => (
                  <div key={date}>
                    <h3 className="text-md font-medium text-gray-700 mb-3 pl-2">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card>
                            <div className="flex items-start">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMoodColor(entry.score)} flex items-center justify-center mr-4`}>
                                <span className="text-2xl">{getMoodEmoji(entry.score)}</span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">{getMoodText(entry.score)}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock size={14} className="mr-1" />
                                    {formatTime(entry.createdAt)}
                                  </div>
                                </div>
                                
                                {entry.notes && (
                                  <p className="text-gray-700 mt-2 text-sm">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-8"
      >
        <Card>
          <h2 className="text-xl font-semibold mb-4">Mood Insights</h2>
          
          {moodEntries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-2">No insights available yet</p>
              <p className="text-sm text-gray-400">
                Log your mood regularly to see patterns and trends
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Last 7 days</h3>
                <div className="h-12 bg-gray-100 rounded-lg flex">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dateStr = date.toLocaleDateString();
                    const entriesForDay = groupedEntries[dateStr] || [];
                    const avgScore = entriesForDay.length
                      ? entriesForDay.reduce((sum, e) => sum + e.score, 0) / entriesForDay.length
                      : 0;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        {avgScore > 0 && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(avgScore / 5) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`w-6 rounded-t-full bg-gradient-to-b ${getMoodColor(Math.round(avgScore))}`}
                          />
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Average Mood</h4>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-800 mr-2">
                      {(moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length).toFixed(1)}
                    </span>
                    <span className="text-2xl">
                      {getMoodEmoji(Math.round(moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length))}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Total Entries</h4>
                  <p className="text-xl font-bold text-gray-800">{moodEntries.length}</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </Layout>
  );
};

export default Mood;