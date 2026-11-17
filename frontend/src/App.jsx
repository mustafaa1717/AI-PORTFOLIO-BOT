import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import FitEvaluatorModal from './components/FitEvaluatorModal';
import ResumeDrawer from './components/ResumeDrawer';
import { api } from './api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentFitReport, setCurrentFitReport] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // Modals & Drawers state
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Candidate Data (fallback to cache if needed)
  const [resumeData, setResumeData] = useState(null);

  // Check backend health & fetch resume cache
  const checkBackend = useCallback(async () => {
    try {
      await api.checkHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  // Load initial resume data
  useEffect(() => {
    api.getResume()
      .then((data) => setResumeData(data))
      .catch((err) => console.log('Resume preload:', err.message));
  }, []);

  // Load conversation list on mount
  const loadConversations = useCallback(async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    }
  }, []);

  // Load specific conversation history
  const loadConversationHistory = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingConv(true);
    try {
      const conv = await api.getConversationHistory(convId);
      setCurrentConvId(conv.id);
      setMessages(conv.messages || []);
      setCurrentFitReport(conv.fit_report || null);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  // Initialize app: load conversations or create first one
  useEffect(() => {
    async function init() {
      const list = await loadConversations();
      if (list && list.length > 0) {
        // Load the latest conversation
        await loadConversationHistory(list[0].id);
      } else {
        // Create initial conversation
        try {
          const newConv = await api.createConversation();
          setConversations([newConv]);
          setCurrentConvId(newConv.id);
          setMessages([]);
        } catch (e) {
          console.error('Failed to create initial conversation:', e);
        }
      }
    }
    init();
  }, [loadConversations, loadConversationHistory]);

  // Handle switching conversation
  const handleSelectConversation = (convId) => {
    if (convId === currentConvId) return;
    loadConversationHistory(convId);
  };

  // Handle creating new conversation
  const handleCreateConversation = async () => {
    try {
      setLoadingConv(true);
      const newConv = await api.createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConvId(newConv.id);
      setMessages([]);
      setCurrentFitReport(null);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      alert('Could not start a new conversation. Make sure the backend server is running.');
    } finally {
      setLoadingConv(false);
    }
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (convId) => {
    try {
      await api.deleteConversation(convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);

      if (currentConvId === convId) {
        if (updated.length > 0) {
          loadConversationHistory(updated[0].id);
        } else {
          // If no conversations remain, create a clean one
          handleCreateConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Handle sending a chat message
  const handleSendMessage = async (textToSend) => {
    const question = textToSend || input;
    if (!question || !question.trim() || isLoading) return;

    let targetConvId = currentConvId;

    // Ensure we have an active conversation ID
    if (!targetConvId) {
      try {
        const newConv = await api.createConversation();
        setConversations((prev) => [newConv, ...prev]);
        targetConvId = newConv.id;
        setCurrentConvId(newConv.id);
      } catch (err) {
        console.error('Failed to auto-create conversation:', err);
        return;
      }
    }

    const optimisticUserMsg = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage(targetConvId, question.trim());
      
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        metadata: response.metadata,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh sidebar conversation list to capture updated title
      loadConversations();
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Unable to process question**: ${err.message || 'Please check your connection and verify the backend API is running.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    handleSendMessage(promptText);
  };

  const candidateName = resumeData?.name || 'Mustafa Shaikh';

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        onOpenResume={() => setIsResumeOpen(true)}
        onOpenFitEvaluator={() => setIsFitModalOpen(true)}
        backendOnline={backendOnline}
        candidateName={candidateName}
        candidateRole="Full-Stack & Distributed Systems"
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Application Body (Sidebar + Chat Area) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar */}
        <Sidebar
          conversations={conversations}
          currentConvId={currentConvId}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onQuickPrompt={handleQuickPrompt}
          loadingConv={loadingConv}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Central Chat View */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40 relative">
          
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onQuickPrompt={handleQuickPrompt}
            onOpenFitEvaluator={() => setIsFitModalOpen(true)}
            onOpenResume={() => setIsResumeOpen(true)}
            candidateName={candidateName}
          />

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            onQuickPrompt={handleQuickPrompt}
          />

        </main>

      </div>

      {/* Recruiter Job Fit Evaluator Modal */}
      <FitEvaluatorModal
        isOpen={isFitModalOpen}
        onClose={() => setIsFitModalOpen(false)}
        conversationId={currentConvId}
        currentFitReport={currentFitReport}
        onFitEvaluated={(report) => setCurrentFitReport(report)}
        onAskAboutFit={(question) => handleSendMessage(question)}
      />

      {/* Interactive Resume Explorer Drawer */}
      <ResumeDrawer
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
        onAskAboutProject={(question) => handleSendMessage(question)}
        initialResumeData={resumeData}
      />

    </div>
  );
}
