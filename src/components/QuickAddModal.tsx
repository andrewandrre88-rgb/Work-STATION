import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  FolderKanban,
  Lightbulb,
  Users,
  Bell,
  Calendar,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Priority, ProjectStatus, IdeaStage, ClientStatus } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  initialTab?: 'task' | 'project' | 'idea' | 'client';
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialTab = 'task',
  onClose,
}) => {
  const { data, addTask, addProject, addIdea, addClient } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'task' | 'project' | 'idea' | 'client'>(initialTab);

  // Sync with initialTab prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('high');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('17:00');
  const [taskReminder, setTaskReminder] = useState(true);
  const [taskReminderTime, setTaskReminderTime] = useState(
    `${new Date().toISOString().split('T')[0]}T09:00`
  );
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskClientId, setTaskClientId] = useState('');

  // Project Form State
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCategory, setProjCategory] = useState('Product Design');
  const [projStatus, setProjStatus] = useState<ProjectStatus>('in_progress');
  const [projPriority, setProjPriority] = useState<Priority>('high');
  const [projDueDate, setProjDueDate] = useState('');
  const [projClientId, setProjClientId] = useState('');
  const [projColor, setProjColor] = useState('#3b82f6');

  // Idea Form State
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaSummary, setIdeaSummary] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('Innovation');
  const [ideaStage, setIdeaStage] = useState<IdeaStage>('spark');
  const [ideaImpact, setIdeaImpact] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [ideaEffort, setIdeaEffort] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [ideaTargetDate, setIdeaTargetDate] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [ideaStep1, setIdeaStep1] = useState('');

  // Client Form State
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientFirstRequest, setClientFirstRequest] = useState('');

  if (!isOpen) return null;

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      status: 'todo',
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      dueTime: taskDueTime || undefined,
      reminderEnabled: taskReminder,
      reminderTime: taskReminder ? taskReminderTime : undefined,
      projectId: taskProjectId || undefined,
      clientId: taskClientId || undefined,
      subtasks: [],
      tags: ['Work'],
    });

    onClose();
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    addProject({
      title: projTitle.trim(),
      description: projDesc.trim(),
      color: projColor,
      category: projCategory.trim() || 'General',
      status: projStatus,
      priority: projPriority,
      dueDate: projDueDate || undefined,
      clientId: projClientId || undefined,
      milestones: [
        { id: 'm_init', title: 'Define project requirements and scope', completed: false },
      ],
      tags: [projCategory],
    });

    onClose();
  };

  const handleIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    const milestones = ideaStep1.trim()
      ? [{ id: 'im_1', title: ideaStep1.trim(), completed: false }]
      : [{ id: 'im_1', title: 'Validate market/user interest', completed: false }];

    addIdea({
      title: ideaTitle.trim(),
      summary: ideaSummary.trim(),
      category: ideaCategory.trim() || 'General',
      stage: ideaStage,
      impact: ideaImpact,
      effort: ideaEffort,
      targetDate: ideaTargetDate || undefined,
      notes: ideaNotes.trim(),
      color: '#f59e0b',
      tags: [ideaCategory],
      milestones,
    });

    onClose();
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newClient = addClient({
      name: clientName.trim(),
      company: clientCompany.trim() || 'Independent',
      role: clientRole.trim() || undefined,
      email: clientEmail.trim(),
      phone: clientPhone.trim() || undefined,
      avatarColor: randomColor,
      notes: clientNotes.trim(),
      status: 'active',
    });

    if (clientFirstRequest.trim()) {
      // Add first deliverable for this client
      newClient.requests.push({
        id: `req_${Date.now()}`,
        clientId: newClient.id,
        title: clientFirstRequest.trim(),
        details: 'Initial request from client onboarding.',
        status: 'pending',
        priority: 'high',
        createdAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header & Tab Chooser */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'task'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Task
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('project')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'project'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Project
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('idea')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'idea'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Idea
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('client')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'client'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Client
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. TASK FORM */}
        {activeTab === 'task' && (
          <form onSubmit={handleTaskSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Thing to do *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="What needs to get done?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Key details, checklist or requirements..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>

            {/* Reminder Alert Section */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={taskReminder}
                  onChange={(e) => setTaskReminder(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-700" />
                  Set Reminder Alert
                </span>
              </label>

              {taskReminder && (
                <div>
                  <label className="block text-[11px] font-medium text-amber-800 mb-1">
                    Alert Time
                  </label>
                  <input
                    type="datetime-local"
                    value={taskReminderTime}
                    onChange={(e) => setTaskReminderTime(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Linkage options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Link to Project
                </label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="">None (Standalone)</option>
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
                  value={taskClientId}
                  onChange={(e) => setTaskClientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="">None</option>
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer shadow-xs"
              >
                Add Task
              </button>
            </div>
          </form>
        )}

        {/* 2. PROJECT FORM */}
        {activeTab === 'project' && (
          <form onSubmit={handleProjectSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Website Overhaul, Marketing Campaign"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description & Goals
              </label>
              <textarea
                rows={2}
                placeholder="Primary objective and scope..."
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design, Dev, Marketing"
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={projDueDate}
                  onChange={(e) => setProjDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Assigned Client
                </label>
                <select
                  value={projClientId}
                  onChange={(e) => setProjClientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="">Internal Work (No Client)</option>
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Priority
                </label>
                <select
                  value={projPriority}
                  onChange={(e) => setProjPriority(e.target.value as Priority)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer shadow-xs"
              >
                Create Project
              </button>
            </div>
          </form>
        )}

        {/* 3. IDEA FORM */}
        {activeTab === 'idea' && (
          <form onSubmit={handleIdeaSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Idea Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="What is your new idea?"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Summary / Concept
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe the concept and value..."
                value={ideaSummary}
                onChange={(e) => setIdeaSummary(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. SaaS, Product, Service"
                  value={ideaCategory}
                  onChange={(e) => setIdeaCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Starting Stage
                </label>
                <select
                  value={ideaStage}
                  onChange={(e) => setIdeaStage(e.target.value as IdeaStage)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="spark">💡 Spark (Raw Concept)</option>
                  <option value="validation">🔍 Validation (Testing Viability)</option>
                  <option value="planning">📋 Planning (Action Roadmap)</option>
                  <option value="executing">🚀 Executing (In Build)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Estimated Impact (1-5)
                </label>
                <select
                  value={ideaImpact}
                  onChange={(e) => setIdeaImpact(parseInt(e.target.value, 10) as any)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="1">1 - Minor</option>
                  <option value="2">2 - Modest</option>
                  <option value="3">3 - Solid</option>
                  <option value="4">4 - High Impact</option>
                  <option value="5">5 - Game Changer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={ideaTargetDate}
                  onChange={(e) => setIdeaTargetDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                First Action Step to Implement this Idea
              </label>
              <input
                type="text"
                placeholder="e.g. Research existing solutions, create wireframe..."
                value={ideaStep1}
                onChange={(e) => setIdeaStep1(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-xs"
              >
                Save Idea
              </button>
            </div>
          </form>
        )}

        {/* 4. CLIENT FORM */}
        {activeTab === 'client' && (
          <form onSubmit={handleClientSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Client / Contact Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Sarah Jenkins"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. VP Marketing"
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                What does this client want you to do? (First Request)
              </label>
              <input
                type="text"
                placeholder="e.g. Build monthly analytics report, design new logo..."
                value={clientFirstRequest}
                onChange={(e) => setClientFirstRequest(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Relationship Notes & Context
              </label>
              <textarea
                rows={2}
                placeholder="Working style, expectations, payment terms..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs"
              >
                Add Client
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
