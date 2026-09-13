import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  Zap,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  CornerDownRight,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Idea, IdeaStage } from '../types';
import { formatDate, getRelativeDueDateLabel } from '../utils/formatters';

interface IdeasViewProps {
  onOpenQuickAdd: (defaultTab?: 'task' | 'project' | 'idea' | 'client') => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ onOpenQuickAdd }) => {
  const {
    data,
    searchQuery,
    updateIdea,
    deleteIdea,
    updateIdeaStage,
    toggleIdeaMilestone,
    addIdeaMilestone,
    deleteIdeaMilestone,
    convertIdeaToProject,
    setActiveTab,
  } = useWorkspace();

  const [selectedStage, setSelectedStage] = useState<IdeaStage | 'all'>('all');
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, string>>({});
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return data.ideas.filter((i) => {
      if (selectedStage !== 'all' && i.stage !== selectedStage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = i.title.toLowerCase().includes(q);
        const matchesSummary = i.summary.toLowerCase().includes(q);
        const matchesNotes = i.notes.toLowerCase().includes(q);
        const matchesCategory = i.category.toLowerCase().includes(q);
        const matchesTag = i.tags.some((t) => t.toLowerCase().includes(q));
        return matchesTitle || matchesSummary || matchesNotes || matchesCategory || matchesTag;
      }
      return true;
    });
  }, [data.ideas, selectedStage, searchQuery]);

  const handleAddMilestone = (ideaId: string) => {
    const title = newMilestoneInputs[ideaId];
    if (!title || !title.trim()) return;
    addIdeaMilestone(ideaId, title.trim());
    setNewMilestoneInputs((prev) => ({ ...prev, [ideaId]: '' }));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea) return;
    updateIdea(editingIdea.id, {
      title: editingIdea.title,
      summary: editingIdea.summary,
      stage: editingIdea.stage,
      category: editingIdea.category,
      targetDate: editingIdea.targetDate,
      impact: editingIdea.impact,
      effort: editingIdea.effort,
      notes: editingIdea.notes,
      color: editingIdea.color,
    });
    setEditingIdea(null);
  };

  const stagesConfig: {
    id: IdeaStage;
    label: string;
    description: string;
    badgeColor: string;
  }[] = [
    {
      id: 'spark',
      label: 'Spark',
      description: 'Raw concepts & initial sparks',
      badgeColor: 'bg-pink-100 text-pink-800',
    },
    {
      id: 'validation',
      label: 'Validation',
      description: 'Researching & testing viability',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'planning',
      label: 'Planning',
      description: 'Milestones & action roadmap',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'executing',
      label: 'Executing',
      description: 'Actively building & implementing',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'achieved',
      label: 'Achieved',
      description: 'Completed & achieved ideas',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  const totalIdeas = data.ideas.length;
  const inExecutionCount = data.ideas.filter((i) => i.stage === 'executing').length;
  const achievedCount = data.ideas.filter((i) => i.stage === 'achieved').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Ideas & Implementation Tracker
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Capture new ideas and track their journey from initial concept to full achievement.
          </p>
        </div>
        <button
          id="ideas-add-btn"
          onClick={() => onOpenQuickAdd('idea')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Capture New Idea
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">Total Ideas Captured</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{totalIdeas}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Innovation pipeline</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">In Active Execution</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{inExecutionCount}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Actively being implemented</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-stone-500">Achieved & Realized</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            {achievedCount}
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Ideas successfully executed</div>
        </div>
      </div>

      {/* Pipeline Stage Bar Filter */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 px-1">
          <TrendingUp className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-semibold text-stone-700">Implementation Stages</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition cursor-pointer border ${
              selectedStage === 'all'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="font-semibold">All Stages</div>
            <div className={`text-[10px] ${selectedStage === 'all' ? 'text-stone-300' : 'text-stone-400'}`}>
              {totalIdeas} total
            </div>
          </button>

          {stagesConfig.map((st) => {
            const count = data.ideas.filter((i) => i.stage === st.id).length;
            const isSelected = selectedStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="font-semibold">{st.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                  {count} idea{count !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
          <Lightbulb className="w-10 h-10 text-amber-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-700">No ideas in this stage</h3>
          <p className="text-xs text-stone-400 mt-1">
            {searchQuery
              ? `No ideas matching "${searchQuery}".`
              : 'Record a new spark or concept to start implementing!'}
          </p>
          <button
            onClick={() => onOpenQuickAdd('idea')}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
          >
            Capture New Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIdeas.map((idea) => {
            const totalM = idea.milestones.length;
            const doneM = idea.milestones.filter((m) => m.completed).length;
            const pct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
            const isAchieved = idea.stage === 'achieved';
            const isExpanded = expandedIdeaId === idea.id;
            const linkedProject = data.projects.find((p) => p.id === idea.linkedProjectId);
            const relativeDate = getRelativeDueDateLabel(idea.targetDate);

            return (
              <div
                key={idea.id}
                id={`idea-card-${idea.id}`}
                className={`bg-white border rounded-xl p-5 shadow-2xs transition-all flex flex-col justify-between ${
                  isAchieved
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Top line: Stage dropdown, category, actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Stage selector dropdown */}
                      <select
                        value={idea.stage}
                        onChange={(e) => updateIdeaStage(idea.id, e.target.value as IdeaStage)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider cursor-pointer border-none focus:outline-none ${
                          idea.stage === 'achieved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : idea.stage === 'executing'
                            ? 'bg-indigo-100 text-indigo-800'
                            : idea.stage === 'planning'
                            ? 'bg-blue-100 text-blue-800'
                            : idea.stage === 'validation'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                        title="Change implementation stage"
                      >
                        <option value="spark">💡 Spark</option>
                        <option value="validation">🔍 Validation</option>
                        <option value="planning">📋 Planning</option>
                        <option value="executing">🚀 Executing</option>
                        <option value="achieved">🏆 Achieved</option>
                      </select>

                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {idea.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingIdea(idea)}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition cursor-pointer"
                        title="Edit Idea"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteIdea(idea.id);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Idea"
                        aria-label={`Delete idea ${idea.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-semibold text-stone-900 mt-2.5 tracking-tight">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {idea.summary}
                  </p>

                  {/* Ratings: Impact & Effort */}
                  <div className="flex items-center gap-4 text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Impact:</span>
                      <span className="font-semibold text-stone-800">{idea.impact}/5</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Effort:</span>
                      <span className="font-semibold text-stone-800">{idea.effort}/5</span>
                    </div>

                    {idea.targetDate && (
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span className={relativeDate.isOverdue ? 'text-rose-600' : 'text-stone-600'}>
                          Target {formatDate(idea.targetDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Implementation Progress Bar */}
                  <div className="mt-3.5 pt-2 border-t border-stone-100">
                    <div className="flex justify-between text-xs text-stone-600 font-medium mb-1">
                      <span className="flex items-center gap-1">
                        <span>Implementation Steps</span>
                        {isAchieved && (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            • Goal Achieved!
                          </span>
                        )}
                      </span>
                      <span>
                        {doneM}/{totalM} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isAchieved ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones / Action Steps Accordion */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? 'Hide Steps'
                          : `Action Steps & Milestones (${totalM})`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Convert to Project Action */}
                    {!linkedProject ? (
                      <button
                        onClick={() => {
                          convertIdeaToProject(idea.id);
                          setActiveTab('projects');
                        }}
                        className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
                        title="Promote this idea into a full workspace project"
                      >
                        <FolderKanban className="w-3 h-3" />
                        <span>Turn into Project</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('projects')}
                        className="text-[10px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                      >
                        📁 Linked: {linkedProject.title}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 bg-stone-50/80 p-3 rounded-lg border border-stone-200/70">
                      {idea.milestones.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic">
                          No action steps yet. Add the first step below to begin implementing!
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {idea.milestones.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between gap-2 text-xs py-1"
                            >
                              <label className="flex items-center gap-2 cursor-pointer min-w-0">
                                <input
                                  type="checkbox"
                                  checked={m.completed}
                                  onChange={() => toggleIdeaMilestone(idea.id, m.id)}
                                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span
                                  className={`truncate ${
                                    m.completed
                                      ? 'line-through text-stone-400'
                                      : 'text-stone-800'
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </label>
                              <button
                                onClick={() => deleteIdeaMilestone(idea.id, m.id)}
                                className="text-stone-300 hover:text-rose-500 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add action step input */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200/50">
                        <input
                          type="text"
                          placeholder="Next implementation step..."
                          value={newMilestoneInputs[idea.id] || ''}
                          onChange={(e) =>
                            setNewMilestoneInputs({
                              ...newMilestoneInputs,
                              [idea.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMilestone(idea.id);
                            }
                          }}
                          className="flex-1 text-xs bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:border-stone-400"
                        />
                        <button
                          onClick={() => handleAddMilestone(idea.id)}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 rounded cursor-pointer"
                        >
                          Add Step
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900">Edit Idea</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Idea Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingIdea.title}
                  onChange={(e) => setEditingIdea({ ...editingIdea, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Summary / Core Value
                </label>
                <textarea
                  rows={2}
                  value={editingIdea.summary}
                  onChange={(e) => setEditingIdea({ ...editingIdea, summary: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={editingIdea.stage}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, stage: e.target.value as IdeaStage })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="spark">Spark (Concept)</option>
                    <option value="validation">Validation</option>
                    <option value="planning">Planning</option>
                    <option value="executing">Executing</option>
                    <option value="achieved">Achieved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingIdea.category}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, category: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Impact (1-5)
                  </label>
                  <select
                    value={editingIdea.impact}
                    onChange={(e) =>
                      setEditingIdea({
                        ...editingIdea,
                        impact: parseInt(e.target.value, 10) as any,
                      })
                    }
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
                    Effort (1-5)
                  </label>
                  <select
                    value={editingIdea.effort}
                    onChange={(e) =>
                      setEditingIdea({
                        ...editingIdea,
                        effort: parseInt(e.target.value, 10) as any,
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="1">1 - Quick Win</option>
                    <option value="2">2 - Light</option>
                    <option value="3">3 - Moderate</option>
                    <option value="4">4 - Substantial</option>
                    <option value="5">5 - Major Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editingIdea.targetDate || ''}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, targetDate: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Implementation Notes & Research
                </label>
                <textarea
                  rows={3}
                  value={editingIdea.notes}
                  onChange={(e) => setEditingIdea({ ...editingIdea, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
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
