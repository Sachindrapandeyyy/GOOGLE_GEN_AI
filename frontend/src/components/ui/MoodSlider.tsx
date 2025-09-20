import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MoodSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const MoodSlider: React.FC<MoodSliderProps> = ({ value, onChange }) => {
  const [sliderValue, setSliderValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const moods = [
    { value: 1, emoji: '😔', label: 'Very Bad', color: 'from-red-400 to-red-500' },
    { value: 2, emoji: '😕', label: 'Bad', color: 'from-orange-400 to-orange-500' },
    { value: 3, emoji: '😐', label: 'Neutral', color: 'from-yellow-400 to-yellow-500' },
    { value: 4, emoji: '🙂', label: 'Good', color: 'from-green-400 to-green-500' },
    { value: 5, emoji: '😃', label: 'Great', color: 'from-primary-400 to-primary-500' },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setSliderValue(newValue);
    onChange(newValue);
  };

  const currentMood = moods.find(mood => mood.value === sliderValue) || moods[2];

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <motion.div
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentMood.color} flex items-center justify-center mb-3 shadow-lg`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <span className="text-4xl">{currentMood.emoji}</span>
        </motion.div>
        <motion.h3 
          className="text-xl font-medium"
          key={currentMood.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentMood.label}
        </motion.h3>
      </div>

      <div className="relative py-5">
        <div className="h-2 bg-gray-200 rounded-full">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${currentMood.color}`}
            style={{ width: `${(sliderValue / 5) * 100}%` }}
            initial={false}
            animate={{ width: `${(sliderValue / 5) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          className="absolute top-0 left-0 w-full h-12 opacity-0 cursor-pointer"
        />
        
        <div className="flex justify-between mt-4">
          {moods.map(mood => (
            <div 
              key={mood.value} 
              className="flex flex-col items-center"
              onClick={() => {
                setSliderValue(mood.value);
                onChange(mood.value);
              }}
            >
              <div 
                className={`w-4 h-4 rounded-full ${
                  sliderValue >= mood.value 
                    ? `bg-gradient-to-r ${mood.color}` 
                    : 'bg-gray-300'
                } cursor-pointer`}
              />
              <span className="text-xs mt-1 text-gray-500">{mood.emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodSlider;
