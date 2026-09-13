import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Bell,
  Trash2,
  Edit2,
  CheckCircle2,
  Tag,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Users,
  CornerDownRight,
  LayoutGrid,
  Play,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, Priority, TaskStatus } from '../types';
import { formatDate, formatDateTime, getRelativeDueDateLabel } from '../utils/formatters';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { TimeBoxingCard } from './TimeBoxingCard';

interface TasksViewProps {
  onOpenQuickAdd: (defaultTab?: 'task' | 'project' | 'idea' | 'client') => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenQuickAdd }) => {
  const {
    data,
    searchQuery,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    snoozeReminder,
    dismissReminder,
    startFocusForTask,
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'timebox'>('list');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'today' | 'upcoming' | 'overdue' | 'reminders' | 'completed'
  >('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Inline quick create state
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDueDate, setInlineDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [inlinePriority, setInlinePriority] = useState<Priority>('high');
  const [inlineReminder, setInlineReminder] = useState(true);

  const handleInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    addTask({
      title: inlineTitle.trim(),
      status: 'todo',
      priority: inlinePriority,
      dueDate: inlineDueDate,
      reminderEnabled: inlineReminder,
      reminderTime: inlineReminder ? `${inlineDueDate}T09:00` : undefined,
      subtasks: [],
      tags: ['Work'],
    });

    setInlineTitle('');
  };

  const handleAddSubtask = (taskId: string) => {
    const title = newSubtaskInputs[taskId];
    if (!title || !title.trim()) return;
    addSubtask(taskId, title.trim());
    setNewSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      dueDate: editingTask.dueDate,
      dueTime: editingTask.dueTime,
      reminderEnabled: editingTask.reminderEnabled,
      reminderTime: editingTask.reminderTime,
      projectId: editingTask.projectId || undefined,
      clientId: editingTask.clientId || undefined,
    });
    setEditingTask(null);
  };

  // Filter calculations
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return data.tasks.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Project filter
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;

      // Client filter
      if (selectedClientId !== 'all' && t.clientId !== selectedClientId) return false;

      // Filter tabs
      if (activeFilter === 'today') {
        return t.dueDate === todayStr && t.status !== 'completed';
      }
      if (activeFilter === 'upcoming') {
        return t.dueDate && t.dueDate > todayStr && t.status !== 'completed';
      }
      if (activeFilter === 'overdue') {
        return t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
      }
      if (activeFilter === 'reminders') {
        return t.reminderEnabled && t.status !== 'completed';
      }
      if (activeFilter === 'completed') {
        return t.status === 'completed';
      }

      // 'all' tab shows non-completed first, but includes completed
      return true;
    });
  }, [data.tasks, activeFilter, selectedProjectId, selectedClientId, searchQuery]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Completed at bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      // Urgent priority first
      const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });
  }, [filteredTasks]);

  const todayStr = new Date().toISOString().split('T')[0];
  const countDueToday = data.tasks.filter((t) => t.dueDate === todayStr && t.status !== 'completed').length;
  const countOverdue = data.tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;
  const countReminders = data.tasks.filter((t) => t.reminderEnabled && t.status !== 'completed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-rose-500" />
            Things To Do & Reminders
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Organize daily tasks, schedule reminders, and track progress across all projects.
          </p>
        </div>
        <button
          id="tasks-add-btn"
          onClick={() => onOpenQuickAdd('task')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Detailed Task
        </button>
      </div>

      {/* Productivity View Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl max-w-fit">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            viewMode === 'list'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Standard List</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('matrix')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            viewMode === 'matrix'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
          <span>Eisenhower Matrix</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('timebox')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            viewMode === 'timebox'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Daily Time-Boxing</span>
        </button>
      </div>

      {/* Eisenhower Matrix View */}
      {viewMode === 'matrix' && <EisenhowerMatrix />}

      {/* Time-Boxing Schedule View */}
      {viewMode === 'timebox' && (
        <div className="space-y-6">
          <TimeBoxingCard />
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              Today's Pending Priorities to Allocate
            </h3>
            <div className="space-y-2">
              {data.tasks
                .filter((t) => t.status !== 'completed')
                .slice(0, 5)
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-stone-800 truncate">{t.title}</span>
                    <button
                      type="button"
                      onClick={() => startFocusForTask(t.id)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current text-amber-600" />
                      <span>Start Focus</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Standard List View */}
      {viewMode === 'list' && (
        <>
      <form
        onSubmit={handleInlineAdd}
        className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a new thing to do... (e.g. Follow up on client deliverables)"
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            className="flex-1 text-xs sm:text-sm px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            disabled={!inlineTitle.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 rounded-lg transition cursor-pointer shrink-0"
          >
            Add Task
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Due:</span>
            <input
              type="date"
              value={inlineDueDate}
              onChange={(e) => setInlineDueDate(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span>Priority:</span>
            <select
              value={inlinePriority}
              onChange={(e) => setInlinePriority(e.target.value as Priority)}
              className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inlineReminder}
              onChange={(e) => setInlineReminder(e.target.checked)}
              className="rounded text-stone-900 focus:ring-stone-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <Bell className="w-3.5 h-3.5" /> Enable Reminder
            </span>
          </label>
        </div>
      </form>

      {/* Filter Tabs & Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex space-x-1 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All ({data.tasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'today'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Due Today
            {countDueToday > 0 && (
              <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                {countDueToday}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'overdue'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Overdue
            {countOverdue > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                {countOverdue}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('reminders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'reminders'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Bell className="w-3 h-3 text-amber-500" />
            Reminders ({countReminders})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Done ({data.tasks.filter((t) => t.status === 'completed').length})
          </button>
        </div>

        {/* Project & Client drop-downs */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none"
          >
            <option value="all">All Projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.title}
              </option>
            ))}
          </select>

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none"
          >
            <option value="all">All Clients</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                👤 {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-70" />
          <h3 className="text-sm font-semibold text-stone-700">No tasks in this view</h3>
          <p className="text-xs text-stone-400 mt-1">
            {searchQuery
              ? `No tasks matching "${searchQuery}".`
              : 'You are completely up to date or no tasks match the filter!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const relativeDate = getRelativeDueDateLabel(task.dueDate);
            const isCompleted = task.status === 'completed';
            const isExpanded = expandedTaskId === task.id;
            const project = data.projects.find((p) => p.id === task.projectId);
            const client = data.clients.find((c) => c.id === task.clientId);
            const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white border rounded-xl p-4 shadow-2xs transition-all ${
                  isCompleted
                    ? 'border-stone-200/60 bg-stone-50/40 opacity-75'
                    : relativeDate.isOverdue
                    ? 'border-rose-300 bg-rose-50/10'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Complete checkbox */}
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition cursor-pointer shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-stone-300 hover:border-emerald-600'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={`text-sm font-semibold tracking-tight ${
                            isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => startFocusForTask(task.id)}
                            className="p-1 px-2 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            title="Start Focus Timer on this task"
                          >
                            <Play className="w-3 h-3 fill-current text-amber-700" />
                            <span className="hidden sm:inline">Focus</span>
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Task"
                          aria-label={`Delete task ${task.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 text-[11px] mt-2.5 flex-wrap">
                      {/* Priority */}
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wider text-[10px] ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : task.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-sm ${
                            relativeDate.isOverdue
                              ? 'bg-rose-100 text-rose-700 font-bold'
                              : relativeDate.isToday
                              ? 'bg-amber-100 text-amber-800 font-semibold'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {relativeDate.label}
                          {task.dueTime && ` at ${task.dueTime}`}
                        </span>
                      )}

                      {/* Reminder status */}
                      {task.reminderEnabled && (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-sm">
                          <Bell className="w-3 h-3 text-amber-600" />
                          {task.reminderTime ? `Alert: ${formatDateTime(task.reminderTime)}` : 'Reminder set'}
                        </span>
                      )}

                      {/* Linked Project */}
                      {project && (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                          <FolderKanban className="w-3 h-3" />
                          <span className="max-w-[130px] truncate">{project.title}</span>
                        </span>
                      )}

                      {/* Linked Client */}
                      {client && (
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm font-medium">
                          <Users className="w-3 h-3" />
                          <span>{client.name}</span>
                        </span>
                      )}

                      {/* Subtask count */}
                      {task.subtasks.length > 0 && (
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="text-stone-600 hover:text-stone-900 bg-stone-100 px-2 py-0.5 rounded-sm cursor-pointer"
                        >
                          {completedSubtasks}/{task.subtasks.length} subtasks
                        </button>
                      )}
                    </div>

                    {/* Subtasks Accordion & Add Subtask */}
                    {(isExpanded || task.subtasks.length > 0) && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            Sub-items ({completedSubtasks}/{task.subtasks.length})
                          </span>
                        </div>

                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between text-xs py-0.5 group/st"
                          >
                            <label className="flex items-center gap-2 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => toggleSubtask(task.id, st.id)}
                                className="rounded text-stone-900 focus:ring-stone-500 w-3 h-3 cursor-pointer"
                              />
                              <span
                                className={`truncate ${
                                  st.completed ? 'line-through text-stone-400' : 'text-stone-700'
                                }`}
                              >
                                {st.title}
                              </span>
                            </label>
                            <button
                              onClick={() => deleteSubtask(task.id, st.id)}
                              className="text-stone-300 hover:text-rose-500 opacity-0 group-hover/st:opacity-100 transition p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Inline add subtask input */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-stone-300" />
                          <input
                            type="text"
                            placeholder="Add subtask..."
                            value={newSubtaskInputs[task.id] || ''}
                            onChange={(e) =>
                              setNewSubtaskInputs({
                                ...newSubtaskInputs,
                                [task.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubtask(task.id);
                              }
                            }}
                            className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
                          />
                          <button
                            onClick={() => handleAddSubtask(task.id)}
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 rounded cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900">Edit Task & Reminder</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={editingTask.description || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, description: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, priority: e.target.value as Priority })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate || ''}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, dueDate: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={editingTask.dueTime || ''}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, dueTime: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Reminder Config */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTask.reminderEnabled}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, reminderEnabled: e.target.checked })
                    }
                    className="rounded text-stone-900 focus:ring-stone-500 w-3.5 h-3.5"
                  />
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-amber-700" />
                    Reminder Alert Enabled
                  </span>
                </label>

                {editingTask.reminderEnabled && (
                  <div>
                    <label className="block text-[11px] font-medium text-amber-800 mb-1">
                      Reminder Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editingTask.reminderTime || ''}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, reminderTime: e.target.value })
                      }
                      className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Project
                  </label>
                  <select
                    value={editingTask.projectId || ''}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        projectId: e.target.value || undefined,
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="">No Project</option>
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Client
                  </label>
                  <select
                    value={editingTask.clientId || ''}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        clientId: e.target.value || undefined,
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="">No Client</option>
                    {data.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
