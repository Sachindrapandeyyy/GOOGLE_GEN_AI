import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, MessageCircle, Heart, BarChart2, TrendingUp, Sun, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useStore from '../store';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, diaryEntries, moodEntries } = useStore();

  const mainFeatures = [
    {
      title: 'Write in Diary',
      description: 'Express your thoughts and feelings',
      icon: <Book size={24} className="text-white" />,
      color: 'from-primary-300 to-primary-500',
      path: '/diary',
    },
    {
      title: 'Chat with AI',
      description: 'Get support and guidance',
      icon: <MessageCircle size={24} className="text-white" />,
      color: 'from-accent-300 to-accent-500',
      path: '/chat',
    },
    {
      title: 'Track Your Mood',
      description: 'Log how you feel today',
      icon: <Heart size={24} className="text-white" />,
      color: 'from-secondary-300 to-secondary-500',
      path: '/mood',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Get today's date in a readable format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Get the latest mood entry
  const latestMood = moodEntries[0];
  
  // Calculate mood trend
  const moodTrend = moodEntries.length > 1
    ? moodEntries[0].score > moodEntries[1].score
      ? 'improving'
      : moodEntries[0].score < moodEntries[1].score
        ? 'declining'
        : 'stable'
    : 'stable';

  return (
    <Layout title="Sukoon AI">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-medium text-gray-800">Welcome back!</h2>
        <p className="text-gray-600 mb-6">{today}</p>
      </motion.div>

      {/* Main Features Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {mainFeatures.map((feature) => (
          <motion.div key={feature.title} variants={item}>
            <Card
              interactive
              gradient={feature.color}
              className="h-40"
              onClick={() => navigate(feature.path)}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-white/80">{feature.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Insights & Mood Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Today's Mood Card */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
        >
          <Card className="h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg text-gray-800">Today's Mood</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mood')}
                className="text-primary-500"
              >
                Update
              </Button>
            </div>

            {latestMood ? (
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center mr-4">
                  <span className="text-3xl">
                    {latestMood.score === 1 && '😔'}
                    {latestMood.score === 2 && '😕'}
                    {latestMood.score === 3 && '😐'}
                    {latestMood.score === 4 && '🙂'}
                    {latestMood.score === 5 && '😃'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium">
                      {latestMood.score === 1 && 'Very Bad'}
                      {latestMood.score === 2 && 'Bad'}
                      {latestMood.score === 3 && 'Neutral'}
                      {latestMood.score === 4 && 'Good'}
                      {latestMood.score === 5 && 'Great'}
                    </h4>
                    {moodTrend !== 'stable' && (
                      <div className={`ml-2 flex items-center text-xs ${
                        moodTrend === 'improving' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {moodTrend === 'improving' ? (
                          <TrendingUp size={12} className="mr-1" />
                        ) : (
                          <TrendingUp size={12} className="mr-1 transform rotate-180" />
                        )}
                        {moodTrend === 'improving' ? 'Improving' : 'Declining'}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {latestMood.notes ? latestMood.notes : 'No notes added'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(latestMood.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Heart size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">How are you feeling today?</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/mood')}
                  icon={<Plus size={16} />}
                >
                  Log Mood
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Insights Preview Card */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg text-gray-800">Insights</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/insights')}
                className="text-primary-500"
              >
                View All
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center mr-3">
                  <BarChart2 size={20} className="text-accent-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Mood Trends</h4>
                  <p className="text-sm text-gray-600">
                    {moodEntries.length > 0
                      ? `You've logged ${moodEntries.length} moods in the last 30 days`
                      : 'Start tracking your mood to see trends'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
                  <Sun size={20} className="text-secondary-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Wellness Tip</h4>
                  <p className="text-sm text-gray-600">
                    Take 5 minutes today for deep breathing exercises
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.3 }}
      >
        <Card>
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Recent Activity</h3>
          
          {diaryEntries.length > 0 || moodEntries.length > 0 ? (
            <div className="space-y-4">
              {diaryEntries.slice(0, 2).map((entry) => (
                <div key={entry.id} className="flex items-start border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <Book size={16} className="text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Diary Entry</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {entry.content.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Start by writing in your diary or logging your mood
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Crisis Resources */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <h3 className="font-medium text-red-800 mb-2">Need immediate help?</h3>
          <p className="text-sm text-red-700 mb-3">
            If you're in crisis or having thoughts of self-harm, please reach out immediately:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Call 988 (Crisis Line)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600"
            >
              Text HOME to 741741
            </Button>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;