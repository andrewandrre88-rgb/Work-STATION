/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { IdeasView } from './components/IdeasView';
import { TasksView } from './components/TasksView';
import { ClientsView } from './components/ClientsView';
import { FocusTimerView } from './components/FocusTimerView';
import { ScratchpadModal } from './components/ScratchpadModal';
import { QuickAddModal } from './components/QuickAddModal';
import { RefreshCw, Cloud, LogIn, FileText } from 'lucide-react';

const WorkspaceAppContent: React.FC = () => {
  const { user, loading, guestMode, signInWithGoogle } = useAuth();
  const { activeTab } = useWorkspace();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [quickAddInitialTab, setQuickAddInitialTab] = useState<'task' | 'project' | 'idea' | 'client'>('task');

  const handleOpenQuickAdd = (tab: 'task' | 'project' | 'idea' | 'client' = 'task') => {
    setQuickAddInitialTab(tab);
    setIsQuickAddOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3b1a5b] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-white/20 mb-4 tracking-wider">
          PW
        </div>
        <div className="flex items-center gap-2 text-purple-200 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
          <span>Connecting to Google Account & Firebase...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and not in guest mode, show the Continue with Google login page
  if (!user && !guestMode) {
    return <LoginPage />;
  }

  const isProjectsTab = activeTab === 'projects';

  return (
    <div className="min-h-screen bg-[#f8f6fb] text-stone-900 font-sans flex flex-col selection:bg-purple-200">
      {/* Guest Mode Callout Banner */}
      {!user && guestMode && (
        <div className="bg-[#e56824] text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 shrink-0 text-orange-100" />
              <span>
                You are currently in <strong>Guest Mode</strong> (data is saved locally in your browser).
              </span>
            </div>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="px-3 py-1 bg-white text-orange-950 font-bold rounded-md hover:bg-orange-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-600" />
              <span>Link Google Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenQuickAdd={() => handleOpenQuickAdd('task')}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
      />

      {/* Main Tab Navigation */}
      <Navigation />

      {/* Main Workspace Body: Full-width for Trello board, centered container for dashboard/tasks/ideas/clients */}
      <main className={isProjectsTab ? "flex-1 w-full flex flex-col p-0" : "flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
        {activeTab === 'dashboard' && (
          <DashboardView onOpenQuickAdd={handleOpenQuickAdd} />
        )}
        {activeTab === 'projects' && (
          <ProjectsView onOpenQuickAdd={handleOpenQuickAdd} />
        )}
        {activeTab === 'ideas' && (
          <IdeasView onOpenQuickAdd={handleOpenQuickAdd} />
        )}
        {activeTab === 'tasks' && (
          <TasksView onOpenQuickAdd={handleOpenQuickAdd} />
        )}
        {activeTab === 'focus' && <FocusTimerView />}
        {activeTab === 'clients' && (
          <ClientsView onOpenQuickAdd={handleOpenQuickAdd} />
        )}
      </main>

      {/* Quick Floating Brain Dump Button */}
      <button
        type="button"
        id="floating-scratchpad-btn"
        onClick={() => setIsScratchpadOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#48216e] hover:bg-[#3b1a5b] text-white shadow-xl hover:shadow-2xl rounded-full px-4 py-3 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-purple-900/40"
        title="Quick Scratchpad & Brain Dump"
      >
        <FileText className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-bold tracking-wide">Brain Dump</span>
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        initialTab={quickAddInitialTab}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Scratchpad Modal */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <WorkspaceAppContent />
      </WorkspaceProvider>
    </AuthProvider>
  );
}


