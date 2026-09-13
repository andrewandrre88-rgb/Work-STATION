export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type IdeaStage = 'spark' | 'validation' | 'planning' | 'executing' | 'achieved';

export type ClientRequestStatus = 'pending' | 'in_progress' | 'delivered' | 'approved';

export type ClientStatus = 'active' | 'lead' | 'past';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  reminderEnabled: boolean;
  reminderTime?: string; // YYYY-MM-DDTHH:MM
  reminderDismissed?: boolean;
  projectId?: string;
  clientId?: string;
  clientRequestId?: string;
  ideaId?: string;
  subtasks: Subtask[];
  tags: string[];
  createdAt: string;
  completedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  category: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  clientId?: string;
  originIdeaId?: string;
  milestones: ProjectMilestone[];
  tags: string[];
  createdAt: string;
}

export interface ClientRequest {
  id: string;
  clientId: string;
  title: string;
  details: string;
  status: ClientRequestStatus;
  priority: Priority;
  dueDate?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  estimatedHours?: number;
  fee?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  role?: string;
  email: string;
  phone?: string;
  avatarColor: string;
  notes: string;
  status: ClientStatus;
  website?: string;
  preferredCommunication?: string;
  requests: ClientRequest[];
  createdAt: string;
}

export interface IdeaMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Idea {
  id: string;
  title: string;
  summary: string;
  stage: IdeaStage;
  category: string;
  targetDate?: string;
  impact: 1 | 2 | 3 | 4 | 5; // 1 to 5
  effort: 1 | 2 | 3 | 4 | 5; // 1 to 5
  notes: string;
  milestones: IdeaMilestone[];
  linkedProjectId?: string;
  color: string;
  tags: string[];
  createdAt: string;
  achievedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  completedDates: string[]; // ISO 'YYYY-MM-DD'
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  durationMinutes: number;
  completedAt: string;
  mode: 'focus' | 'short_break' | 'long_break';
}

export interface TimeBlock {
  id: string;
  timeSlot: string; // e.g. "09:00 AM", "10:00 AM"
  title: string;
  taskId?: string;
  completed: boolean;
  date: string; // 'YYYY-MM-DD'
}

export interface TrelloChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TrelloCardImage {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
}

export interface TrelloCard {
  id: string;
  listId: string; // 'inbox' or a list ID
  title: string;
  description?: string;
  completed?: boolean;
  color?: string; // label color e.g. '#10b981', '#6366f1', '#f59e0b', etc.
  labelName?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string;
  checklists?: TrelloChecklistItem[];
  projectId?: string;
  clientId?: string;
  hasAttachment?: boolean;
  hasDescription?: boolean;
  hasComments?: boolean;
  coverImage?: string; // URL or base64 data string
  images?: TrelloCardImage[];
  order: number;
  createdAt: string;
}

export interface TrelloList {
  id: string;
  boardId: string;
  title: string;
  order: number;
}

export interface TrelloBoard {
  id: string;
  title: string;
  backgroundColor?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type ActiveNavTab = 'dashboard' | 'projects' | 'ideas' | 'tasks' | 'clients' | 'focus';

export interface WorkspaceData {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  ideas: Idea[];
  habits?: Habit[];
  scratchpad?: string;
  focusSessions?: FocusSession[];
  timeBlocks?: TimeBlock[];
  trelloBoards?: TrelloBoard[];
  trelloLists?: TrelloList[];
  trelloCards?: TrelloCard[];
  trelloInbox?: TrelloCard[];
}
