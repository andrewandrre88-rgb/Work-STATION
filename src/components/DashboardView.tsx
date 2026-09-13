import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Lightbulb,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  CheckSquare,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDate, getRelativeDueDateLabel } from '../utils/formatters';
import { Task, Project, ClientRequest, Idea } from '../types';

interface DashboardViewProps {
  onOpenQuickAdd: (defaultTab?: 'task' | 'project' | 'idea' | 'client') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickAdd }) => {
  const {
    data,
    setActiveTab,
    activeReminders,
    dueTodayTasks,
    overdueTasks,
    toggleTaskStatus,
    snoozeReminder,
    dismissReminder,
    addTask,
  } = useWorkspace();

  const [quickTaskInput, setQuickTaskInput] = useState('');

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return;
    addTask({
      title: quickTaskInput.trim(),
      status: 'todo',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      reminderEnabled: true,
      subtasks: [],
      tags: ['Quick Capture'],
    });
    setQuickTaskInput('');
  };

  // Get active projects
  const activeProjects = data.projects.filter(
    (p) => p.status === 'in_progress' || p.status === 'review'
  );

  // Get ideas in progress
  const inProgressIdeas = data.ideas.filter(
    (i) => i.stage === 'executing' || i.stage === 'planning' || i.stage === 'validation'
  );

  // All client requests pending or in progress
  const pendingClientRequests: { clientName: string; request: ClientRequest }[] = [];
  data.clients.forEach((client) => {
    client.requests.forEach((req) => {
      if (req.status === 'pending' || req.status === 'in_progress') {
        pendingClientRequests.push({ clientName: client.name, request: req });
      }
    });
  });

  const completedTodayTasks = data.tasks.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.completedAt.startsWith(today);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#48216e] via-[#5b298b] to-[#48216e] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-900/30">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-purple-100 border border-white/20">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Productivity Command Center
          </h2>
          <p className="text-purple-100/90 text-sm max-w-xl">
            Everything organized in one space: {activeProjects.length} active projects,{' '}
            {pendingClientRequests.length} client deliverables, and {inProgressIdeas.length} ideas in motion.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            id="dash-add-task-btn"
            onClick={() => onOpenQuickAdd('task')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-[#48216e] rounded-xl hover:bg-purple-50 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
          <button
            id="dash-add-idea-btn"
            onClick={() => onOpenQuickAdd('idea')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/20 rounded-xl transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
            Capture Idea
          </button>
          <button
            id="dash-add-client-btn"
            onClick={() => onOpenQuickAdd('client')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/20 rounded-xl transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-purple-200" />
            Add Client
          </button>
        </div>
      </div>

      {/* Active Reminder Notification Banner (if any alerts need attention) */}
      {activeReminders.length > 0 && (
        <div
          id="active-reminders-banner"
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-amber-900">
                You have {activeReminders.length} reminder{activeReminders.length > 1 ? 's' : ''} scheduled
                for now!
              </h2>
              <div className="mt-2 space-y-2">
                {activeReminders.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-amber-200/70"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-stone-900 truncate">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-stone-500">({task.dueDate})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 cursor-pointer"
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => snoozeReminder(task.id, 3)}
                        className="text-xs text-stone-600 hover:text-stone-900 bg-stone-100 px-2 py-1 rounded-md cursor-pointer"
                      >
                        Snooze 3h
                      </button>
                      <button
                        onClick={() => dismissReminder(task.id)}
                        className="text-xs text-stone-400 hover:text-stone-600 px-1 py-1 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Input */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="bg-white border border-stone-200 rounded-xl p-2.5 shadow-2xs flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={quickTaskInput}
          onChange={(e) => setQuickTaskInput(e.target.value)}
          placeholder="Quick capture: Add a thing to do for today with a reminder..."
          className="flex-1 text-sm bg-transparent border-none focus:outline-none text-stone-800 placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={!quickTaskInput.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
        >
          Add to Today
        </button>
      </form>

      {/* 4 Core Pillars Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Things to Do Card */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900">
              {dueTodayTasks.length + overdueTasks.length}
            </div>
            <div className="text-xs font-medium text-stone-600 mt-0.5">
              Urgent & Due Today
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {overdueTasks.length > 0 ? (
                <span className="text-rose-600 font-medium">
                  {overdueTasks.length} overdue
                </span>
              ) : (
                '0 overdue'
              )}{' '}
              • {completedTodayTasks.length} done today
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div
          onClick={() => setActiveTab('projects')}
          className="bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900">
              {activeProjects.length}
            </div>
            <div className="text-xs font-medium text-stone-600 mt-0.5">
              Active Projects
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {data.projects.length} total •{' '}
              {data.projects.filter((p) => p.status === 'completed').length} completed
            </div>
          </div>
        </div>

        {/* Ideas Card */}
        <div
          onClick={() => setActiveTab('ideas')}
          className="bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900">
              {data.ideas.length}
            </div>
            <div className="text-xs font-medium text-stone-600 mt-0.5">
              Ideas Pipeline
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {data.ideas.filter((i) => i.stage === 'executing').length} executing •{' '}
              <span className="text-emerald-600 font-medium">
                {data.ideas.filter((i) => i.stage === 'achieved').length} achieved
              </span>
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div
          onClick={() => setActiveTab('clients')}
          className="bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900">
              {pendingClientRequests.length}
            </div>
            <div className="text-xs font-medium text-stone-600 mt-0.5">
              Client Deliverables
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Across {data.clients.length} important people
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Priorities & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Focus List */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Today's Priorities & Reminders
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
              >
                View all tasks <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {data.tasks.filter((t) => t.status !== 'completed').length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                No pending tasks! Add one with the input above.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {data.tasks
                  .filter((t) => t.status !== 'completed')
                  .slice(0, 6)
                  .map((task) => {
                    const relative = getRelativeDueDateLabel(task.dueDate);
                    const linkedClient = data.clients.find((c) => c.id === task.clientId);
                    const linkedProject = data.projects.find((p) => p.id === task.projectId);

                    return (
                      <div
                        key={task.id}
                        className="py-3 flex items-start gap-3 group hover:bg-stone-50/60 rounded-lg px-2 -mx-2 transition"
                      >
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-0.5 w-5 h-5 rounded-md border-2 border-stone-300 hover:border-emerald-500 flex items-center justify-center transition cursor-pointer shrink-0"
                          title="Complete task"
                        >
                          {task.status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-stone-900">
                              {task.title}
                            </span>
                            {task.priority === 'urgent' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-sm">
                                Urgent
                              </span>
                            )}
                            {task.reminderEnabled && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-sm"
                                title="Reminder active"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                Reminder
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 flex-wrap">
                            {task.dueDate && (
                              <span
                                className={`font-medium ${
                                  relative.isOverdue
                                    ? 'text-rose-600'
                                    : relative.isToday
                                    ? 'text-amber-700'
                                    : 'text-stone-500'
                                }`}
                              >
                                {relative.label}
                              </span>
                            )}

                            {linkedProject && (
                              <>
                                <span>•</span>
                                <span className="text-stone-600 truncate max-w-[120px]">
                                  📁 {linkedProject.title}
                                </span>
                              </>
                            )}

                            {linkedClient && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium truncate max-w-[120px]">
                                  👤 {linkedClient.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Active Projects Snapshot */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-stone-900">Active Projects</h3>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
              >
                All projects <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeProjects.map((project) => {
                const totalMilestones = project.milestones.length;
                const completedMilestones = project.milestones.filter((m) => m.completed).length;
                const progressPct =
                  totalMilestones > 0
                    ? Math.round((completedMilestones / totalMilestones) * 100)
                    : 0;

                return (
                  <div
                    key={project.id}
                    onClick={() => setActiveTab('projects')}
                    className="p-3.5 border border-stone-200 rounded-xl hover:border-stone-300 transition cursor-pointer bg-stone-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: `${project.color}15`,
                          color: project.color,
                        }}
                      >
                        {project.category}
                      </span>
                      {project.dueDate && (
                        <span className="text-[11px] text-stone-500">
                          Due {formatDate(project.dueDate)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-stone-900 mt-2 line-clamp-1">
                      {project.title}
                    </h4>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                        <span>Milestones</span>
                        <span>
                          {completedMilestones}/{totalMilestones} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: project.color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Important People Requests & Ideas Spotlight */}
        <div className="space-y-6">
          {/* Important People: What they want me to do */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Client Requests
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('clients')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Directory
              </button>
            </div>

            {pendingClientRequests.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                No pending requests from your clients.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingClientRequests.slice(0, 4).map(({ clientName, request }) => {
                  const relative = getRelativeDueDateLabel(request.dueDate);
                  return (
                    <div
                      key={request.id}
                      onClick={() => setActiveTab('clients')}
                      className="p-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="font-semibold text-indigo-700 truncate">
                          {clientName}
                        </span>
                        {request.dueDate && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm ${
                              relative.isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {relative.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-stone-900 mt-1 line-clamp-1">
                        {request.title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                        {request.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ideas in Execution */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Ideas In Motion
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('ideas')}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                All Ideas
              </button>
            </div>

            <div className="space-y-3">
              {data.ideas.slice(0, 3).map((idea) => {
                const totalM = idea.milestones.length;
                const doneM = idea.milestones.filter((m) => m.completed).length;
                const pct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

                return (
                  <div
                    key={idea.id}
                    onClick={() => setActiveTab('ideas')}
                    className="p-3 border border-stone-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/20 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-semibold uppercase tracking-wider text-amber-700">
                        {idea.stage}
                      </span>
                      <span className="text-stone-400">{doneM}/{totalM} steps</span>
                    </div>

                    <p className="text-xs font-semibold text-stone-900 mt-1 line-clamp-1">
                      {idea.title}
                    </p>

                    <div className="mt-2 w-full bg-stone-100 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-1 bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
