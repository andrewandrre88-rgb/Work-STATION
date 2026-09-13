import React, { useState } from 'react';
import { Clock, Plus, Check, Trash2, Calendar, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const DEFAULT_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:30 AM',
  '10:30 AM - 12:00 PM',
  '01:00 PM - 02:30 PM',
  '02:30 PM - 04:00 PM',
  '04:00 PM - 05:30 PM',
];

export const TimeBoxingCard: React.FC = () => {
  const { data, addTimeBlock, toggleTimeBlock, deleteTimeBlock, dueTodayTasks } = useWorkspace();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(DEFAULT_SLOTS[1]);
  const [blockTitle, setBlockTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const timeBlocks = (data.timeBlocks || []).filter(
    (b) => !b.date || b.date === todayStr
  );

  const completedCount = timeBlocks.filter((b) => b.completed).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    addTimeBlock({
      timeSlot: selectedSlot,
      title: blockTitle.trim(),
      taskId: selectedTaskId || undefined,
      completed: false,
      date: todayStr,
    });

    setBlockTitle('');
    setSelectedTaskId('');
    setShowAdd(false);
  };

  const handleSelectTaskToBlock = (taskId: string) => {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setSelectedTaskId(taskId);
    setBlockTitle(task.title);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
              Daily Time-Boxing Schedule
            </h2>
            <p className="text-xs text-stone-500">
              {completedCount} of {timeBlocks.length} time blocks executed today
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer text-xs font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Block Time</span>
        </button>
      </div>

      {/* Add New Block Form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-800"
              >
                {DEFAULT_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                placeholder="What will you focus on during this block?"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                autoFocus
              />
            </div>

            {/* Quick Pick From Today's Tasks */}
            {dueTodayTasks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-500 font-medium">Or pick due task:</span>
                {dueTodayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTaskToBlock(t.id)}
                    className="text-[10px] px-2 py-0.5 bg-white border border-stone-200 text-stone-700 hover:border-stone-400 rounded-md truncate max-w-[140px] cursor-pointer"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
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
              Add Schedule Block
            </button>
          </div>
        </form>
      )}

      {/* Time Blocks List */}
      <div className="space-y-2">
        {timeBlocks.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">
            No time blocks scheduled for today yet. Time-box your key priorities!
          </p>
        ) : (
          timeBlocks.map((block) => {
            return (
              <div
                key={block.id}
                className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                  block.completed
                    ? 'bg-stone-50/60 border-stone-200 text-stone-400'
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTimeBlock(block.id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition cursor-pointer shrink-0 ${
                      block.completed
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'border border-stone-300 hover:border-stone-400 bg-white'
                    }`}
                  >
                    {block.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium block truncate ${
                        block.completed ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {block.title}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{block.timeSlot}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTimeBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition cursor-pointer"
                  title="Remove block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
