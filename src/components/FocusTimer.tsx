import { useState, useEffect } from 'react';
import { Play, Pause, RotateCw, Clock, Coffee, Bell } from 'lucide-react';

interface Props {
  hex?: string;
}

export function FocusTimer({ hex = '#4a7ab5' }: Props) {
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'stopwatch'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds((s) => s + 1);
        } else {
          setTimeLeft((t) => {
            if (t <= 1) {
              setIsRunning(false);
              // Simple audio notification beep
              try {
                const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
              } catch {}
              return 0;
            }
            return t - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode]);

  function switchMode(newMode: 'pomodoro' | 'shortBreak' | 'stopwatch') {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (newMode === 'shortBreak') setTimeLeft(5 * 60);
    else setStopwatchSeconds(0);
  }

  function reset() {
    setIsRunning(false);
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else setStopwatchSeconds(0);
  }

  const minutes = mode === 'stopwatch' ? Math.floor(stopwatchSeconds / 60) : Math.floor(timeLeft / 60);
  const seconds = mode === 'stopwatch' ? stopwatchSeconds % 60 : timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTime = mode === 'pomodoro' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 60;
  const progressPercent = mode === 'stopwatch' ? 100 : Math.round(((totalTime - timeLeft) / totalTime) * 100);

  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-paper-200 shadow-soft text-xs">
      <div className="flex items-center gap-1 border-r border-paper-200 pr-2">
        <button
          onClick={() => switchMode('pomodoro')}
          className={`p-1 rounded-lg transition-colors ${
            mode === 'pomodoro' ? 'bg-paper-200 text-ink-800 font-bold' : 'text-ink-400 hover:text-ink-600'
          }`}
          title="25-min Pomodoro"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`p-1 rounded-lg transition-colors ${
            mode === 'shortBreak' ? 'bg-paper-200 text-ink-800 font-bold' : 'text-ink-400 hover:text-ink-600'
          }`}
          title="5-min Rest Break"
        >
          <Coffee className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-ink-800 tracking-wider">
          {timeFormatted}
        </span>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded-lg text-white transition-all shadow-sm active:scale-95"
          style={{ backgroundColor: hex }}
          title={isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
        </button>

        <button
          onClick={reset}
          className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-paper-100 transition-colors"
          title="Reset"
        >
          <RotateCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
