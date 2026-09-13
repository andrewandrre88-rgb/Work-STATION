import React, { useState } from 'react';
import { Flame, Check, Plus, Trash2, Trophy, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export const DailyHabitsCard: React.FC = () => {
  const { data, toggleHabit, addHabit, deleteHabit } = useWorkspace();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');

  const todayStr = new Date().toISOString().split('T')[0];
  const habits = data.habits || [];

  const completedCount = habits.filter((h) => h.completedDates?.includes(todayStr)).length;
  const completionPercentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit(newTitle.trim(), newCategory);
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 fill-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              Daily Habits & Routines
              {completionPercentage === 100 && habits.length > 0 && (
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> All Done!
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              {completedCount} of {habits.length} habits achieved today ({completionPercentage}%)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer text-xs font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Routine</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-orange-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Add New Habit Form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Read 15 mins of technical docs, Drink 2L water..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-700"
            >
              <option value="Focus">Focus</option>
              <option value="Planning">Planning</option>
              <option value="Health">Health</option>
              <option value="Communication">Communication</option>
              <option value="Review">Review</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 cursor-pointer"
            >
              Save Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-2">
        {habits.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">No habits added yet. Click Add Routine above!</p>
        ) : (
          habits.map((habit) => {
            const isDoneToday = habit.completedDates?.includes(todayStr);
            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isDoneToday
                    ? 'bg-orange-50/40 border-orange-200/70 text-stone-900'
                    : 'bg-stone-50/60 hover:bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 ${
                      isDoneToday
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'border-2 border-stone-300 hover:border-stone-400 bg-white'
                    }`}
                  >
                    {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium truncate ${
                          isDoneToday ? 'line-through text-stone-400 font-normal' : 'text-stone-800'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">{habit.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Streak Flame */}
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold"
                    title={`${habit.streak} day active streak`}
                  >
                    <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                    <span>{habit.streak}d</span>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition cursor-pointer"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
