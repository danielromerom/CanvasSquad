import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Collapse, Button } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, RefreshCw } from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import TimerPanel from './TimerPanel';
import AssignmentTask from './AssignmentTask.jsx';
import WeeklyCalendar from './WeeklyCalendar';
import { API_BASE_URL, FETCH_HEADERS } from '../../config.js';

// --- HELPERS ---
const COURSE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#f43f5e',
];

const getCourseColor = (id) => {
  const numId = parseInt(id, 10) || 0;
  
  const phi = 0.618033988749895;
  const index = Math.floor((numId * phi % 1) * COURSE_COLORS.length);
  
  return COURSE_COLORS[index];
};

export default function AssignmentDetailView({ initialAssignment }) {
  const [activeTab, setActiveTab] = useState('tasks');

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [localAssignment, setLocalAssignment] = useState(initialAssignment || null);
  const [expandedTasks, setExpandedTasks] = useState([]);

  const [timerTask, setTimerTask] = useState(null);

  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const saved = localStorage.getItem('scheduledTasks');
    return saved ? JSON.parse(saved) : {};
  });

  const getCanvasIdsFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/courses\/(\d+)\/assignments\/(\d+)/);
    if (match) {
      return { courseId: match[1], assignmentId: match[2] };
    }
    return { courseId: null, assignmentId: null };
  };

  const { courseId, assignmentId } = getCanvasIdsFromUrl();

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  const fetchAssignmentData = async (forceRegenerate = false) => {
    if (!courseId || !assignmentId) return;

    if (forceRegenerate) {
        setIsRegenerating(true);
    } else {
        setIsLoading(true);
    }

    try {
      // Fetch assignment metadata
      const metaRes = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { headers: FETCH_HEADERS });
      if (metaRes.ok) {
          const metaData = await metaRes.json();
          const assignmentMeta = metaData.assignments.find(a => 
             String(a.canvas_assignment_id) === String(assignmentId) || String(a.id) === String(assignmentId)
          );

          if (assignmentMeta) {
             setLocalAssignment({
                id: String(assignmentMeta.canvas_assignment_id || assignmentMeta.id),
                title: assignmentMeta.title,
                course: metaData.course_name || `Course ${courseId}`,
                color: getCourseColor(courseId),
                due: assignmentMeta.due_at ? new Date(assignmentMeta.due_at).toLocaleDateString() : 'No Date',
                raw_due: assignmentMeta.due_at // Saved for the Auto-Scheduler
             });
          }
      }

      let tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${assignmentId}/tasks/`, { headers: FETCH_HEADERS });
      
      let tasksData = null;
      let shouldGenerate = forceRegenerate;

      if (tasksRes.status === 404) {
          shouldGenerate = true;
      } else if (tasksRes.ok) {
          tasksData = await tasksRes.json();
          if (!tasksData.tasks || tasksData.tasks.length === 0) {
              shouldGenerate = true;
          }
      }

      if (shouldGenerate) {
          await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/sync/`, { 
              method: 'POST', 
              headers: FETCH_HEADERS,
              body: JSON.stringify({ force: true })
          });

          tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${assignmentId}/tasks/`, { headers: FETCH_HEADERS });
          if (tasksRes.ok) {
              tasksData = await tasksRes.json();
          }
      }

      if (tasksData && tasksData.tasks) {
          // 1. Get locally completed tasks to override the database
          const locallyCompletedIds = new Set();
          Object.values(scheduledTasks).flat().forEach(t => {
              if (t.completed) locallyCompletedIds.add(t.id);
          });

          const formattedTasks = tasksData.tasks.map((t) => {
             // 2. Format ID exactly like MainPanel so they share the same calendar
             const frontendTaskId = `task-${assignmentId}-${t.id}`;
             return {
                 id: frontendTaskId, 
                 label: t.title, 
                 estTime: t.estimated_minutes ? `${t.estimated_minutes}m` : '15m',
                 // 3. Apply the completion fix
                 completed: t.is_completed || locallyCompletedIds.has(frontendTaskId),
                 aiSummary: t.ai_insight || null, 
                 description: t.description || null
             }
          });
          setTasks(formattedTasks);
      }

    } catch (err) {
      console.error("Error fetching assignment details:", err);
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData(); 
  }, [courseId, assignmentId]);

  const draggedTaskRef = useRef(null);

  // --- HANDLERS ---

  const handleDragStart = (e, task) => {
    draggedTaskRef.current = { 
      ...task, 
      color: localAssignment?.color || '#3b82f6', 
      course: localAssignment?.course || 'Canvas' 
    };
  };

  const handleDropOnCalendar = (e, dateStr) => {
    e.preventDefault();
    e.stopPropagation(); 
    const task = draggedTaskRef.current;
    
    if (task) {
      setScheduledTasks(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
            newState[key] = newState[key].filter(t => t.id !== task.id);
        });
        const currentDayTasks = newState[dateStr] || [];
        newState[dateStr] = [...currentDayTasks, task];
        return newState;
      });
    }
    draggedTaskRef.current = null;
  };

  const removeTaskFromDay = (dateStr, taskId) => {
    setScheduledTasks(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].filter(t => t.id !== taskId)
    }));
  };

  const handleClearDay = (dateStr) => {
    setScheduledTasks(prev => {
      const newState = { ...prev };
      delete newState[dateStr];
      return newState;
    });
  };

  const toggleTask = (_, taskId) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));

    setScheduledTasks(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(dateStr => {
        newState[dateStr] = newState[dateStr].map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
      });
      return newState;
    });
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Upgraded Auto-Schedule for Assignment Detail View
  const handleAutoSchedule = () => {
    if (!localAssignment || !localAssignment.raw_due) {
        alert("Cannot auto-schedule an assignment without a valid due date.");
        return;
    }

    const alreadyScheduledIds = new Set();
    Object.values(scheduledTasks).flat().forEach(t => alreadyScheduledIds.add(t.id));

    const pendingTasks = tasks.filter(task => !task.completed && !alreadyScheduledIds.has(task.id));
    
    if (pendingTasks.length === 0) {
      alert("All active tasks are already scheduled!");
      return;
    }

    const newSchedule = { ...scheduledTasks };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validDays = [];
    let currentDate = new Date(today);
    const dueDate = new Date(localAssignment.raw_due);
    dueDate.setHours(0, 0, 0, 0);

    // If due today or in the past, schedule for today
    if (dueDate <= today) {
        validDays.push(new Date(today));
    } else {
        // Otherwise schedule between today and the day before it is due
        while (currentDate < dueDate) {
            validDays.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // Distribute chronologically
    pendingTasks.forEach((task, index) => {
      const dayIndex = Math.floor((index / pendingTasks.length) * validDays.length);
      const scheduledDay = validDays[dayIndex];
      const dateStr = scheduledDay.toDateString();

      if (!newSchedule[dateStr]) newSchedule[dateStr] = [];
      newSchedule[dateStr].push({
        ...task,
        color: localAssignment.color || '#3b82f6'
      });
    });

    setScheduledTasks(newSchedule);
  };

  const handleTimer = (task) =>{
      setTimerTask(task);
      setActiveTab("timer");
  }

  if (isLoading && !localAssignment) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Analyzing assignment...</Typography>
      </Box>
    );
  }

  if (!courseId || !assignmentId) {
    return <Typography sx={{ p: 4 }}>Please open an assignment in Canvas to see details.</Typography>;
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pt: 1, pb: 8, pl: 2, pr: 2, maxWidth: '640px', mx: 'auto' }}>

      <div className="mb-4">
        <TabSwitcher variant="assignment" activeTab={activeTab} onTabChange={setActiveTab} setTimerTask={setTimerTask}/>
      </div>

      {activeTab === 'tasks' && (
        <>
            {/* Assignment Card */}
            <div className="p-6 mb-6 shadow-md rounded-2xl text-white transition-all hover:shadow-lg" 
                style={{ background: `linear-gradient(135deg, ${localAssignment?.color || '#3b82f6'} 0%, #000000 100%)` }}>
              <p className="text-[10px] opacity-80 mb-1 uppercase tracking-widest font-bold">{localAssignment?.course}</p>
              <h2 className="text-2xl font-bold mb-4">{localAssignment?.title || 'Loading...'}</h2>
              <div className="flex justify-between text-sm font-medium opacity-90 mb-2">
                  <span>Due: {localAssignment?.due || '...'}</span>
                  <span>{tasks.filter(t => t.completed).length}/{tasks.length} Complete</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-1.5">
                  <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* CALENDAR */}
            <WeeklyCalendar 
              scheduledTasks={scheduledTasks}
              onDropTask={handleDropOnCalendar}
              onRemoveTask={removeTaskFromDay}
              onClearDay={handleClearDay}
              onToggleTask={toggleTask}
            />

          {/* DYNAMIC TASKS LIST */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
             <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a' }}>Task Breakdown</Typography>
             
             <Box sx={{ display: 'flex', gap: 1 }}>
                 {/* AUTO BUTTON */}
                 <Button 
                   onClick={handleAutoSchedule}
                   sx={{ background: '#000', color: '#fff', textTransform: 'none', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', minWidth: 0, borderRadius: '6px', '&:hover': { background: '#333' } }}
                 >
                   <Sparkles size={12} style={{ marginRight: '4px' }} /> Auto
                 </Button>

                 {/* REGENERATE BUTTON */}
                 <Button 
                   startIcon={<RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />}
                   onClick={() => fetchAssignmentData(true)}
                   disabled={isRegenerating}
                   size="small"
                   sx={{ textTransform: 'none', fontSize: '12px', color: '#6b7280' }}
                 >
                   {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                 </Button>
             </Box>
          </Box>
          
          {isLoading && tasks.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : (
            <div className="space-y-3">
              {tasks.length === 0 && !isRegenerating ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No tasks generated yet. Click 'Regenerate' to create a plan.
                  </Typography>
              ) : (
                tasks.map((task) => {
                  const isExpanded = expandedTasks.includes(task.id);
                  return(
                    <AssignmentTask task={task} handleDragStart={handleDragStart} toggleTaskExpansion={toggleTaskExpansion} toggleTask={toggleTask} localAssignment={localAssignment} handleTimer={handleTimer} setTasks={setTasks}/>
                  )
              }))}
            </div>
          )}
        </>
      )}

      {activeTab === 'timer' && timerTask && 
      <TimerPanel 
      timerTask={timerTask} 
      handleDragStart={handleDragStart}
      toggleTaskExpansion={toggleTaskExpansion}
      toggleTask={toggleTask}
      localAssignment={localAssignment}
      handleTimer={handleTimer}
      activeTab={activeTab}
      setTasks={setTasks}
      /> || 
      activeTab === 'timer' && (timerTask == null) && <TimerPanel />
      }
    </Box>
  );
}