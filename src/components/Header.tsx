import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Clock,
  Briefcase,
  Lightbulb,
  Users,
  CheckSquare,
  AlertCircle,
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  LogIn,
  ShieldCheck,
  User as UserIcon,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getRelativeDueDateLabel } from '../utils/formatters';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenScratchpad?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd, onOpenScratchpad }) => {
  const { user, signOutUser, signInWithGoogle } = useAuth();
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    activeReminders,
    dismissReminder,
    snoozeReminder,
    toggleTaskStatus,
    exportWorkspaceJson,
    importWorkspaceJson,
    resetToSampleData,
    syncStatus,
    lastSyncedAt,
    syncError,
    isCloudSynced,
    forceSyncNow,
  } = useWorkspace();

  const [showRemindersDropdown, setShowRemindersDropdown] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await forceSyncNow();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importWorkspaceJson(content);
        if (success) {
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus('Invalid backup file format.');
          setTimeout(() => setImportStatus(null), 3500);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowBackupMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#48216e] text-white border-b border-purple-900/40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          {/* Logo / Workspace Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm shadow-xs border border-white/20 shrink-0 tracking-wider">
              PW
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight truncate">
                Productivity Workspace
              </h1>
              <p className="text-[11px] text-purple-200/80 hidden sm:block">
                Projects, Boards, Tasks & Ideas
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search boards, tasks, ideas, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white/15 text-white placeholder:text-purple-200/70 border border-white/15 rounded-xl focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-400 focus:outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Add Button */}
            <button
              id="header-quick-add-btn"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-[#48216e] bg-white hover:bg-purple-50 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Item</span>
            </button>

            {/* Quick Scratchpad / Brain Dump Button */}
            {onOpenScratchpad && (
              <button
                id="header-scratchpad-btn"
                onClick={onOpenScratchpad}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/15 transition-colors cursor-pointer shrink-0"
                title="Quick Scratchpad & Brain Dump"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">Scratchpad</span>
              </button>
            )}

            {/* Reminders Bell with active badge */}
            <div className="relative">
              <button
                id="reminders-bell-btn"
                onClick={() => setShowRemindersDropdown(!showRemindersDropdown)}
                className="relative p-2 text-purple-200 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Active Reminders"
              >
                <Bell className="w-5 h-5" />
                {activeReminders.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-purple-950 shadow-xs">
                    {activeReminders.length}
                  </span>
                )}
              </button>

              {/* Reminders dropdown */}
              {showRemindersDropdown && (
                <div
                  id="reminders-dropdown-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h2 className="text-sm font-semibold text-stone-900">
                        Reminders ({activeReminders.length})
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowRemindersDropdown(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto mt-2">
                    {activeReminders.length === 0 ? (
                      <div className="py-6 text-center text-stone-500 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        You're all caught up! No active reminders right now.
                      </div>
                    ) : (
                      activeReminders.map((task) => {
                        const relative = getRelativeDueDateLabel(task.dueDate);
                        return (
                          <div key={task.id} className="py-3 flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-medium text-stone-900 line-clamp-2">
                                {task.title}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 ${
                                  relative.isOverdue
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {relative.label}
                              </span>
                            </div>

                            {task.reminderTime && (
                              <p className="text-[11px] text-stone-500">
                                Alert set for: {formatDateTime(task.reminderTime)}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => toggleTaskStatus(task.id)}
                                className="text-[11px] text-emerald-700 hover:underline font-medium cursor-pointer"
                              >
                                Mark Done
                              </button>
                              <span className="text-stone-300">•</span>
                              <button
                                onClick={() => snoozeReminder(task.id, 3)}
                                className="text-[11px] text-stone-600 hover:text-stone-900 cursor-pointer"
                              >
                                Snooze 3h
                              </button>
                              <span className="text-stone-300">•</span>
                              <button
                                onClick={() => dismissReminder(task.id)}
                                className="text-[11px] text-stone-400 hover:text-stone-600 cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Backup / Options Menu */}
            <div className="relative">
              <button
                id="workspace-settings-menu-btn"
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                className="p-2 text-purple-200 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Workspace Options"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {showBackupMenu && (
                <div
                  id="workspace-backup-menu"
                  className="absolute right-0 mt-2 w-56 bg-white text-stone-900 border border-stone-200 rounded-xl shadow-xl z-50 p-2 text-xs"
                >
                  <div className="px-3 py-1.5 font-semibold text-stone-500 border-b border-stone-100 mb-1">
                    Data & Backup
                  </div>

                  <button
                    onClick={() => {
                      exportWorkspaceJson();
                      setShowBackupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-stone-500" />
                    Export Workspace JSON
                  </button>

                  <label className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 rounded-lg text-left cursor-pointer">
                    <Upload className="w-4 h-4 text-stone-500" />
                    Import Backup File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="my-1 border-t border-stone-100" />

                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmReset) {
                        setConfirmReset(true);
                        return;
                      }
                      resetToSampleData();
                      setConfirmReset(false);
                      setShowBackupMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer transition ${
                      confirmReset
                        ? 'bg-rose-600 text-white font-medium hover:bg-rose-700'
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <RotateCcw className={`w-4 h-4 ${confirmReset ? 'text-white' : 'text-rose-500'}`} />
                    {confirmReset ? 'Click again to confirm reset' : 'Reset to Sample Data'}
                  </button>
                </div>
              )}
            </div>

            {/* Cloud Sync Status Indicator & User Menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  id="header-user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2.5 hover:bg-white/15 bg-white/10 rounded-xl transition cursor-pointer border border-white/20 text-white"
                  title="Google Account & Cloud Sync"
                >
                  {/* Sync status pill indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-100 pr-1 hidden sm:flex">
                    {syncStatus === 'syncing' || isManualSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 text-purple-200 animate-spin" />
                    ) : syncStatus === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                    <span className="hidden md:inline">
                      {syncStatus === 'syncing' || isManualSyncing ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Synced'}
                    </span>
                  </div>

                  {/* User avatar or Initials in signature orange circle */}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-white/40 shadow-xs"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full bg-[#e56824] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white/30"
                      title={user.email || ''}
                    >
                      AA
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div
                    id="header-user-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white text-stone-900 border border-stone-200 rounded-2xl shadow-xl z-50 p-3 text-xs"
                  >
                    {/* User Header */}
                    <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Google User'}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#e56824] text-white flex items-center justify-center font-bold text-sm">
                          AA
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 truncate">
                          {user.displayName || 'Andrew Andre'}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {user.email || 'andrewandrre88@gmail.com'}
                        </p>
                      </div>
                    </div>

                    {/* Firestore Sync Info */}
                    <div className="my-2.5 p-2 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Cloud className="w-3.5 h-3.5 text-purple-600" />
                          Firestore Database
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {lastSyncedAt ? `Last saved: ${formatDateTime(lastSyncedAt)}` : 'Auto-sync enabled'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={handleManualSync}
                        disabled={isManualSyncing}
                        className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-purple-50 rounded-lg text-left cursor-pointer transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isManualSyncing ? 'animate-spin' : ''}`} />
                        <span>{isManualSyncing ? 'Syncing to Firestore...' : 'Sync Now with Cloud'}</span>
                      </button>

                      <div className="my-1 border-t border-stone-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          signOutUser();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-left cursor-pointer transition font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out of Google</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="header-sign-in-btn"
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-purple-50 rounded-xl text-xs font-bold text-[#48216e] shadow-sm transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#e56824] text-white flex items-center justify-center font-bold text-[10px]">
                  AA
                </div>
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200" />
            <input
              type="text"
              placeholder="Search boards, tasks, ideas, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white/15 text-white placeholder:text-purple-200/70 border border-white/15 rounded-xl focus:bg-white focus:text-stone-900 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {importStatus && (
          <div className="mb-2 py-1 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
            {importStatus}
          </div>
        )}
      </div>
    </header>
  );
};
