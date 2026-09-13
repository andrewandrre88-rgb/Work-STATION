import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  CheckSquare,
  Users,
  Target,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ActiveNavTab } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, data, activeReminders, dueTodayTasks } = useWorkspace();

  const activeProjectsCount = data.projects.filter(
    (p) => p.status === 'in_progress' || p.status === 'review'
  ).length;

  const pendingTasksCount = data.tasks.filter((t) => t.status !== 'completed').length;

  const activeIdeasCount = data.ideas.filter((i) => i.stage !== 'achieved').length;

  const pendingClientRequestsCount = data.clients.reduce(
    (acc, client) =>
      acc + client.requests.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    0
  );

  const tabs: {
    id: ActiveNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: activeReminders.length > 0 ? activeReminders.length : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'projects',
      label: 'Projects & Boards',
      icon: FolderKanban,
      badge: activeProjectsCount > 0 ? activeProjectsCount : undefined,
      badgeColor: 'bg-purple-900/50 text-purple-200',
    },
    {
      id: 'ideas',
      label: 'Ideas & Implementation',
      icon: Lightbulb,
      badge: activeIdeasCount > 0 ? activeIdeasCount : undefined,
      badgeColor: 'bg-amber-400 text-purple-950',
    },
    {
      id: 'tasks',
      label: 'Things To Do',
      icon: CheckSquare,
      badge: dueTodayTasks.length > 0 ? dueTodayTasks.length : pendingTasksCount,
      badgeColor: dueTodayTasks.length > 0 ? 'bg-rose-500 text-white' : 'bg-purple-900/50 text-purple-200',
    },
    {
      id: 'focus',
      label: 'Focus & Pomodoro',
      icon: Target,
      badge: (data.focusSessions || []).filter((s) => s.completedAt.startsWith(new Date().toISOString().split('T')[0])).length || undefined,
      badgeColor: 'bg-amber-400 text-purple-950',
    },
    {
      id: 'clients',
      label: 'Important People',
      icon: Users,
      badge: pendingClientRequestsCount > 0 ? pendingClientRequestsCount : undefined,
      badgeColor: 'bg-purple-900/50 text-purple-200',
    },
  ];

  return (
    <nav className="border-b border-purple-900/60 bg-[#3b1a5b] shadow-xs relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#3b1a5b] font-bold shadow-xs'
                    : 'text-purple-200 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#3b1a5b]' : 'text-purple-300'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-purple-100 text-purple-900' : tab.badgeColor || 'bg-white/20 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
