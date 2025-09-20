import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Book, MessageCircle, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import useStore from '../store';

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { generateUserId, setOnboarded } = useStore();

  const steps = [
    {
      title: 'Welcome to Sukoon AI',
      description: 'Your safe space to express, reflect, and heal',
      icon: Heart,
      color: 'bg-secondary-300',
      textColor: 'text-secondary-300',
    },
    {
      title: 'Express Yourself',
      description: 'Write in your private diary whenever you need to process your thoughts',
      icon: Book,
      color: 'bg-primary-400',
      textColor: 'text-primary-400',
    },
    {
      title: 'Chat Support',
      description: 'Talk to our AI companion for empathetic support and guidance',
      icon: MessageCircle,
      color: 'bg-accent-400',
      textColor: 'text-accent-400',
    },
    {
      title: 'Your Privacy Matters',
      description: 'All your data is encrypted and you can use Sukoon anonymously',
      icon: Shield,
      color: 'bg-green-400',
      textColor: 'text-green-400',
    },
  ];

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    generateUserId();
    setOnboarded(true);
    navigate('/');
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen flex flex-col animated-gradient-bg">
      {/* Logo */}
      <div className="mt-10 mb-4 text-center">
        <h1 className="text-3xl font-bold text-white text-shadow-lg">Sukoon AI</h1>
      </div>
      
      {/* Progress dots */}
      <div className="flex justify-center mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 mx-1 rounded-full ${
              index === currentStep ? 'bg-white scale-125 opacity-100' : 'bg-white/40 scale-100 opacity-50'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          key={currentStep}
          className="flex flex-col items-center text-center max-w-md"
        >
            <div
              className={`w-24 h-24 ${currentStepData.color} rounded-full flex items-center justify-center mb-6 shadow-lg`}
            >
              <Icon size={40} className="text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 text-shadow">
              {currentStepData.title}
            </h2>
            
            <p className="text-white/90 mb-8">
              {currentStepData.description}
            </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-10">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="bg-white text-primary-500 hover:bg-white/90 mb-4 shadow-lg"
          onClick={handleContinue}
          icon={<ArrowRight size={18} />}
          iconPosition="right"
        >
          {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
        
        {currentStep < steps.length - 1 && (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            className="text-white hover:bg-white/10"
            onClick={handleGetStarted}
          >
            Skip Introduction
          </Button>
        )}
      </div>

      {/* Anonymous login note */}
      <div 
        className="text-center pb-6"
      >
        <p className="text-xs text-white/70">
          <Shield size={12} className="inline mr-1" />
          No account needed. Your data stays private.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;