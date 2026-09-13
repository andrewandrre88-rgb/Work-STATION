import React, { useState, useMemo, useRef } from 'react';
import {
  Inbox,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Star,
  Filter,
  Zap,
  Plug,
  Share2,
  Mail,
  AlignLeft,
  CheckCircle2,
  Circle,
  Calendar,
  CheckSquare,
  X,
  Trash2,
  Edit2,
  ArrowRight,
  FolderKanban,
  Columns3,
  ListFilter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  Check,
  Pencil,
  ArrowUpDown,
  Download,
  Palette,
  Clock,
  Tag,
  AlertTriangle,
  MoveRight,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TrelloCard, TrelloList, Project, ProjectStatus } from '../types';
import { formatDate, getRelativeDueDateLabel } from '../utils/formatters';
import { TrelloCardModal } from './TrelloCardModal';

interface ProjectsViewProps {
  onOpenQuickAdd: (defaultTab?: 'task' | 'project' | 'idea' | 'client') => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onOpenQuickAdd }) => {
  const {
    data,
    searchQuery,
    activeBoardId,
    setActiveBoardId,
    addTrelloBoard,
    updateTrelloBoard,
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
    updateProject,
    deleteProject,
    toggleProjectMilestone,
    addProjectMilestone,
    deleteProjectMilestone,
  } = useWorkspace();

  // View state: 'trello' (primary, matches screenshot) or 'classic' (project cards view)
  const [viewMode, setViewMode] = useState<'trello' | 'classic'>('trello');
  
  // Left Inbox Sidebar toggle
  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(true);
  const [isAddingInboxCard, setIsAddingInboxCard] = useState<boolean>(false);
  const [inboxCardInput, setInboxCardInput] = useState<string>('');

  // Column adding inline state
  const [isAddingList, setIsAddingList] = useState<boolean>(false);
  const [newListTitle, setNewListTitle] = useState<string>('');

  // Card adding inline state per list: { [listId]: boolean }
  const [addingCardInListId, setAddingCardInListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState<string>('');

  // Card detail modal
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);

  // Board switcher dropdown
  const [showBoardDropdown, setShowBoardDropdown] = useState<boolean>(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState<boolean>(false);
  const [newBoardTitleInput, setNewBoardTitleInput] = useState<string>('');

  // Board star state
  const [isStarred, setIsStarred] = useState<boolean>(false);

  // Board options menu (top right `...`)
  const [showBoardOptionsMenu, setShowBoardOptionsMenu] = useState<boolean>(false);

  // List menu and action states
  const [activeListMenuId, setActiveListMenuId] = useState<string | null>(null);
  const [listToDeleteConfirmId, setListToDeleteConfirmId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState<string>('');
  const [sortedFeedbackListId, setSortedFeedbackListId] = useState<string | null>(null);

  // Filter popup
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [cardFilterLabel, setCardFilterLabel] = useState<string>('all');
  const [cardFilterStatus, setCardFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Share popup
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Power-ups / Automation popup
  const [showAutomationModal, setShowAutomationModal] = useState<boolean>(false);

  // Drag & drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);

  // Classic view milestone states
  const [addingMilestoneProjectId, setAddingMilestoneProjectId] = useState<string | null>(null);
  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({});
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  // Current active board
  const boards = data.trelloBoards || [];
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0] || {
    id: 'board_default',
    title: 'My Trello board',
  };

  // Lists for this board
  const currentBoardLists = useMemo(() => {
    const allLists = data.trelloLists || [];
    return allLists
      .filter((l) => l.boardId === activeBoard.id)
      .sort((a, b) => a.order - b.order);
  }, [data.trelloLists, activeBoard.id]);

  // Cards map by listId
  const cardsByList = useMemo(() => {
    const allCards = data.trelloCards || [];
    const map: Record<string, TrelloCard[]> = {};

    currentBoardLists.forEach((l) => {
      map[l.id] = [];
    });

    allCards.forEach((c) => {
      // Filter by search query if any
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesLabel = (c.labelName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLabel) return;
      }

      // Filter by label
      if (cardFilterLabel !== 'all' && c.color !== cardFilterLabel) {
        return;
      }

      // Filter by status
      if (cardFilterStatus === 'completed' && !c.completed) return;
      if (cardFilterStatus === 'pending' && c.completed) return;

      if (!map[c.listId]) {
        map[c.listId] = [];
      }
      map[c.listId].push(c);
    });

    // Sort cards by order
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.order - b.order);
    });

    return map;
  }, [data.trelloCards, currentBoardLists, searchQuery, cardFilterLabel, cardFilterStatus]);

  // Inbox cards
  const inboxCards = useMemo(() => {
    const allInbox = data.trelloInbox || [];
    if (!searchQuery.trim()) return allInbox;
    const q = searchQuery.toLowerCase();
    return allInbox.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [data.trelloInbox, searchQuery]);

  // Filtered projects for Classic Milestones View
  const filteredProjects = useMemo(() => {
    const all = data.projects || [];
    if (!searchQuery) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }, [data.projects, searchQuery]);

  const handleAddMilestoneSubmit = (projectId: string) => {
    const title = (newMilestoneText[projectId] || '').trim();
    if (!title) return;
    addProjectMilestone(projectId, title);
    setNewMilestoneText((prev) => ({ ...prev, [projectId]: '' }));
    setAddingMilestoneProjectId(null);
  };

  // Handlers for lists and cards
  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    addTrelloList(newListTitle.trim(), activeBoard.id);
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleAddCardSubmit = (listId: string) => {
    if (!newCardTitle.trim()) return;
    addTrelloCard({
      listId,
      title: newCardTitle.trim(),
      hasDescription: false,
    });
    setNewCardTitle('');
    setAddingCardInListId(null);
  };

  const handleAddInboxCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxCardInput.trim()) return;
    addTrelloInboxCard(inboxCardInput.trim());
    setInboxCardInput('');
    setIsAddingInboxCard(false);
  };

  const handleCreateNewBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitleInput.trim()) return;
    const newBoard = addTrelloBoard(newBoardTitleInput.trim());
    // Create default lists for the new board
    addTrelloList('Today', newBoard.id);
    addTrelloList('This Week', newBoard.id);
    addTrelloList('Later', newBoard.id);
    addTrelloList('now', newBoard.id);
    setNewBoardTitleInput('');
    setIsCreatingBoard(false);
    setShowBoardDropdown(false);
  };

  // Drag and Drop
  const handleDragStart = (cardId: string) => {
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    setDragOverListId(listId);
  };

  const handleDrop = (targetListId: string) => {
    if (draggedCardId) {
      moveTrelloCard(draggedCardId, targetListId);
      setDraggedCardId(null);
      setDragOverListId(null);
    }
  };

  // Copy share URL with safe fallback for iframes
  const handleCopyShareLink = () => {
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(window.location.href);
        copied = true;
      }
    } catch {
      // fallback
    }

    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copied = true;
      } catch {
        // ignore
      }
    }

    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  // Automated sorting helper by Due Date
  const handleSortByDueDate = (listId: string) => {
    const listCards = [...(cardsByList[listId] || [])];
    listCards.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    listCards.forEach((c, idx) => {
      updateTrelloCard(c.id, { order: idx });
    });
    setSortedFeedbackListId(listId);
    setTimeout(() => setSortedFeedbackListId(null), 2200);
  };

  // Sort list alphabetically A-Z
  const handleSortAlphabetical = (listId: string) => {
    const listCards = [...(cardsByList[listId] || [])];
    listCards.sort((a, b) => a.title.localeCompare(b.title));
    listCards.forEach((c, idx) => {
      updateTrelloCard(c.id, { order: idx });
    });
    setSortedFeedbackListId(listId);
    setTimeout(() => setSortedFeedbackListId(null), 2200);
    setActiveListMenuId(null);
  };

  // Move all cards from one list to another
  const handleMoveAllCards = (fromListId: string, toListId: string) => {
    const cardsToMove = cardsByList[fromListId] || [];
    cardsToMove.forEach((c) => {
      moveTrelloCard(c.id, toListId);
    });
    setActiveListMenuId(null);
  };

  // Rename list inline
  const handleStartRenameList = (listId: string, currentTitle: string) => {
    setEditingListId(listId);
    setEditingListTitle(currentTitle);
    setActiveListMenuId(null);
  };

  const handleSaveListRename = (listId: string) => {
    if (editingListTitle.trim()) {
      updateTrelloList(listId, editingListTitle.trim());
    }
    setEditingListId(null);
    setEditingListTitle('');
  };

  // Clear completed cards
  const handleArchiveCompleted = (listId: string) => {
    const listCards = cardsByList[listId] || [];
    const completed = listCards.filter((c) => c.completed);
    completed.forEach((c) => deleteTrelloCard(c.id));
    setActiveListMenuId(null);
  };

  // Export board data as JSON file
  const handleExportBoardJson = () => {
    const exportData = {
      board: activeBoard,
      lists: currentBoardLists,
      cards: currentBoardLists.flatMap((l) => cardsByList[l.id] || []),
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeBoard.title.toLowerCase().replace(/\s+/g, '_')}_board.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowBoardOptionsMenu(false);
  };

  return (
    <div className="flex flex-col h-full w-full min-h-[calc(100vh-140px)]">
      {/* Trello Board Top Bar (Matches Screenshot Deep Purple Header) */}
      <div className="bg-[#48216e] text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md shrink-0 border-b border-purple-900/40 relative z-10">
        {/* Left: Board Selector, Layout Icon & View Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative">
            <button
              type="button"
              id="trello-board-selector-btn"
              onClick={() => setShowBoardDropdown(!showBoardDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/15 transition text-white font-bold text-sm sm:text-base cursor-pointer truncate"
            >
              <Columns3 className="w-4 h-4 text-purple-200 shrink-0" />
              <span className="truncate">{activeBoard.title}</span>
              <ChevronDown className="w-4 h-4 text-purple-300 shrink-0" />
            </button>

            {/* Board Selector Dropdown */}
            {showBoardDropdown && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-200 z-50 p-2 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  Your Boards
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setActiveBoardId(b.id);
                        setShowBoardDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        b.id === activeBoard.id
                          ? 'bg-purple-100 text-purple-900'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{b.title}</span>
                      {b.id === activeBoard.id && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Create Board Inline */}
                <div className="pt-2 border-t border-stone-100">
                  {isCreatingBoard ? (
                    <form onSubmit={handleCreateNewBoard} className="space-y-2 p-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Board title..."
                        value={newBoardTitleInput}
                        onChange={(e) => setNewBoardTitleInput(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-purple-600"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-md cursor-pointer"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingBoard(false)}
                          className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreatingBoard(true)}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Board
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle: Trello Board vs Classic Project Cards */}
          <div className="hidden lg:flex items-center bg-black/20 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('trello')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'trello'
                  ? 'bg-white text-purple-950 shadow-xs font-semibold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Trello Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('classic')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'classic'
                  ? 'bg-white text-purple-950 shadow-xs font-semibold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Milestones & Details</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Icons, Avatar, Share button (Exact match to Screenshot_13.png) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Circular Avatar "AA" */}
          <div
            className="w-7 h-7 rounded-full bg-[#e56824] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white/30 shrink-0"
            title="andrewandrre88@gmail.com"
          >
            AA
          </div>

          {/* Power-ups / Integrations Plug Icon */}
          <button
            type="button"
            onClick={() => setShowAutomationModal(true)}
            className="p-1.5 rounded-md text-purple-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Power-Ups"
          >
            <Plug className="w-4 h-4" />
          </button>

          {/* Automation Lightning Bolt */}
          <button
            type="button"
            onClick={() => setShowAutomationModal(true)}
            className="p-1.5 rounded-md text-purple-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Automation & Rules"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Filter button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                cardFilterLabel !== 'all' || cardFilterStatus !== 'all'
                  ? 'bg-white text-purple-900'
                  : 'text-purple-200 hover:text-white hover:bg-white/15'
              }`}
              title="Filter Cards"
            >
              <Filter className="w-4 h-4" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-200 z-50 p-3 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                  <h4 className="text-xs font-bold text-stone-800">Filter Cards</h4>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Status
                    </label>
                    <select
                      value={cardFilterStatus}
                      onChange={(e) => setCardFilterStatus(e.target.value as any)}
                      className="w-full text-xs px-2 py-1.5 border border-stone-200 rounded-lg"
                    >
                      <option value="all">All Cards</option>
                      <option value="pending">Incomplete Only</option>
                      <option value="completed">Completed Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Label Color
                    </label>
                    <select
                      value={cardFilterLabel}
                      onChange={(e) => setCardFilterLabel(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-stone-200 rounded-lg"
                    >
                      <option value="all">All Colors</option>
                      <option value="#10b981">Green</option>
                      <option value="#8b5cf6">Purple</option>
                      <option value="#3b82f6">Blue</option>
                      <option value="#f59e0b">Amber</option>
                      <option value="#f43f5e">Rose</option>
                    </select>
                  </div>

                  {(cardFilterStatus !== 'all' || cardFilterLabel !== 'all') && (
                    <button
                      onClick={() => {
                        setCardFilterStatus('all');
                        setCardFilterLabel('all');
                      }}
                      className="w-full text-center py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Star Icon */}
          <button
            type="button"
            id="trello-star-btn"
            onClick={() => setIsStarred(!isStarred)}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              isStarred
                ? 'text-amber-300 hover:text-amber-200 bg-white/15 ring-1 ring-amber-300/40'
                : 'text-purple-200 hover:text-amber-300 hover:bg-white/15'
            }`}
            title={isStarred ? 'Unstar this board' : 'Star this board'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-300 text-amber-300' : ''}`} />
          </button>

          {/* More options `...` (Board Menu Dropdown) */}
          <div className="relative">
            <button
              type="button"
              id="trello-board-options-btn"
              onClick={() => setShowBoardOptionsMenu(!showBoardOptionsMenu)}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                showBoardOptionsMenu
                  ? 'bg-white/20 text-white'
                  : 'text-purple-200 hover:text-white hover:bg-white/15'
              }`}
              title="Board Menu & Themes"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showBoardOptionsMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-72 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 z-50 p-3 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2.5">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-600" />
                    Board Menu
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowBoardOptionsMenu(false)}
                    className="text-stone-400 hover:text-stone-700 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Change Background Themes */}
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Board Theme Canvas
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      {
                        name: 'Purple Grape',
                        gradient:
                          'linear-gradient(135deg, #7c3f93 0%, #8c4ea3 50%, #9b54ab 100%)',
                        color: '#8c4ea3',
                      },
                      {
                        name: 'Ocean Blue',
                        gradient:
                          'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#0284c7',
                      },
                      {
                        name: 'Emerald Forest',
                        gradient:
                          'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#059669',
                      },
                      {
                        name: 'Sunset Amber',
                        gradient:
                          'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        color: '#d97706',
                      },
                      {
                        name: 'Midnight Plum',
                        gradient:
                          'linear-gradient(135deg, #3b1a5b 0%, #250d3d 100%)',
                        color: '#3b1a5b',
                      },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => {
                          updateTrelloBoard(activeBoard.id, {
                            backgroundColor: theme.gradient,
                          });
                        }}
                        style={{ background: theme.gradient }}
                        className="h-8 rounded-lg border-2 border-white/60 shadow-xs hover:scale-105 transition cursor-pointer"
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Board Actions */}
                <div className="space-y-1 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      currentBoardLists.forEach((l) => handleSortByDueDate(l.id));
                      setShowBoardOptionsMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <ListFilter className="w-3.5 h-3.5 text-purple-600" />
                    <span>Sort all lists by due date</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      currentBoardLists.forEach((l) => handleArchiveCompleted(l.id));
                      setShowBoardOptionsMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Archive completed cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingList(true);
                      setShowBoardOptionsMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Add another list</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBoardJson}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export board (JSON)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Share Button (white pill) */}
          <button
            type="button"
            id="trello-share-btn"
            onClick={() => setShowShareModal(true)}
            className="bg-white text-[#48216e] hover:bg-purple-50 font-bold px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Board Container: Left Inbox Sidebar + Canvas with Lists (Trello Mode) */}
      {viewMode === 'trello' ? (
        <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT INBOX SIDEBAR (Matches pale blue `#e9f2fb` from Screenshot_13.png) */}
        {isInboxOpen ? (
          <aside
            id="trello-inbox-sidebar"
            className="w-72 sm:w-80 bg-[#edf4fc] border-r border-[#d4e3f3] flex flex-col shrink-0 transition-all z-20"
          >
            {/* Inbox Header */}
            <div className="p-3.5 border-b border-[#d8e7f7] flex items-center justify-between text-stone-800">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-sm font-bold text-stone-900">Inbox</h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded-full">
                  {inboxCards.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingInboxCard(true)}
                  className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-white/60 transition"
                  title="Add card to Inbox"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsInboxOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-800 rounded hover:bg-white/60 transition"
                  title="Collapse Inbox"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inbox Action: Add a card input */}
            <div className="p-3">
              {isAddingInboxCard ? (
                <form
                  onSubmit={handleAddInboxCardSubmit}
                  className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-xs space-y-2"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter card title or thought..."
                    value={inboxCardInput}
                    onChange={(e) => setInboxCardInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Add Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingInboxCard(false)}
                      className="text-stone-400 hover:text-stone-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingInboxCard(true)}
                  className="w-full text-left px-3 py-2 bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 font-medium text-xs rounded-xl border border-[#d2e2f3] shadow-2xs flex items-center justify-between transition cursor-pointer"
                >
                  <span>Add a card</span>
                  <Plus className="w-4 h-4 text-stone-400" />
                </button>
              )}
            </div>

            {/* Inbox Cards List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
              {inboxCards.length === 0 ? (
                <div className="text-center py-10 px-4 text-stone-400">
                  <Inbox className="w-8 h-8 mx-auto text-blue-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">Your Inbox is clear</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Capture quick ideas, links or emails here, then drag them onto your board lists!
                  </p>
                </div>
              ) : (
                inboxCards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    onClick={() => setSelectedCard(card)}
                    className="bg-white p-3.5 rounded-xl border border-[#dbe6f5] shadow-xs hover:shadow-md transition cursor-pointer group overflow-hidden"
                  >
                    {card.coverImage && (
                      <div className="w-[calc(100%+1.75rem)] h-24 -mx-3.5 -mt-3.5 mb-2.5 overflow-hidden bg-stone-100">
                        <img
                          src={card.coverImage}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-stone-900 leading-snug">
                        {card.title}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrelloInboxCard(card.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-0.5 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {card.description && (
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    {/* Metadata Icons matching screenshot: Mail icon & text align icon */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-400" title="Email capture" />
                        <AlignLeft className="w-3.5 h-3.5 text-stone-400" title="Has notes" />
                        {(card.hasAttachment || card.coverImage || (card.images && card.images.length > 0)) && (
                          <span className="flex items-center gap-1 text-purple-600 font-medium" title="Attached photos / cover">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {card.images && card.images.length > 0 ? card.images.length : ''}
                          </span>
                        )}
                      </div>

                      {/* Quick Move to First Board List */}
                      {currentBoardLists.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveInboxCardToBoard(card.id, currentBoardLists[0].id);
                          }}
                          className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Move to {currentBoardLists[0].title}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        ) : (
          /* Collapsed Inbox button trigger */
          <button
            type="button"
            onClick={() => setIsInboxOpen(true)}
            className="absolute left-0 top-3 z-30 bg-[#edf4fc] text-stone-700 hover:text-blue-800 p-2 rounded-r-xl border-y border-r border-[#d4e3f3] shadow-md flex items-center gap-1 cursor-pointer transition"
            title="Expand Inbox"
          >
            <Inbox className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold hidden sm:inline">Inbox</span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        )}

        {/* BOARD MAIN CANVAS (Vibrant Trello Purple Gradient from Screenshot) */}
        <main
          id="trello-board-canvas"
          className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 items-start select-none"
          style={{
            background:
              activeBoard.backgroundColor ||
              'linear-gradient(135deg, #7c3f93 0%, #8c4ea3 50%, #9b54ab 100%)',
          }}
        >
          {/* Columns / Lists rendered horizontally */}
          {currentBoardLists.map((list) => {
            const listCards = cardsByList[list.id] || [];
            const isAddingCard = addingCardInListId === list.id;

            return (
              <div
                key={list.id}
                id={`trello-list-${list.id}`}
                onDragOver={(e) => handleDragOver(e, list.id)}
                onDrop={() => handleDrop(list.id)}
                className={`w-72 shrink-0 bg-[#f1f2f4] rounded-2xl p-2.5 flex flex-col max-h-[calc(100vh-175px)] shadow-lg transition-all ${
                  dragOverListId === list.id ? 'ring-2 ring-white/80 bg-[#e8eaed]' : ''
                }`}
              >
                {/* List Header: Title, Count, Menu */}
                <div className="px-2 py-1.5 flex items-center justify-between gap-1.5 text-stone-800 shrink-0 relative">
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        autoFocus
                        value={editingListTitle}
                        onChange={(e) => setEditingListTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveListRename(list.id);
                          if (e.key === 'Escape') setEditingListId(null);
                        }}
                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-purple-400 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveListRename(list.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Save list title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingListId(null)}
                        className="p-1 text-stone-400 hover:bg-stone-200 rounded cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onDoubleClick={() => handleStartRenameList(list.id, list.title)}
                      title="Double click to rename list"
                    >
                      <h4 className="font-bold text-sm text-stone-900 truncate">
                        {list.title}
                      </h4>
                      <span className="text-xs font-semibold text-stone-500 bg-stone-200/80 px-1.5 py-0.2 rounded-full shrink-0">
                        {listCards.length}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0 relative">
                    {/* Button 1: Sort by due date */}
                    <button
                      type="button"
                      id={`list-sort-btn-${list.id}`}
                      onClick={() => handleSortByDueDate(list.id)}
                      className={`p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-200/80 transition cursor-pointer flex items-center gap-1 ${
                        sortedFeedbackListId === list.id ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300' : ''
                      }`}
                      title="Sort cards by due date"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      {sortedFeedbackListId === list.id && (
                        <span className="text-[10px] font-bold text-purple-700">Sorted</span>
                      )}
                    </button>

                    {/* Button 2: Delete List (Matches user CSS selector button:nth-of-type(2)) */}
                    <button
                      type="button"
                      id={`list-delete-btn-${list.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDeleteConfirmId(listToDeleteConfirmId === list.id ? null : list.id);
                        setActiveListMenuId(null);
                      }}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        listToDeleteConfirmId === list.id
                          ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-400'
                          : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={listToDeleteConfirmId === list.id ? 'Close confirmation' : 'Delete List'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Button 3: List Actions Menu (More options) */}
                    <button
                      type="button"
                      id={`list-more-btn-${list.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveListMenuId(activeListMenuId === list.id ? null : list.id);
                        setListToDeleteConfirmId(null);
                      }}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        activeListMenuId === list.id
                          ? 'bg-stone-300 text-stone-900'
                          : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200/80'
                      }`}
                      title="List actions"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* In-UI Confirmation Popover for Delete List (100% Safe, No iframe block) */}
                    {listToDeleteConfirmId === list.id && (
                      <div
                        id={`list-delete-confirm-${list.id}`}
                        className="absolute right-0 top-full mt-1.5 w-64 bg-white text-stone-900 rounded-xl shadow-2xl border border-rose-200 z-50 p-3 text-xs animate-in fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1">
                          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Delete list "{list.title}"?</span>
                        </div>
                        <p className="text-stone-600 text-[11px] mb-3 leading-snug">
                          This list and its <span className="font-bold text-stone-900">{listCards.length} cards</span> will be permanently removed.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setListToDeleteConfirmId(null)}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTrelloList(list.id);
                              setListToDeleteConfirmId(null);
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Delete List
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List Actions Menu Popover */}
                    {activeListMenuId === list.id && (
                      <div
                        id={`list-actions-menu-${list.id}`}
                        className="absolute right-0 top-full mt-1.5 w-56 bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-200 z-50 p-1.5 text-xs animate-in fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-stone-100 mb-1">
                          <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                            List Actions
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveListMenuId(null)}
                            className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCardInListId(list.id);
                              setActiveListMenuId(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-stone-400" />
                            <span>Add a card...</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleStartRenameList(list.id, list.title);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-stone-400" />
                            <span>Rename list</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleSortByDueDate(list.id);
                              setActiveListMenuId(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>Sort by due date</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSortAlphabetical(list.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                            <span>Sort alphabetically (A-Z)</span>
                          </button>

                          {listCards.some((c) => c.completed) && (
                            <button
                              type="button"
                              onClick={() => handleArchiveCompleted(list.id)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-stone-700 hover:text-purple-900 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                              <span>Clear completed cards</span>
                            </button>
                          )}

                          {listCards.length > 0 && currentBoardLists.length > 1 && (
                            <div className="pt-1 border-t border-stone-100">
                              <span className="block px-2.5 py-1 text-[10px] font-semibold text-stone-400 uppercase">
                                Move all cards to...
                              </span>
                              {currentBoardLists
                                .filter((l) => l.id !== list.id)
                                .map((target) => (
                                  <button
                                    key={target.id}
                                    type="button"
                                    onClick={() => handleMoveAllCards(list.id, target.id)}
                                    className="w-full text-left px-2.5 py-1 rounded hover:bg-stone-100 text-stone-600 text-[11px] truncate flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <ArrowRight className="w-3 h-3 text-stone-400" />
                                    <span className="truncate">{target.title}</span>
                                  </button>
                                ))}
                            </div>
                          )}

                          <div className="pt-1 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => {
                                setListToDeleteConfirmId(list.id);
                                setActiveListMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete list</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2 py-1 px-0.5 min-h-[40px]">
                  {listCards.map((card) => {
                    const checklists = card.checklists || [];
                    const completedChecklists = checklists.filter((c) => c.completed).length;

                    return (
                      <div
                        key={card.id}
                        id={`trello-card-${card.id}`}
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        onClick={() => setSelectedCard(card)}
                        className={`bg-white rounded-xl p-3 shadow-xs hover:shadow-md transition cursor-pointer border border-stone-200/80 group overflow-hidden ${
                          card.completed ? 'opacity-85' : ''
                        }`}
                      >
                        {/* Cover Photo Header */}
                        {card.coverImage && (
                          <div className="w-[calc(100%+1.5rem)] h-28 -mx-3 -mt-3 mb-2.5 overflow-hidden bg-stone-100">
                            <img
                              src={card.coverImage}
                              alt={card.title}
                              className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Label Stripe / Badge if set */}
                        {card.color && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span
                              className="h-2 w-10 rounded-full shrink-0"
                              style={{ backgroundColor: card.color }}
                            />
                            {card.labelName && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                                style={{
                                  backgroundColor: `${card.color}18`,
                                  color: card.color,
                                }}
                              >
                                {card.labelName}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Title and Complete Checkbox */}
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrelloCardComplete(card.id);
                            }}
                            className="mt-0.5 text-stone-400 hover:text-emerald-600 transition shrink-0 cursor-pointer"
                            title={card.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {card.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-4 h-4 hover:text-emerald-500" />
                            )}
                          </button>

                          <p
                            className={`text-xs font-semibold text-stone-900 leading-snug flex-1 ${
                              card.completed ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {card.title}
                          </p>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTrelloCard(card.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer shrink-0"
                            title="Delete card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Description snippet */}
                        {card.description && (
                          <p className="text-[11px] text-stone-500 mt-1.5 ml-6 line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        {/* Bottom Indicators: Due Date, Checklist, Notes */}
                        <div className="flex items-center gap-3 mt-2.5 ml-6 text-[11px] text-stone-400 flex-wrap">
                          {card.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-medium ${
                                card.completed
                                  ? 'text-stone-400'
                                  : 'text-stone-600'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDate(card.dueDate)}
                            </span>
                          )}

                          {checklists.length > 0 && (
                            <span
                              className={`flex items-center gap-1 font-medium ${
                                completedChecklists === checklists.length
                                  ? 'text-emerald-600'
                                  : 'text-stone-500'
                              }`}
                            >
                              <CheckSquare className="w-3 h-3" />
                              {completedChecklists}/{checklists.length}
                            </span>
                          )}

                          {card.hasDescription && (
                            <AlignLeft className="w-3 h-3 text-stone-400" title="Has notes" />
                          )}

                          {(card.hasAttachment || card.coverImage || (card.images && card.images.length > 0)) && (
                            <span
                              className="flex items-center gap-1 font-medium text-purple-600"
                              title={`${card.images?.length || 1} image attachment${(card.images?.length || 1) > 1 ? 's' : ''}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              {card.images && card.images.length > 0 ? card.images.length : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* List Footer: "+ Add a card" or Inline Composer (Matches Screenshot) */}
                <div className="mt-1 pt-1.5 shrink-0">
                  {isAddingCard ? (
                    <div className="bg-white p-2.5 rounded-xl border border-purple-300 shadow-sm space-y-2">
                      <textarea
                        rows={2}
                        autoFocus
                        placeholder="Enter a title for this card..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddCardSubmit(list.id);
                          }
                        }}
                        className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-purple-600 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleAddCardSubmit(list.id)}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                        >
                          Add card
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCardInListId(null);
                            setNewCardTitle('');
                          }}
                          className="text-stone-400 hover:text-stone-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg hover:bg-stone-200/80 transition group">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCardInListId(list.id);
                          setNewCardTitle('');
                        }}
                        className="flex-1 text-left px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-stone-500" />
                        <span>Add a card</span>
                      </button>
                      {/* Template compose icon opens full card editor modal */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCard: TrelloCard = {
                            id: `trello_card_${Date.now()}`,
                            listId: list.id,
                            title: 'New Task Card',
                            order: (cardsByList[list.id] || []).length,
                            createdAt: new Date().toISOString(),
                            completed: false,
                          };
                          addTrelloCard(newCard);
                          setSelectedCard(newCard);
                        }}
                        className="p-1.5 mr-1 text-stone-400 hover:text-stone-700 hover:bg-stone-300/70 rounded transition cursor-pointer"
                        title="Create detailed card with checklists & dates"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* "+ Add another list" button (Matches Screenshot frosted pill) */}
          <div className="w-72 shrink-0">
            {isAddingList ? (
              <form
                onSubmit={handleAddListSubmit}
                className="bg-[#f1f2f4] p-3 rounded-2xl shadow-xl space-y-2"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-purple-600 font-semibold"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                    }}
                    className="text-stone-500 hover:text-stone-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                id="trello-add-list-btn"
                onClick={() => setIsAddingList(true)}
                className="w-full bg-white/20 hover:bg-white/25 text-white backdrop-blur-xs rounded-2xl p-3 text-sm font-bold flex items-center gap-2 transition cursor-pointer border border-white/20 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add another list</span>
              </button>
            )}
          </div>
        </main>
      </div>
      ) : (
        /* Classic Project Milestones & Details View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50 space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-purple-700" />
                <h2 className="text-lg font-bold text-stone-900">Project Milestones & Deliverables</h2>
                <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  {filteredProjects.length} Projects
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Manage deliverables, track milestone completion, and align client accounts with your project pipelines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('trello')}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Columns3 className="w-3.5 h-3.5 text-purple-700" />
                <span>Switch to Trello Board</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenQuickAdd('project')}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Project Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
              <FolderKanban className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800">No projects found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery
                  ? `No projects matching "${searchQuery}". Try clearing your search filter.`
                  : 'Start by creating your first milestone-driven project in your workspace.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenQuickAdd('project')}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProjects.map((project) => {
                const client = data.clients?.find((c) => c.id === project.clientId);
                const totalMilestones = project.milestones?.length || 0;
                const completedMilestones =
                  project.milestones?.filter((m) => m.completed).length || 0;
                const progressPct =
                  totalMilestones > 0
                    ? Math.round((completedMilestones / totalMilestones) * 100)
                    : 0;

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden"
                  >
                    {/* Top Accent Strip */}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: project.color || '#8b5cf6' }}
                    />

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Status, Category & Actions */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {project.category}
                          </span>

                          <select
                            value={project.status}
                            onChange={(e) =>
                              updateProject(project.id, {
                                status: e.target.value as ProjectStatus,
                              })
                            }
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 cursor-pointer"
                          >
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-sm text-stone-900 leading-snug">
                          {project.title}
                        </h3>

                        {project.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {/* Metadata badges */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px] text-stone-500">
                          {client && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                              <Users className="w-3 h-3" />
                              {client.name}
                            </span>
                          )}

                          {project.dueDate && (
                            <span className="flex items-center gap-1 bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                              <Calendar className="w-3 h-3 text-purple-600" />
                              {project.dueDate}
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                              project.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : project.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {project.priority} priority
                          </span>
                        </div>

                        {/* Milestones Progress Bar */}
                        <div className="mt-4 pt-3 border-t border-stone-100">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                              <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                              Milestones
                            </span>
                            <span className="text-[11px] font-bold text-stone-500">
                              {completedMilestones}/{totalMilestones} ({progressPct}%)
                            </span>
                          </div>

                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: project.color || '#8b5cf6',
                              }}
                            />
                          </div>
                        </div>

                        {/* Milestones Checklist */}
                        <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto">
                          {project.milestones?.map((milestone) => (
                            <div
                              key={milestone.id}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-50 transition group/ms"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleProjectMilestone(project.id, milestone.id)
                                }
                                className="flex items-center gap-2 text-left text-xs text-stone-800 flex-1 cursor-pointer"
                              >
                                {milestone.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-stone-400 hover:text-purple-600 shrink-0" />
                                )}
                                <span
                                  className={`${
                                    milestone.completed
                                      ? 'line-through text-stone-400'
                                      : 'font-medium'
                                  }`}
                                >
                                  {milestone.title}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteProjectMilestone(project.id, milestone.id)
                                }
                                className="opacity-0 group-hover/ms:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Delete milestone"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Milestone Inline */}
                        <div className="mt-2 pt-2">
                          {addingMilestoneProjectId === project.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAddMilestoneSubmit(project.id);
                              }}
                              className="flex items-center gap-1.5"
                            >
                              <input
                                type="text"
                                autoFocus
                                placeholder="Enter milestone..."
                                value={newMilestoneText[project.id] || ''}
                                onChange={(e) =>
                                  setNewMilestoneText((prev) => ({
                                    ...prev,
                                    [project.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 text-xs px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-purple-600"
                              />
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingMilestoneProjectId(null)}
                                className="p-1 text-stone-400 hover:text-stone-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingMilestoneProjectId(project.id)}
                              className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 p-1 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add milestone</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            // Switch to board and filter or view
                            setViewMode('trello');
                          }}
                          className="text-xs text-stone-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Open in Board</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {projectToDeleteId === project.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteProject(project.id);
                                setProjectToDeleteId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setProjectToDeleteId(null)}
                              className="px-1.5 py-0.5 text-stone-600 hover:bg-stone-200 rounded text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProjectToDeleteId(project.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trello Card Detail Modal */}
      {selectedCard && (
        <TrelloCardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          lists={currentBoardLists}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-600" />
                Share this board
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <p className="text-stone-600">
                Anyone with this workspace access can view and collaborate in real-time.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Board Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{shareCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Power-ups & Automation Modal */}
      {showAutomationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAutomationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Board Automations & Power-Ups
              </h3>
              <button
                onClick={() => setShowAutomationModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="p-3 rounded-xl border border-stone-200 hover:border-purple-300 transition flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900">Auto-Sort Lists by Due Date</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Order cards in all lists chronologically with impending deadlines first.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    currentBoardLists.forEach((l) => handleSortByDueDate(l.id));
                    setShowAutomationModal(false);
                  }}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-lg text-xs"
                >
                  Run Now
                </button>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 hover:border-purple-300 transition flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900">Archive Completed Cards</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Clean up your lists by removing finished cards across all columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    currentBoardLists.forEach((l) => handleArchiveCompleted(l.id));
                    setShowAutomationModal(false);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-xs"
                >
                  Archive Done
                </button>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 hover:border-purple-300 transition flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900">Sync with Workspace Tasks</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Turn pending workspace tasks into cards on your Today list.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentBoardLists.length > 0) {
                      const todayList = currentBoardLists[0];
                      data.tasks.slice(0, 3).forEach((t) => {
                        addTrelloCard({
                          listId: todayList.id,
                          title: t.title,
                          description: t.description,
                          dueDate: t.dueDate,
                          color: t.priority === 'urgent' ? '#f43f5e' : '#8b5cf6',
                          labelName: t.priority.toUpperCase(),
                        });
                      });
                    }
                    setShowAutomationModal(false);
                  }}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg text-xs"
                >
                  Import 3 Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
