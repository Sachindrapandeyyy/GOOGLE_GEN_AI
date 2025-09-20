import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Edit3, Save, Trash2, Clock, ArrowLeft } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import Toast from '../components/ui/Toast';
import useStore from '../store';

const Diary: React.FC = () => {
  const { diaryEntries, currentDraft, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, setCurrentDraft } = useStore();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft
  useEffect(() => {
    if (currentDraft && !isEditing) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        setIsAutoSaving(true);
        // In a real app, this would save to IndexedDB
        localStorage.setItem('diary-draft', currentDraft);
        setToastMessage('Draft saved automatically');
        setToastType('info');
        setShowToast(true);
        setIsAutoSaving(false);
      }, 2000);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentDraft, isEditing]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('diary-draft');
    if (savedDraft && !currentDraft) {
      setCurrentDraft(savedDraft);
    }
  }, [currentDraft, setCurrentDraft]);

  // Focus textarea when editing
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveDiary = async () => {
    try {
      if (currentDraft.trim()) {
        await addDiaryEntry(currentDraft);
        setCurrentDraft('');
        localStorage.removeItem('diary-draft');
        setToastMessage('Diary entry saved successfully');
        setToastType('success');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to save diary entry');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleUpdateEntry = async () => {
    try {
      if (selectedEntry && editContent.trim()) {
        await updateDiaryEntry(selectedEntry, editContent);
        setIsEditing(false);
        setSelectedEntry(null);
        setToastMessage('Diary entry updated successfully');
        setToastType('success');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to update diary entry');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDiaryEntry(id);
      if (selectedEntry === id) {
        setSelectedEntry(null);
        setIsEditing(false);
      }
      setToastMessage('Diary entry deleted successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to delete diary entry');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleEditEntry = (id: string) => {
    const entry = diaryEntries.find(entry => entry.id === id);
    if (entry) {
      setSelectedEntry(id);
      setEditContent(entry.content);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedEntry(null);
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

  return (
    <Layout title="My Diary">
      <AnimatePresence>
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>

      {/* New Entry Editor */}
      {!selectedEntry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Card>
            <h2 className="text-xl font-semibold mb-4">Write a new entry</h2>
            <TextArea
              placeholder="How are you feeling today? What's on your mind?"
              value={currentDraft}
              onChange={(e) => setCurrentDraft(e.target.value)}
              className="min-h-[200px] mb-4"
              autoResize
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isAutoSaving ? (
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1 animate-pulse" />
                    Saving draft...
                  </span>
                ) : (
                  currentDraft && 'Draft will be saved automatically'
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleSaveDiary}
                disabled={!currentDraft.trim()}
                icon={<Save size={16} />}
              >
                Save Entry
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Edit Entry */}
      {selectedEntry && isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Card>
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                icon={<ArrowLeft size={16} />}
                onClick={handleCancelEdit}
              />
              <h2 className="text-xl font-semibold">Edit entry</h2>
            </div>
            <TextArea
              ref={textAreaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[200px] mb-4"
              autoResize
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateEntry}
                disabled={!editContent.trim()}
                icon={<Save size={16} />}
              >
                Update Entry
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Entries List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
        
        {diaryEntries.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 mb-3">You haven't written any entries yet</p>
            <p className="text-sm text-gray-400">
              Start by writing your thoughts above
            </p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {diaryEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                layoutId={`entry-${entry.id}`}
              >
                <Card
                  className={selectedEntry === entry.id && !isEditing ? 'border-2 border-primary-300' : ''}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{formatDate(entry.createdAt)}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{formatTime(entry.createdAt)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-primary-500"
                        icon={<Edit3 size={16} />}
                        onClick={() => handleEditEntry(entry.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-500"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteEntry(entry.id)}
                      />
                    </div>
                  </div>
                  
                  {selectedEntry === entry.id && !isEditing ? (
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap line-clamp-3">
                      {entry.content}
                    </p>
                  )}
                  
                  {selectedEntry !== entry.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary-500"
                      onClick={() => setSelectedEntry(entry.id)}
                    >
                      Read more
                    </Button>
                  )}
                  
                  {selectedEntry === entry.id && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary-500"
                      onClick={() => setSelectedEntry(null)}
                    >
                      Show less
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Diary;