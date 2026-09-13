import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  WorkspaceData,
  Project,
  Task,
  Client,
  ClientRequest,
  Idea,
  Habit,
  FocusSession,
  TimeBlock,
  ActiveNavTab,
  TaskStatus,
  ProjectMilestone,
  IdeaMilestone,
  IdeaStage,
  ClientRequestStatus,
  TrelloBoard,
  TrelloList,
  TrelloCard,
} from '../types';
import { INITIAL_WORKSPACE_DATA } from '../data/initialData';
import { generateId, fireCelebrationConfetti } from '../utils/formatters';

const STORAGE_KEY = 'productivity_workspace_data_v1';

interface WorkspaceContextType {
  data: WorkspaceData;
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeReminders: Task[];
  dueTodayTasks: Task[];
  overdueTasks: Task[];
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  snoozeReminder: (taskId: string, hours?: number) => void;
  dismissReminder: (taskId: string) => void;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;
  addProjectMilestone: (projectId: string, title: string, dueDate?: string) => void;
  deleteProjectMilestone: (projectId: string, milestoneId: string) => void;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'requests'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientRequest: (clientId: string, request: Omit<ClientRequest, 'id' | 'clientId' | 'createdAt'>) => ClientRequest;
  updateClientRequest: (clientId: string, requestId: string, updates: Partial<ClientRequest>) => void;
  deleteClientRequest: (clientId: string, requestId: string) => void;
  toggleClientRequestStatus: (clientId: string, requestId: string) => void;
  convertClientRequestToTask: (clientId: string, requestId: string) => Task;

  // Idea Actions
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  updateIdeaStage: (id: string, stage: IdeaStage) => void;
  toggleIdeaMilestone: (ideaId: string, milestoneId: string) => void;
  addIdeaMilestone: (ideaId: string, title: string) => void;
  deleteIdeaMilestone: (ideaId: string, milestoneId: string) => void;
  convertIdeaToProject: (ideaId: string) => Project;

  // Habits & Streak Tracking
  toggleHabit: (habitId: string, targetDate?: string) => void;
  addHabit: (title: string, category?: string) => void;
  deleteHabit: (habitId: string) => void;

  // Scratchpad
  scratchpad: string;
  updateScratchpad: (text: string) => void;

  // Focus Sessions / Pomodoro
  logFocusSession: (session: Omit<FocusSession, 'id' | 'completedAt'>) => void;
  activeFocusTaskId: string | null;
  setActiveFocusTaskId: (taskId: string | null) => void;
  startFocusForTask: (taskId: string) => void;

  // Time Blocks / Daily Schedule Planner
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  toggleTimeBlock: (id: string) => void;
  deleteTimeBlock: (id: string) => void;

  // Trello Boards, Lists, and Cards
  activeBoardId: string;
  setActiveBoardId: (id: string) => void;
  addTrelloBoard: (title: string, backgroundColor?: string) => TrelloBoard;
  updateTrelloBoard: (id: string, updates: Partial<TrelloBoard>) => void;
  deleteTrelloBoard: (id: string) => void;
  addTrelloList: (title: string, boardId?: string) => TrelloList;
  updateTrelloList: (id: string, title: string) => void;
  deleteTrelloList: (id: string) => void;
  reorderTrelloLists: (lists: TrelloList[]) => void;
  addTrelloCard: (card: Omit<TrelloCard, 'id' | 'createdAt' | 'order'>) => TrelloCard;
  updateTrelloCard: (id: string, updates: Partial<TrelloCard>) => void;
  moveTrelloCard: (cardId: string, targetListId: string, newOrder?: number) => void;
  deleteTrelloCard: (id: string) => void;
  toggleTrelloCardComplete: (id: string) => void;
  addTrelloInboxCard: (title: string, description?: string, coverImage?: string) => TrelloCard;
  moveInboxCardToBoard: (cardId: string, targetListId: string) => void;
  deleteTrelloInboxCard: (id: string) => void;

  // Global utilities
  exportWorkspaceJson: () => void;
  importWorkspaceJson: (jsonString: string) => boolean;
  resetToSampleData: () => void;

