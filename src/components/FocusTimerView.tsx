import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Target,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { playFocusCompleteSound } from '../utils/sound';
import { formatDateTime } from '../utils/formatters';

type TimerMode = 'focus' | 'deep_focus' | 'short_break' | 'long_break';

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string; badge: string }> = {
  focus: { label: 'Standard Focus', minutes: 25, color: '#f59e0b', badge: '25m Pomodoro' },
  deep_focus: { label: 'Deep Work', minutes: 50, color: '#ec4899', badge: '50m Deep Flow' },
  short_break: { label: 'Short Break', minutes: 5, color: '#10b981', badge: '5m Recharge' },
  long_break: { label: 'Long Break', minutes: 15, color: '#3b82f6', badge: '15m Rest' },
};

export const FocusTimerView: React.FC = () => {
  const {
    data,
    activeFocusTaskId,
    setActiveFocusTaskId,
    toggleTaskStatus,
    logFocusSession,
    setActiveTab,
  } = useWorkspace();

  const [mode, setMode] = useState<TimerMode>('focus');
  const [totalSeconds, setTotalSeconds] = useState(MODE_CONFIG['focus'].minutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG['focus'].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Active task details
  const activeTask = data.tasks.find((t) => t.id === activeFocusTaskId);

  // Switch mode
  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const secs = MODE_CONFIG[newMode].minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  };

  // Set custom duration
  const applyCustomMinutes = (mins: number) => {
    const valid = Math.max(1, Math.min(180, mins));
    setIsRunning(false);
    setTotalSeconds(valid * 60);
    setSecondsLeft(valid * 60);
    setShowCustomModal(false);
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);

            if (soundEnabled) {
              playFocusCompleteSound();
            }

            // Log session if focus mode
            if (mode === 'focus' || mode === 'deep_focus') {
              const dur = Math.round(totalSeconds / 60);
              logFocusSession({
                taskId: activeFocusTaskId || undefined,
                taskTitle: activeTask ? activeTask.title : 'Free Focus Session',
                durationMinutes: dur,
                mode: 'focus',
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, mode, totalSeconds, activeFocusTaskId, activeTask, logFocusSession]);

  // Adjust time by +/- 5 minutes
  const adjustTime = (deltaMinutes: number) => {
    setSecondsLeft((prev) => {
      const next = Math.max(60, prev + deltaMinutes * 60);
      setTotalSeconds((tot) => Math.max(tot, next));
      return next;
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const handleCompleteEarly = () => {
    setIsRunning(false);
    if (soundEnabled) {
      playFocusCompleteSound();
    }
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    if (mode === 'focus' || mode === 'deep_focus') {
      logFocusSession({
        taskId: activeFocusTaskId || undefined,
        taskTitle: activeTask ? activeTask.title : 'Focus Session',
        durationMinutes: elapsedMinutes,
        mode: 'focus',
      });
    }
    setSecondsLeft(totalSeconds);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressFraction = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  // Stats for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = (data.focusSessions || []).filter((s) => s.completedAt.startsWith(todayStr));
  const totalFocusMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Available tasks to focus on
  const pendingTasks = data.tasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-6 pb-12">
      {/* Zen / Distraction-free Fullscreen Overlay */}
      {isZenMode && (
        <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col items-center justify-between p-8 sm:p-12 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Zen Focus Mode</span>
            </div>
            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
              title="Exit Zen Mode"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-6 my-auto">
            {activeTask ? (
              <div className="space-y-1">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Current Target
                </span>
                <h1 className="text-xl sm:text-3xl font-bold max-w-xl text-stone-100">
                  {activeTask.title}
                </h1>
              </div>
            ) : (
              <div className="text-sm font-medium text-stone-400">
                Pure Concentration Session
              </div>
            )}

            <div className="text-7xl sm:text-9xl font-mono font-bold tracking-tight text-white drop-shadow-sm">
              {formattedTime}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="w-16 h-16 rounded-full bg-white text-stone-950 hover:bg-stone-200 transition flex items-center justify-center shadow-lg cursor-pointer"
              >
                {isRunning ? <Pause className="w-7 h-7 fill-stone-950" /> : <Play className="w-7 h-7 fill-stone-950 ml-1" />}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 transition cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-stone-500">
            Press the exit button in the top right to return to standard workspace view
          </div>
        </div>
      )}

      {/* Main View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            Deep Work & Pomodoro Focus Timer
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Boost execution velocity by pairing dedicated focus sprints with your active tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              soundEnabled
                ? 'bg-stone-100 border-stone-300 text-stone-800'
                : 'bg-white border-stone-200 text-stone-400'
            }`}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-stone-700" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsZenMode(true)}
            className="px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Zen Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Primary Focus Station & Modes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Circular Timer */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center">
          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-stone-100 rounded-xl max-w-md w-full mb-8">
            {(Object.keys(MODE_CONFIG) as TimerMode[]).map((key) => {
              const cfg = MODE_CONFIG[key];
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSwitchMode(key)}
                  className={`flex-1 min-w-[90px] py-1.5 px-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    active
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Circular Progress Display */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
              {/* Background ring */}
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke="#f5f5f4"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress dynamic ring */}
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke={MODE_CONFIG[mode].color}
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center space-y-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                {MODE_CONFIG[mode].badge}
              </span>
              <div className="text-5xl sm:text-6xl font-mono font-bold text-stone-900 tracking-tight">
                {formattedTime}
              </div>
              <span className="text-xs font-medium text-stone-500">
                {isRunning ? 'Session in progress...' : secondsLeft === totalSeconds ? 'Ready to begin' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick Adjust Buttons */}
          <div className="flex items-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => adjustTime(-5)}
              className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            >
              -5 min
            </button>
            <button
              type="button"
              onClick={() => adjustTime(5)}
              className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            >
              +5 min
            </button>
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              Custom
            </button>
          </div>

          {/* Custom Duration Input Form (if toggled) */}
          {showCustomModal && (
            <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2 text-xs">
              <span className="text-stone-600">Set minutes:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-md text-stone-800"
              />
              <button
                type="button"
                onClick={() => applyCustomMinutes(customMinutes)}
                className="px-2.5 py-1 bg-stone-900 text-white font-medium rounded-md hover:bg-stone-800 cursor-pointer"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Main Action Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="p-3 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              id="focus-play-pause-btn"
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all transform active:scale-98 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Start Focus Flow</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCompleteEarly}
              className="p-3 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
              title="Complete & Log Session Early"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Bound Task Bar */}
          <div className="mt-8 w-full border-t border-stone-100 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Active Focus Target
                </span>
                {activeTask ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-semibold text-stone-900 text-sm truncate">
                      {activeTask.title}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 mt-1">
                    No task currently bound. Choose a task from below to track focused time against deliverables.
                  </p>
                )}
              </div>

              {activeTask && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      toggleTaskStatus(activeTask.id);
                      setActiveFocusTaskId(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFocusTaskId(null)}
                    className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 cursor-pointer"
                  >
                    Unlink
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Task Selector & Daily Focus Metrics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Focus Summary Card */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                Today's Focus Velocity
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {todaySessions.length} sessions
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900">
                {totalFocusMinutesToday}
              </span>
              <span className="text-xs font-semibold text-stone-500">minutes of deep work</span>
            </div>

            <div className="mt-3 w-full bg-amber-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalFocusMinutesToday / 100) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-stone-500">
              <span>Goal: 100 min</span>
              <span>{Math.round((totalFocusMinutesToday / 100) * 100)}% reached</span>
            </div>
          </div>

          {/* Quick Bind: Select Pending Task */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-stone-600" />
                Bind to Workspace Task
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-[11px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
              >
                All tasks ↗
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">No pending tasks found!</p>
              ) : (
                pendingTasks.slice(0, 6).map((task) => {
                  const isSelected = activeFocusTaskId === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveFocusTaskId(isSelected ? null : task.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span className="truncate flex-1">{task.title}</span>
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 shrink-0">Select</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Logged Focus History */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-600" />
              Completed Sessions Today
            </h2>

            <div className="space-y-2">
              {todaySessions.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">
                  No sessions logged yet today. Hit start to log your first!
                </p>
              ) : (
                todaySessions.slice(0, 5).map((sess) => (
                  <div
                    key={sess.id}
                    className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-stone-800 truncate">{sess.taskTitle}</p>
                      <p className="text-[10px] text-stone-400">{formatDateTime(sess.completedAt)}</p>
                    </div>
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                      +{sess.durationMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
