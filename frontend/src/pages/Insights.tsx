import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart2, BookOpen, MessageCircle, Heart, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useStore from '../store';

const Insights: React.FC = () => {
  const { moodEntries, diaryEntries } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Generate demo mood data if no entries
  const generateMoodData = () => {
    if (moodEntries.length > 0) {
      return moodEntries.slice(0, 14).map(entry => ({
        date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
      }));
    }
    
    // Demo data
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.floor(Math.random() * 5) + 1,
      };
    });
  };

  // Generate activity data
  const generateActivityData = () => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Count diary entries for this day
      const diaryCount = diaryEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getDate() === date.getDate() && 
               entryDate.getMonth() === date.getMonth() &&
               entryDate.getFullYear() === date.getFullYear();
      }).length;
      
      // Count mood entries for this day
      const moodCount = moodEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getDate() === date.getDate() && 
               entryDate.getMonth() === date.getMonth() &&
               entryDate.getFullYear() === date.getFullYear();
      }).length;
      
      return {
        day: dayName,
        diary: diaryCount || Math.floor(Math.random() * 2),  // Use random if no real data
        mood: moodCount || Math.floor(Math.random() * 3),    // Use random if no real data
      };
    });
  };

  const moodData = generateMoodData();
  const activityData = generateActivityData();

  // Calculate average mood
  const averageMood = moodData.reduce((sum, item) => sum + item.score, 0) / moodData.length;
  
  // Determine trend
  const firstHalfAvg = moodData.slice(0, Math.floor(moodData.length / 2))
    .reduce((sum, item) => sum + item.score, 0) / Math.floor(moodData.length / 2);
  const secondHalfAvg = moodData.slice(Math.floor(moodData.length / 2))
    .reduce((sum, item) => sum + item.score, 0) / (moodData.length - Math.floor(moodData.length / 2));
  const trend = secondHalfAvg > firstHalfAvg ? 'improving' : secondHalfAvg < firstHalfAvg ? 'declining' : 'stable';

  // Common themes (would be from NLP in real app)
  const themes = [
    { text: 'Work stress', size: 24 },
    { text: 'Family', size: 18 },
    { text: 'Anxiety', size: 22 },
    { text: 'Sleep', size: 16 },
    { text: 'Exercise', size: 20 },
    { text: 'Friends', size: 19 },
    { text: 'Hobbies', size: 15 },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

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

  return (
    <Layout title="Insights">
      {/* Header with time range selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Wellness Insights</h2>
        <div className="flex space-x-2">
          <Button
            variant={timeRange === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-500"
          icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Mood Trends Chart */}
        <motion.div variants={item}>
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Mood Trends</h3>
                <p className="text-sm text-gray-500">How your mood has changed over time</p>
              </div>
              <div className="flex items-center">
                {trend === 'improving' && (
                  <div className="flex items-center text-green-500">
                    <TrendingUp size={16} className="mr-1" />
                    <span className="text-sm font-medium">Improving</span>
                  </div>
                )}
                {trend === 'declining' && (
                  <div className="flex items-center text-red-500">
                    <TrendingDown size={16} className="mr-1" />
                    <span className="text-sm font-medium">Declining</span>
                  </div>
                )}
                {trend === 'stable' && (
                  <div className="flex items-center text-blue-500">
                    <span className="text-sm font-medium">Stable</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="#888" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`Mood: ${value}`, 'Score']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#a78bfa" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#7c3aed' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Mood Stats & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Stats */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mood Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Average Mood</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-800 mr-2">
                      {averageMood.toFixed(1)}
                    </span>
                    <span className="text-2xl">
                      {averageMood >= 4.5 ? '😃' :
                       averageMood >= 3.5 ? '🙂' :
                       averageMood >= 2.5 ? '😐' :
                       averageMood >= 1.5 ? '😕' : '😔'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Entries</h4>
                  <p className="text-2xl font-bold text-gray-800">{moodData.length}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Highest</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-800 mr-2">
                      {Math.max(...moodData.map(d => d.score))}
                    </span>
                    <span className="text-2xl">😃</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Lowest</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-800 mr-2">
                      {Math.min(...moodData.map(d => d.score))}
                    </span>
                    <span className="text-2xl">😔</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Activity Chart */}
          <motion.div variants={item}>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="diary" name="Diary Entries" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="mood" name="Mood Logs" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Common Themes */}
        <motion.div variants={item}>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Common Themes</h3>
            <p className="text-sm text-gray-500 mb-4">Topics that appear frequently in your diary entries</p>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {themes.map((theme, index) => (
                <div
                  key={index}
                  className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full"
                  style={{ fontSize: `${theme.size / 10}rem` }}
                >
                  {theme.text}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={item}>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
            
            <div className="space-y-4">
              <div className="bg-accent-50 border border-accent-100 rounded-xl p-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center mr-3">
                    <BookOpen size={20} className="text-accent-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-accent-800">Journal Regularly</h4>
                    <p className="text-sm text-accent-700 mt-1">
                      Consistent journaling can help you process emotions and track patterns in your mental health.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <Heart size={20} className="text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary-800">Practice Self-Care</h4>
                    <p className="text-sm text-primary-700 mt-1">
                      Based on your mood patterns, try to incorporate more self-care activities, especially on days when you feel low.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary-50 border border-secondary-100 rounded-xl p-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
                    <MessageCircle size={20} className="text-secondary-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-800">Reach Out</h4>
                    <p className="text-sm text-secondary-700 mt-1">
                      Consider talking to someone you trust about your feelings, especially when you notice your mood declining.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Wellness Tip */}
        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-primary-50 to-accent-50">
            <h3 className="text-lg font-semibold mb-2">Wellness Tip of the Day</h3>
            <p className="text-gray-700">
              "Take 5 minutes today for deep breathing exercises. Breathe in for 4 counts, hold for 4, and exhale for 6. This simple practice can help reduce stress and improve focus."
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Insights;