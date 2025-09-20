import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, AlertTriangle, Loader } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useStore from '../store';

const Chat: React.FC = () => {
  const { conversations, currentConversationId, addConversation, addMessage, setCurrentConversation } = useStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crisis keywords for demo
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'self harm', 'hurt myself'];

  // Current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Check for crisis keywords
    const hasCrisisKeywords = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // Create a new conversation if none exists
    if (!currentConversationId) {
      addConversation();
    }

    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    setMessage('');
    
    // Show crisis alert if needed
    if (hasCrisisKeywords) {
      setShowAlert(true);
      
      // Add AI response after a delay
      setTimeout(() => {
        addMessage(
          "I notice you've mentioned something concerning. Your wellbeing is important. Please consider reaching out to a mental health professional or crisis service like the 988 Suicide & Crisis Lifeline (call or text 988) or Crisis Text Line (text HOME to 741741). Would you like me to provide more resources?",
          'assistant'
        );
      }, 1000);
      
      return;
    }

    // Simulate AI typing
    setIsTyping(true);
    
    // Generate a response based on the message
    const response = generateResponse(message);
    setFullResponse(response);
    
    // Simulate typing effect
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < response.length) {
        setTypingText(response.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setTypingText('');
        // Add the full response to the conversation
        addMessage(response, 'assistant');
      }
    }, 20);
  };

  // Simple response generator for demo
  const generateResponse = (userMessage: string) => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      return "Hello! I'm here to support you. How are you feeling today?";
    } else if (lowercaseMessage.includes('sad') || lowercaseMessage.includes('depressed')) {
      return "I'm sorry to hear you're feeling down. It's important to acknowledge these feelings. Would you like to talk more about what's causing these emotions?";
    } else if (lowercaseMessage.includes('anxious') || lowercaseMessage.includes('anxiety')) {
      return "Anxiety can be really challenging. Deep breathing can sometimes help in the moment. Would you like to try a quick breathing exercise together?";
    } else if (lowercaseMessage.includes('happy') || lowercaseMessage.includes('good')) {
      return "I'm glad to hear you're feeling well! What positive things have been happening in your life recently?";
    } else if (lowercaseMessage.includes('tired') || lowercaseMessage.includes('exhausted')) {
      return "It sounds like you're feeling drained. Make sure you're giving yourself permission to rest. Is there anything specific that's been taking a lot of your energy lately?";
    } else {
      return "Thank you for sharing that with me. I'm here to listen and support you. Would you like to tell me more about how you're feeling?";
    }
  };

  return (
    <Layout title="Chat Support">
      {/* Crisis Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
          >
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800">Crisis Support Alert</h3>
                <p className="text-sm text-red-700 mt-1">
                  We've detected concerning content. If you're in crisis, please reach out for immediate help:
                </p>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  >
                    Call 988 (Crisis Line)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-600 w-full sm:w-auto"
                  >
                    Text HOME to 741741
                  </Button>
                </div>
              </div>
            </div>
            <button
              className="absolute top-3 right-3 text-red-400 hover:text-red-600"
              onClick={() => setShowAlert(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Chat Header */}
        <div className="border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-lg font-semibold">Chat with Sukoon AI</h2>
          <p className="text-sm text-gray-500">
            I'm here to listen and support you. How are you feeling today?
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="text-primary-500" size={28} />
              </div>
              <h3 className="font-medium text-gray-800 mb-1">Welcome to Sukoon AI Chat</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                I'm here to provide support and guidance. How can I help you today?
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-primary-100 ml-2' : 'bg-gray-100 mr-2'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User size={16} className="text-primary-500" />
                      ) : (
                        <Bot size={16} className="text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary-500 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                      <Bot size={16} className="text-gray-600" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-gray-100 text-gray-800">
                      <p className="whitespace-pre-wrap">{typingText}</p>
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded-full ml-1"></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              disabled={isTyping}
            />
            <Button
              type="submit"
              variant="primary"
              className="ml-2"
              disabled={!message.trim() || isTyping}
            >
              {isTyping ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </Layout>
  );
};

export default Chat;