  // Cloud Sync & Auth
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
  syncError: string | null;
  isCloudSynced: boolean;
  forceSyncNow: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Helper to remove undefined properties which Firestore rejects
function sanitizeDataForFirestore<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload));
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<WorkspaceData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projects && parsed.tasks && parsed.clients && parsed.ideas) {
          return {
            ...INITIAL_WORKSPACE_DATA,
            ...parsed,
            habits: Array.isArray(parsed.habits) ? parsed.habits : INITIAL_WORKSPACE_DATA.habits || [],
            scratchpad: typeof parsed.scratchpad === 'string' ? parsed.scratchpad : INITIAL_WORKSPACE_DATA.scratchpad || '',
            focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : INITIAL_WORKSPACE_DATA.focusSessions || [],
            timeBlocks: Array.isArray(parsed.timeBlocks) ? parsed.timeBlocks : INITIAL_WORKSPACE_DATA.timeBlocks || [],
            trelloBoards: Array.isArray(parsed.trelloBoards) && parsed.trelloBoards.length > 0 ? parsed.trelloBoards : INITIAL_WORKSPACE_DATA.trelloBoards || [],
            trelloLists: Array.isArray(parsed.trelloLists) && parsed.trelloLists.length > 0 ? parsed.trelloLists : INITIAL_WORKSPACE_DATA.trelloLists || [],
            trelloCards: Array.isArray(parsed.trelloCards) ? parsed.trelloCards : INITIAL_WORKSPACE_DATA.trelloCards || [],
            trelloInbox: Array.isArray(parsed.trelloInbox) ? parsed.trelloInbox : INITIAL_WORKSPACE_DATA.trelloInbox || [],
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored workspace data, using defaults', e);
    }
    return INITIAL_WORKSPACE_DATA;
  });

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string>('board_default');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication & Cloud Sync
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // When user signs in or changes, fetch and subscribe to their userWorkspaces document
  useEffect(() => {
    if (!user) {
      initialLoadDoneRef.current = false;
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');
    const docRef = doc(db, 'userWorkspaces', user.uid);

    // Initial load from Firestore
    getDoc(docRef)
      .then((snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          if (Array.isArray(cloudData.projects) && Array.isArray(cloudData.tasks)) {
            isRemoteUpdateRef.current = true;
            setData({
              projects: cloudData.projects || [],
              tasks: cloudData.tasks || [],
              clients: cloudData.clients || [],
              ideas: cloudData.ideas || [],
              habits: cloudData.habits || INITIAL_WORKSPACE_DATA.habits || [],
              scratchpad: typeof cloudData.scratchpad === 'string' ? cloudData.scratchpad : (INITIAL_WORKSPACE_DATA.scratchpad || ''),
              focusSessions: cloudData.focusSessions || INITIAL_WORKSPACE_DATA.focusSessions || [],
              timeBlocks: cloudData.timeBlocks || INITIAL_WORKSPACE_DATA.timeBlocks || [],
              trelloBoards: Array.isArray(cloudData.trelloBoards) && cloudData.trelloBoards.length > 0 ? cloudData.trelloBoards : (INITIAL_WORKSPACE_DATA.trelloBoards || []),
              trelloLists: Array.isArray(cloudData.trelloLists) && cloudData.trelloLists.length > 0 ? cloudData.trelloLists : (INITIAL_WORKSPACE_DATA.trelloLists || []),
              trelloCards: Array.isArray(cloudData.trelloCards) ? cloudData.trelloCards : (INITIAL_WORKSPACE_DATA.trelloCards || []),
              trelloInbox: Array.isArray(cloudData.trelloInbox) ? cloudData.trelloInbox : (INITIAL_WORKSPACE_DATA.trelloInbox || []),
            });
            setLastSyncedAt(cloudData.updatedAt || new Date().toISOString());
            setSyncStatus('synced');
            setSyncError(null);
          }
        } else {
          // If brand new account, save current workspace data to Firestore to link it
          const now = new Date().toISOString();
          setDoc(
            docRef,
            sanitizeDataForFirestore({
              userId: user.uid,
              projects: data.projects,
              tasks: data.tasks,
              clients: data.clients,
              ideas: data.ideas,
              habits: data.habits || [],
              scratchpad: data.scratchpad || '',
              focusSessions: data.focusSessions || [],
              timeBlocks: data.timeBlocks || [],
              trelloBoards: data.trelloBoards || INITIAL_WORKSPACE_DATA.trelloBoards || [],
              trelloLists: data.trelloLists || INITIAL_WORKSPACE_DATA.trelloLists || [],
              trelloCards: data.trelloCards || INITIAL_WORKSPACE_DATA.trelloCards || [],
              trelloInbox: data.trelloInbox || INITIAL_WORKSPACE_DATA.trelloInbox || [],
              updatedAt: now,
            }),
            { merge: true }
          )
            .then(() => {
              setLastSyncedAt(now);
              setSyncStatus('synced');
              setSyncError(null);
            })
            .catch((err) => {
              console.error('Initial Firestore link error:', err);
              setSyncStatus('error');
              setSyncError(err.message || 'Failed to initialize Firestore workspace');
            });
        }
        initialLoadDoneRef.current = true;
      })
      .catch((err) => {
        console.error('Firestore getDoc error:', err);
        setSyncStatus('error');
        setSyncError(err.message);
        initialLoadDoneRef.current = true;
      });

    // Real-time listener for remote changes
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists() || snapshot.metadata.hasPendingWrites) {
          return;
        }
        const cloudData = snapshot.data();
        if (Array.isArray(cloudData.projects) && Array.isArray(cloudData.tasks)) {
          isRemoteUpdateRef.current = true;
          setData({
            projects: cloudData.projects || [],
            tasks: cloudData.tasks || [],
            clients: cloudData.clients || [],
            ideas: cloudData.ideas || [],
            habits: cloudData.habits || INITIAL_WORKSPACE_DATA.habits || [],
            scratchpad: typeof cloudData.scratchpad === 'string' ? cloudData.scratchpad : (INITIAL_WORKSPACE_DATA.scratchpad || ''),
            focusSessions: cloudData.focusSessions || INITIAL_WORKSPACE_DATA.focusSessions || [],
            timeBlocks: cloudData.timeBlocks || INITIAL_WORKSPACE_DATA.timeBlocks || [],
            trelloBoards: Array.isArray(cloudData.trelloBoards) && cloudData.trelloBoards.length > 0 ? cloudData.trelloBoards : (INITIAL_WORKSPACE_DATA.trelloBoards || []),
            trelloLists: Array.isArray(cloudData.trelloLists) && cloudData.trelloLists.length > 0 ? cloudData.trelloLists : (INITIAL_WORKSPACE_DATA.trelloLists || []),
            trelloCards: Array.isArray(cloudData.trelloCards) ? cloudData.trelloCards : (INITIAL_WORKSPACE_DATA.trelloCards || []),
            trelloInbox: Array.isArray(cloudData.trelloInbox) ? cloudData.trelloInbox : (INITIAL_WORKSPACE_DATA.trelloInbox || []),
          });
          setLastSyncedAt(cloudData.updatedAt || new Date().toISOString());
          setSyncStatus('synced');
          setSyncError(null);
        }
      },
      (err) => {
        console.warn('Firestore onSnapshot listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Debounced auto-save to Firestore on data changes
  useEffect(() => {
    if (!user || !initialLoadDoneRef.current) return;

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const docRef = doc(db, 'userWorkspaces', user.uid);
        const now = new Date().toISOString();
        await setDoc(
          docRef,
          sanitizeDataForFirestore({
            userId: user.uid,
            projects: data.projects,
            tasks: data.tasks,
            clients: data.clients,
            ideas: data.ideas,
            habits: data.habits || [],
            scratchpad: data.scratchpad || '',
            focusSessions: data.focusSessions || [],
            timeBlocks: data.timeBlocks || [],
            trelloBoards: data.trelloBoards || [],
            trelloLists: data.trelloLists || [],
            trelloCards: data.trelloCards || [],
            trelloInbox: data.trelloInbox || [],
            updatedAt: now,
          }),
          { merge: true }
        );
        setSyncStatus('synced');
        setLastSyncedAt(now);
        setSyncError(null);
      } catch (err: unknown) {
        console.error('Firestore auto-save error:', err);
        setSyncStatus('error');
        const errObj = err as { message?: string };
        setSyncError(errObj.message || 'Failed to sync to Firestore');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [data, user]);

  const forceSyncNow = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, 'userWorkspaces', user.uid);
      const now = new Date().toISOString();
      await setDoc(
        docRef,
        sanitizeDataForFirestore({
          userId: user.uid,
          projects: data.projects,
          tasks: data.tasks,
          clients: data.clients,
          ideas: data.ideas,
          habits: data.habits || [],
          scratchpad: data.scratchpad || '',
          focusSessions: data.focusSessions || [],
          timeBlocks: data.timeBlocks || [],
          updatedAt: now,
        }),
        { merge: true }
      );
      setSyncStatus('synced');
      setLastSyncedAt(now);
      setSyncError(null);
    } catch (err: unknown) {
      console.error('Firestore manual sync error:', err);
      setSyncStatus('error');
      const errObj = err as { message?: string };
      setSyncError(errObj.message || 'Failed to sync to Firestore');
    }
  }, [user, data]);

  // Persist to localStorage as local fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [data]);

  // Compute active reminders
  const activeReminders = useMemo(() => {
    const now = new Date();
    return data.tasks.filter((t) => {
      if (t.status === 'completed' || !t.reminderEnabled || t.reminderDismissed) return false;
      if (t.reminderTime) {
        const remDate = new Date(t.reminderTime);
        return !isNaN(remDate.getTime()) && remDate <= now;
      }
      if (t.dueDate) {
        const todayStr = now.toISOString().split('T')[0];
        return t.dueDate <= todayStr;
      }
      return false;
    });
  }, [data.tasks]);

  // Tasks due today
  const dueTodayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return data.tasks.filter((t) => t.dueDate === todayStr && t.status !== 'completed');
  }, [data.tasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return data.tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed');
  }, [data.tasks]);

  // ==================== TASK ACTIONS ====================
  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskInput,
      id: generateId('task'),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.status === 'completed' && t.status !== 'completed') {
          updated.completedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'completed') {
          updated.completedAt = undefined;
        }
        return updated;
      }),
    }));
  };

  const deleteTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const toggleTaskStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const willComplete = t.status !== 'completed';
        if (willComplete) {
          fireCelebrationConfetti();
        }
        return {
          ...t,
          status: willComplete ? 'completed' : 'todo',
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
      }),
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
        };
      }),
    }));
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newSub = { id: generateId('sub'), title: title.trim(), completed: false };
        return { ...t, subtasks: [...t.subtasks, newSub] };
      }),
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
        };
      }),
    }));
  };

  const snoozeReminder = (taskId: string, hours: number = 3) => {
    const snoozeDate = new Date();
    snoozeDate.setHours(snoozeDate.getHours() + hours);
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, reminderTime: snoozeDate.toISOString(), reminderDismissed: false } : t)),
    }));
  };

  const dismissReminder = (taskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, reminderDismissed: true } : t)),
    }));
  };

  // ==================== PROJECT ACTIONS ====================
  const addProject = (projectInput: Omit<Project, 'id' | 'createdAt'>): Project => {
    const newProject: Project = {
      ...projectInput,
      id: generateId('proj'),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteProject = (id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const allCompleted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
        if (allCompleted && p.status !== 'completed') {
          fireCelebrationConfetti();
        }
        return {
          ...p,
          milestones: updatedMilestones,
          status: allCompleted ? 'completed' : p.status === 'completed' ? 'in_progress' : p.status,
        };
      }),
    }));
  };

  const addProjectMilestone = (projectId: string, title: string, dueDate?: string) => {
    if (!title.trim()) return;
    const newMilestone: ProjectMilestone = {
      id: generateId('m'),
      title: title.trim(),
      dueDate,
      completed: false,
    };
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, milestones: [...p.milestones, newMilestone] } : p)),
    }));
  };

  const deleteProjectMilestone = (projectId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) } : p
      ),
    }));
  };

  // ==================== CLIENT ACTIONS ====================
  const addClient = (clientInput: Omit<Client, 'id' | 'createdAt' | 'requests'>): Client => {
    const newClient: Client = {
      ...clientInput,
      id: generateId('client'),
      createdAt: new Date().toISOString(),
      requests: [],
    };
    setData((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteClient = (id: string) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
    }));
  };

  const addClientRequest = (clientId: string, requestInput: Omit<ClientRequest, 'id' | 'clientId' | 'createdAt'>): ClientRequest => {
    const newRequest: ClientRequest = {
      ...requestInput,
      id: generateId('req'),
      clientId,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === clientId ? { ...c, requests: [newRequest, ...c.requests] } : c)),
    }));
    return newRequest;
  };

  const updateClientRequest = (clientId: string, requestId: string, updates: Partial<ClientRequest>) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          requests: c.requests.map((r) => {
            if (r.id !== requestId) return r;
            const updated = { ...r, ...updates };
            if (updates.status === 'delivered' || updates.status === 'approved') {
              updated.completedAt = new Date().toISOString();
            }
            return updated;
          }),
        };
      }),
    }));
  };

  const deleteClientRequest = (clientId: string, requestId: string) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) =>
        c.id === clientId ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) } : c
      ),
    }));
  };

  const toggleClientRequestStatus = (clientId: string, requestId: string) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          requests: c.requests.map((r) => {
            if (r.id !== requestId) return r;
            const nextStatus: ClientRequestStatus =
              r.status === 'approved'
                ? 'pending'
                : r.status === 'delivered'
                ? 'approved'
                : r.status === 'in_progress'
                ? 'delivered'
                : 'in_progress';

            if (nextStatus === 'approved' || nextStatus === 'delivered') {
              fireCelebrationConfetti();
            }
            return {
              ...r,
              status: nextStatus,
              completedAt: nextStatus === 'delivered' || nextStatus === 'approved' ? new Date().toISOString() : undefined,
            };
          }),
        };
      }),
    }));
  };

  const convertClientRequestToTask = (clientId: string, requestId: string): Task => {
    const client = data.clients.find((c) => c.id === clientId);
    const req = client?.requests.find((r) => r.id === requestId);
    if (!client || !req) {
      throw new Error('Client request not found');
    }

    const newTask: Task = {
      id: generateId('task'),
      title: `${client.name}: ${req.title}`,
      description: req.details,
      status: req.status === 'delivered' || req.status === 'approved' ? 'completed' : 'todo',
      priority: req.priority,
      dueDate: req.dueDate,
      reminderEnabled: true,
      clientId: client.id,
      clientRequestId: req.id,
      subtasks: [],
      tags: ['Client Request', client.company.split(' ')[0]],
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      clients: prev.clients.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          requests: c.requests.map((r) => (r.id === requestId ? { ...r, linkedTaskId: newTask.id } : r)),
        };
      }),
    }));

    return newTask;
  };

  // ==================== IDEA ACTIONS ====================
  const addIdea = (ideaInput: Omit<Idea, 'id' | 'createdAt'>): Idea => {
    const newIdea: Idea = {
      ...ideaInput,
      id: generateId('idea'),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      ideas: [newIdea, ...prev.ideas],
    }));
    return newIdea;
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...updates };
        if (updates.stage === 'achieved' && i.stage !== 'achieved') {
          updated.achievedAt = new Date().toISOString();
          fireCelebrationConfetti();
        }
        return updated;
      }),
    }));
  };

  const deleteIdea = (id: string) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((i) => i.id !== id),
    }));
  };

  const updateIdeaStage = (id: string, stage: IdeaStage) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => {
        if (i.id !== id) return i;
        if (stage === 'achieved' && i.stage !== 'achieved') {
          fireCelebrationConfetti();
        }
        return {
          ...i,
          stage,
          achievedAt: stage === 'achieved' ? new Date().toISOString() : undefined,
        };
      }),
    }));
  };

  const toggleIdeaMilestone = (ideaId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => {
        if (i.id !== ideaId) return i;
        const updatedMilestones = i.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          const next = !m.completed;
          return {
            ...m,
            completed: next,
            completedAt: next ? new Date().toISOString() : undefined,
          };
        });

        // If all milestones completed, prompt to achieve
        const allDone = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
        if (allDone && i.stage !== 'achieved') {
          fireCelebrationConfetti();
        }

        return {
          ...i,
          milestones: updatedMilestones,
          stage: allDone ? 'achieved' : i.stage === 'spark' ? 'validation' : i.stage,
          achievedAt: allDone ? new Date().toISOString() : i.achievedAt,
        };
      }),
    }));
  };

  const addIdeaMilestone = (ideaId: string, title: string) => {
    if (!title.trim()) return;
    const newM: IdeaMilestone = {
      id: generateId('im'),
      title: title.trim(),
      completed: false,
    };
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === ideaId ? { ...i, milestones: [...i.milestones, newM] } : i)),
    }));
  };

  const deleteIdeaMilestone = (ideaId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) =>
        i.id === ideaId ? { ...i, milestones: i.milestones.filter((m) => m.id !== milestoneId) } : i
      ),
    }));
  };

  const convertIdeaToProject = (ideaId: string): Project => {
    const idea = data.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error('Idea not found');

    const newProject: Project = {
      id: generateId('proj'),
      title: idea.title,
      description: `${idea.summary}\n\nNotes from Idea:\n${idea.notes}`,
      color: idea.color || '#3b82f6',
      category: idea.category || 'Product Innovation',
      status: 'in_progress',
      priority: idea.impact >= 4 ? 'high' : 'medium',
      dueDate: idea.targetDate,
      originIdeaId: idea.id,
      milestones: idea.milestones.map((m) => ({
        id: generateId('m'),
        title: m.title,
        completed: m.completed,
      })),
      tags: [...idea.tags, 'From Idea'],
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      ideas: prev.ideas.map((i) => (i.id === ideaId ? { ...i, stage: 'executing', linkedProjectId: newProject.id } : i)),
    }));

    fireCelebrationConfetti();
    return newProject;
  };

  // ==================== BACKUP / RESET ====================
  const exportWorkspaceJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-workspace-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importWorkspaceJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.projects) && Array.isArray(parsed.tasks) && Array.isArray(parsed.clients) && Array.isArray(parsed.ideas)) {
        setData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Habits Actions
  const toggleHabit = (habitId: string, targetDate?: string) => {
    const today = targetDate || new Date().toISOString().split('T')[0];
    setData((prev) => {
      const updatedHabits = (prev.habits || []).map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(today);
        const newDates = exists
          ? h.completedDates.filter((d) => d !== today)
          : [...h.completedDates, today];

        if (!exists) {
          fireCelebrationConfetti();
        }

        const newStreak = exists ? Math.max(0, h.streak - 1) : h.streak + 1;
        return {
          ...h,
          completedDates: newDates,
          streak: newStreak,
        };
      });
      return { ...prev, habits: updatedHabits };
    });
  };

  const addHabit = (title: string, category: string = 'Daily Routine') => {
    const newHabit: Habit = {
      id: generateId('habit'),
      title,
      category,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      habits: [...(prev.habits || []), newHabit],
    }));
  };

  const deleteHabit = (habitId: string) => {
    setData((prev) => ({
      ...prev,
      habits: (prev.habits || []).filter((h) => h.id !== habitId),
    }));
  };

  // Scratchpad
  const updateScratchpad = (text: string) => {
    setData((prev) => ({
      ...prev,
      scratchpad: text,
    }));
  };

  // Focus & Pomodoro
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  const logFocusSession = (session: Omit<FocusSession, 'id' | 'completedAt'>) => {
    const newSession: FocusSession = {
      id: generateId('fs'),
      ...session,
      completedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      focusSessions: [newSession, ...(prev.focusSessions || [])],
    }));
  };

  const startFocusForTask = (taskId: string) => {
    setActiveFocusTaskId(taskId);
    setActiveTab('focus');
  };

  // Time Blocks / Schedule
  const addTimeBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      id: generateId('tb'),
      ...block,
    };
    setData((prev) => ({
      ...prev,
      timeBlocks: [...(prev.timeBlocks || []), newBlock],
    }));
  };

  const toggleTimeBlock = (id: string) => {
    setData((prev) => ({
      ...prev,
      timeBlocks: (prev.timeBlocks || []).map((b) =>
        b.id === id ? { ...b, completed: !b.completed } : b
      ),
    }));
  };

  const deleteTimeBlock = (id: string) => {
    setData((prev) => ({
      ...prev,
      timeBlocks: (prev.timeBlocks || []).filter((b) => b.id !== id),
    }));
  };

  // Trello Boards
  const addTrelloBoard = (title: string, backgroundColor?: string): TrelloBoard => {
    const newBoard: TrelloBoard = {
      id: generateId('board'),
      title,
      backgroundColor: backgroundColor || 'linear-gradient(135deg, #7c3f93 0%, #8c4ea3 50%, #9b54ab 100%)',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      trelloBoards: [...(prev.trelloBoards || []), newBoard],
    }));
    setActiveBoardId(newBoard.id);
    return newBoard;
  };

  const updateTrelloBoard = (id: string, updates: Partial<TrelloBoard>) => {
    setData((prev) => ({
      ...prev,
      trelloBoards: (prev.trelloBoards || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const deleteTrelloBoard = (id: string) => {
    setData((prev) => ({
      ...prev,
      trelloBoards: (prev.trelloBoards || []).filter((b) => b.id !== id),
      trelloLists: (prev.trelloLists || []).filter((l) => l.boardId !== id),
    }));
    if (activeBoardId === id) {
      setActiveBoardId('board_default');
    }
  };

  // Trello Lists
  const addTrelloList = (title: string, boardId?: string): TrelloList => {
    const targetBoardId = boardId || activeBoardId || 'board_default';
    const currentLists = (data.trelloLists || []).filter((l) => l.boardId === targetBoardId);
    const newList: TrelloList = {
      id: generateId('list'),
      boardId: targetBoardId,
      title,
      order: currentLists.length,
    };
    setData((prev) => ({
      ...prev,
      trelloLists: [...(prev.trelloLists || []), newList],
    }));
    return newList;
  };

  const updateTrelloList = (id: string, title: string) => {
    setData((prev) => ({
      ...prev,
      trelloLists: (prev.trelloLists || []).map((l) => (l.id === id ? { ...l, title } : l)),
    }));
  };

  const deleteTrelloList = (id: string) => {
    setData((prev) => ({
      ...prev,
      trelloLists: (prev.trelloLists || []).filter((l) => l.id !== id),
      trelloCards: (prev.trelloCards || []).filter((c) => c.listId !== id),
    }));
  };

  const reorderTrelloLists = (lists: TrelloList[]) => {
    setData((prev) => {
      const otherBoardLists = (prev.trelloLists || []).filter(
        (l) => !lists.some((target) => target.id === l.id)
      );
      return {
        ...prev,
        trelloLists: [...otherBoardLists, ...lists],
      };
    });
  };

  // Trello Cards
  const addTrelloCard = (card: Omit<TrelloCard, 'id' | 'createdAt' | 'order'>): TrelloCard => {
    const currentCardsInList = (data.trelloCards || []).filter((c) => c.listId === card.listId);
    const newCard: TrelloCard = {
      id: generateId('card'),
      ...card,
      order: currentCardsInList.length,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      trelloCards: [...(prev.trelloCards || []), newCard],
    }));
    return newCard;
  };

  const updateTrelloCard = (id: string, updates: Partial<TrelloCard>) => {
    setData((prev) => ({
      ...prev,
      trelloCards: (prev.trelloCards || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
      trelloInbox: (prev.trelloInbox || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const moveTrelloCard = (cardId: string, targetListId: string, newOrder?: number) => {
    setData((prev) => {
      const isCardInCards = (prev.trelloCards || []).some((c) => c.id === cardId);
      const isCardInInbox = (prev.trelloInbox || []).some((c) => c.id === cardId);

      if (targetListId === 'inbox') {
        const foundCard = (prev.trelloCards || []).find((c) => c.id === cardId);
        if (!foundCard) return prev;
        const remainingCards = (prev.trelloCards || []).filter((c) => c.id !== cardId);
        const movedCard: TrelloCard = { ...foundCard, listId: 'inbox', order: 0 };
        return {
          ...prev,
          trelloCards: remainingCards,
          trelloInbox: [movedCard, ...(prev.trelloInbox || [])],
        };
      }

      if (isCardInInbox) {
        const foundInbox = (prev.trelloInbox || []).find((c) => c.id === cardId);
        if (!foundInbox) return prev;
        const remainingInbox = (prev.trelloInbox || []).filter((c) => c.id !== cardId);
        const targetListCards = (prev.trelloCards || []).filter((c) => c.listId === targetListId);
        const movedCard: TrelloCard = {
          ...foundInbox,
          listId: targetListId,
          order: typeof newOrder === 'number' ? newOrder : targetListCards.length,
        };
        return {
          ...prev,
          trelloInbox: remainingInbox,
          trelloCards: [...(prev.trelloCards || []), movedCard],
        };
      }

      if (isCardInCards) {
        return {
          ...prev,
          trelloCards: (prev.trelloCards || []).map((c) => {
            if (c.id === cardId) {
              return {
                ...c,
                listId: targetListId,
                order: typeof newOrder === 'number' ? newOrder : c.order,
              };
            }
            return c;
          }),
        };
      }

      return prev;
    });
  };

  const deleteTrelloCard = (id: string) => {
    setData((prev) => ({
      ...prev,
      trelloCards: (prev.trelloCards || []).filter((c) => c.id !== id),
      trelloInbox: (prev.trelloInbox || []).filter((c) => c.id !== id),
    }));
  };

  const toggleTrelloCardComplete = (id: string) => {
    let nowCompleted = false;
    setData((prev) => {
      const cards = (prev.trelloCards || []).map((c) => {
        if (c.id === id) {
          nowCompleted = !c.completed;
          return { ...c, completed: nowCompleted };
        }
        return c;
      });
      return { ...prev, trelloCards: cards };
    });
    if (nowCompleted) {
      fireCelebrationConfetti();
    }
  };

  // Trello Inbox
  const addTrelloInboxCard = (title: string, description?: string, coverImage?: string): TrelloCard => {
    const newCard: TrelloCard = {
      id: generateId('inbox'),
      listId: 'inbox',
      title,
      description,
      hasDescription: !!description,
      coverImage: coverImage || undefined,
      hasAttachment: !!coverImage,
      order: 0,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      trelloInbox: [newCard, ...(prev.trelloInbox || [])],
    }));
    return newCard;
  };

  const moveInboxCardToBoard = (cardId: string, targetListId: string) => {
    moveTrelloCard(cardId, targetListId);
  };

  const deleteTrelloInboxCard = (id: string) => {
    deleteTrelloCard(id);
  };

  const resetToSampleData = () => {
    setData(INITIAL_WORKSPACE_DATA);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        activeReminders,
        dueTodayTasks,
        overdueTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        snoozeReminder,
        dismissReminder,
        addProject,
        updateProject,
        deleteProject,
        toggleProjectMilestone,
        addProjectMilestone,
        deleteProjectMilestone,
        addClient,
        updateClient,
        deleteClient,
        addClientRequest,
        updateClientRequest,
        deleteClientRequest,
        toggleClientRequestStatus,
        convertClientRequestToTask,
        addIdea,
        updateIdea,
        deleteIdea,
        updateIdeaStage,
        toggleIdeaMilestone,
        addIdeaMilestone,
        deleteIdeaMilestone,
        convertIdeaToProject,
        toggleHabit,
        addHabit,
        deleteHabit,
        scratchpad: data.scratchpad || '',
        updateScratchpad,
        logFocusSession,
        activeFocusTaskId,
        setActiveFocusTaskId,
        startFocusForTask,
        addTimeBlock,
        toggleTimeBlock,
        deleteTimeBlock,
        activeBoardId,
        setActiveBoardId,
        addTrelloBoard,
        updateTrelloBoard,
        deleteTrelloBoard,
        addTrelloList,
        updateTrelloList,
        deleteTrelloList,
        reorderTrelloLists,
        addTrelloCard,
        updateTrelloCard,
        moveTrelloCard,
        deleteTrelloCard,
        toggleTrelloCardComplete,
        addTrelloInboxCard,
        moveInboxCardToBoard,
        deleteTrelloInboxCard,
        exportWorkspaceJson,
        importWorkspaceJson,
        resetToSampleData,
        syncStatus,
        lastSyncedAt,
        syncError,
        isCloudSynced: !!user,
        forceSyncNow,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
