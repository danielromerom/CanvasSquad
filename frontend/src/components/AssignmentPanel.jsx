/* global chrome */

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Collapse, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, RefreshCw } from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import TimerPanel from './TimerPanel';
import AssignmentTask from './AssignmentTask.jsx';
import StatsPanel from './StatsPanel';
import WeeklyCalendar from './WeeklyCalendar';
import { API_BASE_URL, FETCH_HEADERS } from '../../config.js';

// --- HELPERS ---
const COURSE_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e',
];

const getCourseColor = (id) => {
  const numId = parseInt(id, 10) || 0;
  const phi = 0.618033988749895;
  const index = Math.floor((numId * phi % 1) * COURSE_COLORS.length);
  return COURSE_COLORS[index];
};

export default function AssignmentPanel({ courseId, initialAssignmentId, showDropdown, handleSetLogin }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localAssignment, setLocalAssignment] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // NEW: State for dropdown selection and assignment list
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId);
  const [courseAssignments, setCourseAssignments] = useState([]);

  const [timerTask, setTimerTask] = useState(null);

  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const saved = localStorage.getItem('scheduledTasks');
    return saved ? JSON.parse(saved) : {};
  });

  const draggedTaskRef = useRef(null);

  const addTask = async () => {
    try {
        const storage = await chrome.storage.local.get(['canvasToken']);
        const res = await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/add/`, {
            method: 'POST',
            headers: {
                ...FETCH_HEADERS,
                'Authorization': `Bearer ${storage.canvasToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ label: "New Step", description: "" })
        });

        if (res.ok) {
            const newTaskData = await res.json();
            // Create the local task object using the ID returned by Django
            const newTask = { 
                id: `task-${selectedAssignmentId}-${newTaskData.id}`, 
                label: newTaskData.title, 
                time: "15m", 
                completed: false,
                description: ""
            };
            setTasks(prev => [...prev, newTask]);
        }
    } catch (err) {
        console.error("Failed to add task:", err);
    }
};

