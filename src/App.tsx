import { useState, useEffect, useRef } from 'react'
import './App.css'

type Mode = 'WORK' | 'REST' | 'STOPPED'

function App() {
  const [workTime, setWorkTime] = useState<number>(30)
  const [restTime, setRestTime] = useState<number>(10)
  
  const [mode, setMode] = useState<Mode>('STOPPED')
  const [timeLeft, setTimeLeft] = useState<number>(workTime)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [animate, setAnimate] = useState<boolean>(false)

  const audioCtxRef = useRef<AudioContext | null>(null)

  // Initialize Audio Context for beeps
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtxRef.current = new AudioContext();
    }
  }, []);

  const playBeep = (freq: number, duration: number) => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    
    gainNode.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    oscillator.start();
    oscillator.stop(audioCtxRef.current.currentTime + duration);
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (mode !== 'STOPPED' && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer hit 0!
            setAnimate(true);
            setTimeout(() => setAnimate(false), 300);
            
            if (mode === 'WORK') {
              playBeep(440, 0.5); // Lower tone for rest
              setMode('REST');
              return restTime;
            } else {
              playBeep(880, 0.5); // Higher tone for work
              setMode('WORK');
              return workTime;
            }
          }
          
          if (prev <= 4) {
             // countdown beeps
             playBeep(600, 0.1);
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, isPaused, workTime, restTime]);

  const toggleTimer = () => {
    if (mode === 'STOPPED') {
      // For mobile browsers, play a silent sound to unlock audio context
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setMode('WORK');
      setTimeLeft(workTime);
      setIsPaused(false);
      playBeep(880, 0.5);
    } else {
      setIsPaused(!isPaused);
    }
  }

  const resetTimer = () => {
    setMode('STOPPED');
    setTimeLeft(workTime);
    setIsPaused(false);
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return s.toString();
  }

  return (
    <div className="container">
      <h1>IntervalLoop</h1>
      
      <div className={`timer-circle ${mode.toLowerCase()} ${animate ? 'pop-animation' : ''}`}>
        <div className="time-display">
          {formatTime(timeLeft)}
        </div>
        <div className="mode-label">
          {mode === 'STOPPED' ? 'Ready' : mode === 'WORK' ? 'Work' : 'Rest'}
        </div>
      </div>

      <div className="controls">
        <button 
          className="btn-primary"
          onClick={toggleTimer}
        >
          {mode === 'STOPPED' ? 'START' : isPaused ? 'RESUME' : 'PAUSE'}
        </button>
        <button 
          className="btn-secondary"
          onClick={resetTimer}
          disabled={mode === 'STOPPED'}
        >
          RESET
        </button>
      </div>

      <div className="settings">
        <div className="setting-group">
          <label className="setting-label">WORK (sec)</label>
          <input 
            type="number" 
            className="setting-input"
            value={workTime}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 30);
              setWorkTime(val);
              if (mode === 'STOPPED') setTimeLeft(val);
            }}
            disabled={mode !== 'STOPPED'}
          />
        </div>
        <div className="setting-group">
          <label className="setting-label">REST (sec)</label>
          <input 
            type="number" 
            className="setting-input"
            value={restTime}
            onChange={(e) => setRestTime(Math.max(1, parseInt(e.target.value) || 10))}
            disabled={mode !== 'STOPPED'}
          />
        </div>
      </div>
    </div>
  )
}

export default App
