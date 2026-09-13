import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Task } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { isDueToday, isOverdue, formatDisplayDate } from '../utils/formatters';

interface QuadrantConfig {
  id: 'q1' | 'q2' | 'q3' | 'q4';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    id: 'q1',
    title: 'Do First (Urgent & Important)',
    subtitle: 'Crises, pressing deadlines, and critical client deliverables',
    badge: 'Immediate Action',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    borderColor: 'border-rose-300/80',
    bgColor: 'bg-rose-50/20',
  },
  {
    id: 'q2',
    title: 'Schedule (Important & Not Urgent)',
    subtitle: 'Strategic initiatives, deep design flow, long-term leverage',
    badge: 'Deep Work Flow',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-amber-300/80',
    bgColor: 'bg-amber-50/20',
  },
  {
    id: 'q3',
    title: 'Delegate / Batch (Urgent & Low Priority)',
    subtitle: 'Quick operational requests, minor notifications, administrative updates',
    badge: 'Quick Wins',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-300/80',
    bgColor: 'bg-blue-50/20',
  },
  {
    id: 'q4',
    title: 'Backlog (Not Urgent & Low Priority)',
    subtitle: 'Ideas to review when core priorities are delivered',
    badge: 'Backlog / Trim',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
    borderColor: 'border-stone-200',
    bgColor: 'bg-stone-50/40',
  },
];

export const EisenhowerMatrix: React.FC = () => {
  const { data, toggleTaskStatus, startFocusForTask, addTask } = useWorkspace();
  const [quickAddQuadrant, setQuickAddQuadrant] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const activeTasks = data.tasks.filter((t) => t.status !== 'completed');

  // Categorize tasks into Eisenhower 4 quadrants
  const q1Tasks: Task[] = [];
  const q2Tasks: Task[] = [];
  const q3Tasks: Task[] = [];
  const q4Tasks: Task[] = [];

  activeTasks.forEach((task) => {
    const isUrgent = (task.dueDate && (isDueToday(task.dueDate) || isOverdue(task.dueDate))) || task.priority === 'urgent';
    const isImportant = task.priority === 'urgent' || task.priority === 'high';

    if (isUrgent && isImportant) {
      q1Tasks.push(task);
    } else if (!isUrgent && isImportant) {
      q2Tasks.push(task);
    } else if (isUrgent && !isImportant) {
      q3Tasks.push(task);
    } else {
      q4Tasks.push(task);
    }
  });

  const getQuadrantTasks = (id: string) => {
    switch (id) {
      case 'q1':
        return q1Tasks;
      case 'q2':
        return q2Tasks;
      case 'q3':
        return q3Tasks;
      case 'q4':
        return q4Tasks;
      default:
        return [];
    }
  };

  const handleQuickAdd = (quadrantId: string) => {
    if (!quickTitle.trim()) return;

    let priority: Task['priority'] = 'medium';
    let dueDate: string | undefined = undefined;

    const todayStr = new Date().toISOString().split('T')[0];

    if (quadrantId === 'q1') {
      priority = 'urgent';
      dueDate = todayStr;
    } else if (quadrantId === 'q2') {
      priority = 'high';
    } else if (quadrantId === 'q3') {
      priority = 'low';
      dueDate = todayStr;
    } else {
      priority = 'low';
    }

    addTask({
      title: quickTitle.trim(),
      priority,
      status: 'pending',
      dueDate,
      tags: ['Eisenhower'],
    });

    setQuickTitle('');
    setQuickAddQuadrant(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((quad) => {
          const tasks = getQuadrantTasks(quad.id);
          const isAdding = quickAddQuadrant === quad.id;

          return (
            <div
              key={quad.id}
              className={`border ${quad.borderColor} ${quad.bgColor} bg-white rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col min-h-[280px] transition`}
            >
              {/* Quadrant Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${quad.badgeColor}`}>
                      {quad.badge}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1">
                    {quad.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                    {quad.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickAddQuadrant(isAdding ? null : quad.id);
                    setQuickTitle('');
                  }}
                  className="p-1.5 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg hover:border-stone-300 transition cursor-pointer text-xs shrink-0"
                  title="Add task to this quadrant"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Quick Add Input */}
              {isAdding && (
                <div className="mt-3 p-2.5 bg-white border border-stone-200 rounded-xl shadow-xs space-y-2">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="New outcome title..."
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(quad.id);
                      if (e.key === 'Escape') setQuickAddQuadrant(null);
                    }}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickAddQuadrant(null)}
                      className="px-2 py-1 text-[11px] text-stone-500 hover:text-stone-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(quad.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-stone-900 text-white rounded-md hover:bg-stone-800 cursor-pointer"
                    >
                      Add to {quad.id.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}

              {/* Task Items */}
              <div className="flex-1 space-y-2 mt-3 overflow-y-auto max-h-[300px] pr-1">
                {tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 text-stone-400">
                    <p className="text-xs">No pending tasks in this quadrant</p>
                    <button
                      type="button"
                      onClick={() => setQuickAddQuadrant(quad.id)}
                      className="text-[11px] text-stone-600 font-medium hover:underline mt-1 cursor-pointer"
                    >
                      + Add priority here
                    </button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-white border border-stone-200/90 hover:border-stone-300 rounded-xl p-3 shadow-2xs transition flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          className="text-stone-400 hover:text-emerald-600 transition cursor-pointer shrink-0"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-stone-800 block truncate">
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span
                              className={`text-[10px] font-medium flex items-center gap-1 ${
                                isOverdue(task.dueDate)
                                  ? 'text-rose-600 font-bold'
                                  : isDueToday(task.dueDate)
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-stone-400'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDisplayDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action: Quick Pomodoro Focus Launch */}
                      <button
                        type="button"
                        onClick={() => startFocusForTask(task.id)}
                        className="opacity-80 group-hover:opacity-100 px-2 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 rounded-lg text-[10px] font-bold flex items-center gap-1 text-stone-700 transition cursor-pointer shrink-0"
                        title="Start Pomodoro Focus on this task"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Focus</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