const deleteTask = async (taskId) => {
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setScheduledTasks(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(date => {
            newState[date] = newState[date].filter(t => t.id !== taskId);
        });
        return newState;
    });

    // API call to delete from DB
    const dbId = taskId.split('-').pop();
    try {
        const storage = await chrome.storage.local.get(['canvasToken']);
        await fetch(`${API_BASE_URL}/api/canvas/tasks/${dbId}/delete/`, {
            method: 'DELETE',
            headers: {
                ...FETCH_HEADERS,
                'Authorization': `Bearer ${storage.canvasToken}`
            }
        });
    } catch (err) {
        console.error("Failed to delete task:", err);
    }
  };

  const updateTask = async (taskId, updates) => {
    // 1. Update UI locally (Optimistic update)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

    // 2. Persist to DB
    // Assuming your ID format is "task-123", we grab the "123"
    const dbId = taskId.split('-').pop();

    try {
        const storage = await chrome.storage.local.get(['canvasToken']);
        const response = await fetch(`${API_BASE_URL}/api/canvas/tasks/${dbId}/update/`, {
            method: 'PATCH',
            headers: {
                ...FETCH_HEADERS,
                'Authorization': `Bearer ${storage.canvasToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) throw new Error('Failed to save task');
    } catch (err) {
      console.error("Persistence failed:", err);
    }
  };

  const moveTask = async (dragIndex, hoverIndex) => {
    // 1. Calculate the new order locally
    const reorderedTasks = [...tasks];
    const [removed] = reorderedTasks.splice(dragIndex, 1);
    reorderedTasks.splice(hoverIndex, 0, removed);
    
    // 2. Update UI state
    setTasks(reorderedTasks);

    // 3. Sync with Backend
    try {
        // Map our complex IDs ("task-123-45") back to simple DB primary keys (45)
        const orderedDbIds = reorderedTasks.map(t => t.id.split('-').pop());
        
        const storage = await chrome.storage.local.get(['canvasToken']);
        await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/reorder/`, {
            method: 'POST',
            headers: {
                ...FETCH_HEADERS,
                'Authorization': `Bearer ${storage.canvasToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ordered_ids: orderedDbIds })
        });
    } catch (err) {
        console.error("Failed to sync new order:", err);
    }
  };

  const handleDirectSchedule = (taskToSchedule, dateStr) => {
    setScheduledTasks(prev => {
      const newState = { ...prev };
      
      Object.keys(newState).forEach(day => {
        newState[day] = newState[day].filter(t => t.id !== taskToSchedule.id);
      });

      if (!newState[dateStr]) newState[dateStr] = [];
      
      const taskWithColor = { 
        ...taskToSchedule, 
        color: localAssignment?.color || '#3b82f6',
        course: localAssignment?.course || 'Canvas'
      };

      newState[dateStr].push(taskWithColor);
      
      return newState;
    });
  };

  // 1. Sync selectedAssignmentId when the URL changes (detail view)
  useEffect(() => {
    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }
  }, [initialAssignmentId]);

  // 2. Fetch the list of assignments for the dropdown (List view only)
  useEffect(() => {
    if (showDropdown && courseId) {
        const fetchList = async () => {
          const storage = await chrome.storage.local.get(['canvasToken']);
          const token = storage.canvasToken;
          if (!token) return;

          try {
            const res = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { 
              headers: { 
                ...FETCH_HEADERS, 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true' 
              } 
            });
            if (res.ok) {
              const data = await res.json();
              setCourseAssignments(data.assignments || []);
              if (!selectedAssignmentId && data.assignments?.length > 0) {
                setSelectedAssignmentId(data.assignments[0].canvas_assignment_id);
              }
            }
          } catch (err) { console.error("Failed to fetch assignments", err); }
        };
        fetchList();
      }
    }, [courseId, showDropdown]);

  // 3. Fetch task data for the SELECTED assignment
  const fetchAssignmentData = async (forceRegenerate = false) => {
    if (!courseId || !selectedAssignmentId) return;

    const storage = await chrome.storage.local.get(['canvasToken']);
    const token = storage.canvasToken;

    if (!token) {
      handleSetLogin(false);
      return;
    }

    const authHeaders = {
      ...FETCH_HEADERS,
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };

    if (forceRegenerate) {
      setIsRegenerating(true);
      setTasks([]);

      setScheduledTasks(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(date => {
          newState[date] = newState[date].filter(t => !t.id.includes(`task-${selectedAssignmentId}`));
          if (newState[date].length === 0) delete newState[date];
        });
        return newState;
      });
    } else {
      setIsLoading(true);
      setTasks([]);
    }

    try {
      // 2. Fetch Assignment Metadata (Course name, Due date, etc)
      const metaRes = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { headers: authHeaders });
      if (metaRes.status === 401) return handleSetLogin(false);
      
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const found = metaData.assignments.find(a => String(a.canvas_assignment_id) === String(selectedAssignmentId) || String(a.id) === String(selectedAssignmentId));
        if (found) {
          setLocalAssignment({
            id: String(found.canvas_assignment_id || found.id),
            title: found.title,
            course: metaData.course_name || `Course ${courseId}`,
            color: getCourseColor(courseId),
            due: found.due_at ? new Date(found.due_at).toLocaleDateString() : 'No Date',
            raw_due: found.due_at
          });
        }
      }

      // 3. Check for existing tasks
      let tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/`, { headers: authHeaders });
      let tasksData = null;
      let shouldGenerate = forceRegenerate;

      if (tasksRes.status === 404) {
        shouldGenerate = true;
      } else if (tasksRes.ok) {
        tasksData = await tasksRes.json();
        if (!tasksData.tasks || tasksData.tasks.length === 0) shouldGenerate = true;
      }

      // 4. Run Sync if needed
      if (shouldGenerate) {
        await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/sync/`, { 
          method: 'POST', 
          headers: authHeaders,
          body: JSON.stringify({ force: true })
        });

        tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/`, { 
          headers: authHeaders
        });
        
        if (tasksRes.ok) {
          tasksData = await tasksRes.json();
        }
      }

      // 5. Final State Update
      if (tasksData?.tasks) {
        const locallyCompletedIds = new Set();
        Object.values(scheduledTasks).flat().forEach(t => { if (t.completed) locallyCompletedIds.add(t.id); });

        setTasks(tasksData.tasks.map(t => ({
          id: `task-${selectedAssignmentId}-${t.id}`,
          label: t.title,
          time: t.estimated_minutes ? `${t.estimated_minutes}m` : '15m',
          completed: t.is_completed || locallyCompletedIds.has(`task-${selectedAssignmentId}-${t.id}`),
          aiSummary: t.ai_insight || null,
          description: t.description || null
        })));
      }
    } catch (err) {
      console.error("Critical Panel Fetch Error:", err);
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData(); 
  }, [courseId, selectedAssignmentId]);

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // --- HANDLERS ---
  const handleDragStart = (e, task, index) => {
    const dragData = { 
      ...task, 
      index,
      isEditMode,
      color: localAssignment?.color || '#3b82f6', 
      course: localAssignment?.course || 'Canvas' 
    };
    
    draggedTaskRef.current = dragData;
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));

    e.dataTransfer.setDragImage(new Image(), 0, 0); 
  };

  const handleDropOnCalendar = (e, dateStr) => {
  if (isEditMode) return; 

  e.preventDefault();
  e.stopPropagation();
  
  const rawData = e.dataTransfer.getData("text/plain");
  if (!rawData) return;

  const task = JSON.parse(rawData);

  setScheduledTasks(prev => {
    const newState = { ...prev };

    // if moving internally, remove it from the old day first
    if (task.isInternalMove && task.sourceDate) {
      newState[task.sourceDate] = newState[task.sourceDate].filter(t => t.id !== task.id);
    } 
    // if dragging from the task list, remove it from ANY day it might already be in
    else {
      Object.keys(newState).forEach(day => {
        newState[day] = newState[day].filter(t => t.id !== task.id);
      });
    }

    // add to  new day
    const currentDayTasks = newState[dateStr] || [];
    newState[dateStr] = [...currentDayTasks, task];
    
    return newState;
  });
};

  const removeTaskFromDay = (dateStr, taskId) => {
    setScheduledTasks(prev => ({ ...prev, [dateStr]: prev[dateStr].filter(t => t.id !== taskId) }));
  };

  const handleClearDay = (dateStr, assignmentId = null) => {
    setScheduledTasks(prev => {
      const newState = { ...prev };
      
      if (assignmentId) {
        // ONLY remove tasks belonging to this specific assignment
        newState[dateStr] = newState[dateStr].filter(
          task => !task.id.includes(`task-${assignmentId}`)
        );
        
        // If no tasks are left for that day at all, clean up the key
        if (newState[dateStr].length === 0) {
          delete newState[dateStr];
        }
      } else {
        // Original behavior: delete everything for that day
        delete newState[dateStr];
      }
      
      return newState;
    });
  };

  const toggleTask = (_, taskId) => {
    // 1. Find out if we are checking it or un-checking it
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;
    const willBeCompleted = !taskToToggle.completed;

    // 2. Update the Statistics
    updateStatsOnTaskComplete(willBeCompleted, taskId);

    // 3. Update the local task list state
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: willBeCompleted } : t));

    // 4. Update the scheduled tasks (Calendar) state
    setScheduledTasks(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(dateStr => {
        newState[dateStr] = newState[dateStr].map(t => 
          t.id === taskId ? { ...t, completed: willBeCompleted } : t
        );
      });
      return newState;
    });
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const handleAutoSchedule = () => {
    if (!localAssignment?.raw_due) { alert("Cannot auto-schedule without a valid due date."); return; }
    const alreadyScheduledIds = new Set();
    Object.values(scheduledTasks).flat().forEach(t => alreadyScheduledIds.add(t.id));
    const pendingTasks = tasks.filter(task => !task.completed && !alreadyScheduledIds.has(task.id));
    if (pendingTasks.length === 0) { alert("All active tasks are already scheduled!"); return; }

    const newSchedule = { ...scheduledTasks };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const validDays = [];
    let currentDate = new Date(today);
    const dueDate = new Date(localAssignment.raw_due); dueDate.setHours(0, 0, 0, 0);

    if (dueDate <= today) { validDays.push(new Date(today)); } 
    else { while (currentDate < dueDate) { validDays.push(new Date(currentDate)); currentDate.setDate(currentDate.getDate() + 1); } }

    pendingTasks.forEach((task, index) => {
      const dayIndex = Math.floor((index / pendingTasks.length) * validDays.length);
      const dateStr = validDays[dayIndex].toDateString();
      if (!newSchedule[dateStr]) newSchedule[dateStr] = [];
      newSchedule[dateStr].push({ ...task, color: localAssignment.color || '#3b82f6' });
    });
    setScheduledTasks(newSchedule);
  };

  const handleTimer = (task) =>{
      setTimerTask(task);
      setActiveTab("timer");
  }

  if (isLoading && !localAssignment) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Analyzing assignment...</Typography>
      </Box>
    );
  }

  const updateStatsOnTaskComplete = (isCompleting, taskId) => {
    const today = new Date().toDateString();
    let stats = JSON.parse(localStorage.getItem('userStats')) || {
      totalTasksCompleted: 0,
      currentStreak: 0,
      lastActiveDate: null,
      assignmentsCompleted: 0,
      xp: 0
    };

    if (isCompleting) {
      stats.totalTasksCompleted += 1;
      stats.xp += 10; // 10 XP per task

      // Check if this action completes the entire assignment
      // We look at the 'tasks' state to see if only 1 task was left
      const remainingTasks = tasks.filter(t => !t.completed && t.id !== taskId);
      if (remainingTasks.length === 0) {
        stats.assignmentsCompleted = (stats.assignmentsCompleted || 0) + 1;
        stats.xp += 50; // Bonus 50 XP for finishing the whole assignment
      }

      // Handle Streak logic
      if (stats.lastActiveDate !== today) {
        if (!stats.lastActiveDate) {
          stats.currentStreak = 1;
        } else {
          const lastDate = new Date(stats.lastActiveDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            stats.currentStreak += 1;
          } else if (diffDays > 1) {
            stats.currentStreak = 1;
          }
        }
        stats.lastActiveDate = today;
      }
    } else {
      // Logic for un-checking a task (subtract XP)
      stats.totalTasksCompleted = Math.max(0, stats.totalTasksCompleted - 1);
      stats.xp = Math.max(0, stats.xp - 10);
      
      // If they were done and un-checked one, reduce assignment count
      if (tasks.every(t => t.completed)) {
        stats.assignmentsCompleted = Math.max(0, (stats.assignmentsCompleted || 0) - 1);
        stats.xp = Math.max(0, stats.xp - 50);
      }
    }

    localStorage.setItem('userStats', JSON.stringify(stats));
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pt: 1, pb: 8, pl: 2, pr: 2, maxWidth: '640px', mx: 'auto' }}>
      
      {/* Dropdown - ONLY shows on list page */}
      {showDropdown && courseAssignments.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="assignment-select-label">Select Assignment</InputLabel>
          <Select
            labelId="assignment-select-label"
            value={selectedAssignmentId || ''}
            label="Select Assignment"
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            sx={{ borderRadius: '12px', fontSize: '0.9rem', bgcolor: 'white' }}
          >
            {courseAssignments.map((a) => (
              <MenuItem key={a.canvas_assignment_id} value={a.canvas_assignment_id}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <div className="mb-4">
        <TabSwitcher variant="assignment" activeTab={activeTab} onTabChange={setActiveTab} setTimerTask={(task) => { if (task) setTimerTask(task) }}/>
      </div>

      {/* TASKS TAB (Hidden via CSS, keeps memory alive!) */}
      <Box sx={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
            <div className="p-6 mb-6 shadow-md rounded-2xl text-white transition-all hover:shadow-lg" 
                style={{ background: localAssignment?.color || '#3b82f6'}}>
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

            <WeeklyCalendar variant="detail" scheduledTasks={scheduledTasks} onDropTask={handleDropOnCalendar} onRemoveTask={removeTaskFromDay} onClearDay={handleClearDay} onToggleTask={toggleTask} localAssignment={localAssignment} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
             <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                {isEditMode ? 'Editing Tasks' : 'Task Breakdown'}
              </Typography>
             <Box sx={{ display: 'flex', gap: 1 }}>
                {!isEditMode && (
                  <>
                    <Button onClick={handleAutoSchedule} sx={{ background: '#000', color: '#fff', textTransform: 'none', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '6px' }}>
                      <Sparkles size={12} style={{ marginRight: '4px' }} /> Auto
                    </Button>
                    <Button startIcon={<RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />} onClick={() => fetchAssignmentData(true)} disabled={isRegenerating} size="small" sx={{ textTransform: 'none', fontSize: '12px', color: '#6b7280' }}>
                      Regenerate
                    </Button>
                  </>
                )}
        
              {isEditMode && (
                <Button onClick={addTask} variant="outlined" size="small" sx={{ fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', textTransform: 'none' }}>
                  + Add Step
                </Button>
              )}

              <Button 
                onClick={() => setIsEditMode(!isEditMode)} 
                sx={{ 
                background: isEditMode ? '#10b981' : '#f3f4f6', 
                color: isEditMode ? '#fff' : '#374151', 
                textTransform: 'none', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                padding: '2px 8px',
                minWidth: 'unset',
                borderRadius: '6px',
                '&:hover': { background: isEditMode ? '#059669' : '#e5e7eb' }
              }}
              >
                {isEditMode ? 'Done' : 'Edit'}
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
                tasks.map((task, index) => {
                  const isExpanded = expandedTasks.includes(task.id);
                  return (
                    <AssignmentTask 
                      key={`${task.id}-${task.label}-${task.description}`}
                      task={task} 
                      index={index}
                      isEditMode={isEditMode}
                      isExpanded={isExpanded} 
                      handleDragStart={handleDragStart} 
                      toggleTaskExpansion={toggleTaskExpansion} 
                      toggleTask={toggleTask} 
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                      onMove={moveTask}   
                      localAssignment={localAssignment} 
                      handleTimer={handleTimer} 
                      activeTab={activeTab} 
                      scheduledTasks={scheduledTasks} 
                      setTasks={setTasks} 
                      onScheduleTask={handleDirectSchedule}
                    />
                  )
              }))}
            </div>
          )}
      </Box>

      {/* TIMER TAB (Timer ticks in the background when you are on Tasks tab!) */}
      <Box sx={{ display: activeTab === 'timer' ? 'block' : 'none' }}>
        <TimerPanel 
          timerTask={timerTask ? (tasks.find(t => t.id === timerTask.id) || timerTask) : null} 
          handleDragStart={handleDragStart}
          toggleTaskExpansion={toggleTaskExpansion}
          toggleTask={toggleTask}
          localAssignment={localAssignment}
          handleTimer={handleTimer}
          activeTab={activeTab}
          setTasks={setTasks}
        />
      </Box>
    </Box>
  );
}