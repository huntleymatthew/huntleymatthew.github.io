import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [timerDuration, setTimerDuration] = useState(25); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(timerDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [isBreakRunning, setIsBreakRunning] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [breakDuration, setBreakDuration] = useState(5); // Default 5 minutes
  const [showBreakComplete, setShowBreakComplete] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('focusSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setShowNamePrompt(true);
      playChime();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Break timer countdown effect
  useEffect(() => {
    let interval = null;
    
    if (isBreakRunning && breakTimeLeft > 0) {
      interval = setInterval(() => {
        setBreakTimeLeft(breakTimeLeft => breakTimeLeft - 1);
      }, 1000);
    } else if (breakTimeLeft === 0 && isBreakRunning) {
      setIsBreakRunning(false);
      setShowBreakComplete(true);
      playChime();
    }
    
    return () => clearInterval(interval);
  }, [isBreakRunning, breakTimeLeft]);

  // Update browser tab title based on current state
  useEffect(() => {
    if (isRunning) {
      document.title = `Focus Timer - ${formatTime(timeLeft)}`;
    } else if (isBreakRunning) {
      document.title = `Break Time - ${formatTime(breakTimeLeft)}`;
    } else {
      document.title = 'Focus Timer';
    }
  }, [isRunning, isBreakRunning, timeLeft, breakTimeLeft]);

  const playChime = () => {
    try {
      // Create audio context for chime sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set chime properties
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio playback not supported');
    }
  };

  const startTimer = () => {
    setTimeLeft(timerDuration * 60);
    setIsRunning(true);
    setSessionStartTime(new Date());
    setShowNamePrompt(false);
    setShowBreakPrompt(false);
    setShowBreakComplete(false);
  };

  const handleLostFocus = () => {
    setIsRunning(false);
    setTimeLeft(timerDuration * 60);
    setSessionStartTime(null);
  };

  const handleSessionSave = () => {
    if (sessionName.trim()) {
      // Calculate the actual end time based on start time + duration
      const actualEndTime = new Date(sessionStartTime.getTime() + (timerDuration * 60 * 1000));
      const newSession = {
        id: Date.now(),
        name: sessionName,
        duration: timerDuration,
        completed: true,
        startTime: sessionStartTime,
        endTime: actualEndTime,
        timestamp: actualEndTime.toISOString()
      };
      
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      localStorage.setItem('focusSessions', JSON.stringify(updatedSessions));
      
      setSessionName('');
      setSessionStartTime(null);
      setShowNamePrompt(false);
      setShowBreakPrompt(true);
    }
  };

  const startBreak = () => {
    setBreakTimeLeft(breakDuration * 60);
    setIsBreakRunning(true);
    setShowBreakPrompt(false);
  };

  const skipBreak = () => {
    setShowBreakPrompt(false);
  };

  const handleBreakComplete = () => {
    setShowBreakComplete(false);
  };

  const endBreakEarly = () => {
    setIsBreakRunning(false);
    // Skip confirmation screen when ending break early
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startStr = start.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    const endStr = end.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    return `[${startStr}-${endStr}]`;
  };

  const showClearConfirmation = () => {
    setShowClearConfirm(true);
  };

  const clearSessions = () => {
    setSessions([]);
    localStorage.removeItem('focusSessions');
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="App-header">
        <h1>Focus Timer</h1>
        
        {!isRunning && !showNamePrompt && !showBreakPrompt && !isBreakRunning && !showBreakComplete && (
          <div className="timer-setup">
            <div className="duration-input">
              <label htmlFor="duration">Timer Duration (minutes):</label>
              <input
                type="number"
                id="duration"
                min="1"
                max="120"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 1)}
                disabled={isRunning}
              />
            </div>
            <button onClick={startTimer} className="start-btn">
              Start Timer
            </button>
          </div>
        )}

        {isRunning && (
          <div className="timer-running">
            <div className="time-display">{formatTime(timeLeft)}</div>
            <button onClick={handleLostFocus} className="lost-focus-btn">
              Lost Focus
            </button>
          </div>
        )}

        {showNamePrompt && (
          <div className="name-prompt">
            <h3>Great job! You completed your focus session.</h3>
            <p>What would you like to call this session?</p>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name..."
              autoFocus
            />
            <button onClick={handleSessionSave} className="save-btn">
              Save Session
            </button>
          </div>
        )}

        {showBreakPrompt && (
          <div className="break-prompt">
            <h3>Time for a break!</h3>
            <p>How long would you like your break to be?</p>
            <div className="break-duration-input">
              <input
                type="number"
                min="1"
                max="60"
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 1)}
              />
              <span>minutes</span>
            </div>
            <div className="break-buttons">
              <button onClick={startBreak} className="start-break-btn">
                Start Break
              </button>
              <button onClick={skipBreak} className="skip-break-btn">
                Skip Break
              </button>
            </div>
          </div>
        )}

        {isBreakRunning && (
          <div className="break-running">
            <h3>Break Time!</h3>
            <div className="time-display break-time">{formatTime(breakTimeLeft)}</div>
            <p>Take a moment to relax and recharge.</p>
            <button onClick={endBreakEarly} className="end-break-btn">
              End Break
            </button>
          </div>
        )}

        {showBreakComplete && (
          <div className="break-complete">
            <h3>Break Complete!</h3>
            <p>Ready to start your next focus session?</p>
            <button onClick={handleBreakComplete} className="okay-btn">
              Okay
            </button>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="sessions">
            <h3>Previous Sessions</h3>
            <button onClick={showClearConfirmation} className="clear-btn">
              Clear All Sessions
            </button>
            <div className="sessions-list">
              {sessions.map(session => (
                <div key={session.id} className="session-item">
                  <span className="session-name">{session.name}</span>
                  <span className="session-duration">
                    {session.duration} min {session.startTime && session.endTime && formatTimeRange(session.startTime, session.endTime)}
                  </span>
                  <span className="session-date">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showClearConfirm && (
          <div className="clear-confirm-overlay">
            <div className="clear-confirm-modal">
              <h3>Are you sure?</h3>
              <p>This will permanently delete all your saved sessions. This action cannot be undone.</p>
              <div className="clear-confirm-buttons">
                <button onClick={clearSessions} className="confirm-clear-btn">
                  Yes, Clear All
                </button>
                <button onClick={cancelClear} className="cancel-clear-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
