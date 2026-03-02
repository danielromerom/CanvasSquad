import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Collapse, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, RefreshCw } from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import TimerPanel from './TimerPanel';
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

export default function AssignmentPanel({ courseId, initialAssignmentId, showDropdown }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localAssignment, setLocalAssignment] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState([]);
  
  // NEW: State for dropdown selection and assignment list
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId);
  const [courseAssignments, setCourseAssignments] = useState([]);

  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const saved = localStorage.getItem('scheduledTasks');
    return saved ? JSON.parse(saved) : {};
  });

  const draggedTaskRef = useRef(null);

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
        try {
          const res = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { headers: FETCH_HEADERS });
          if (res.ok) {
            const data = await res.json();
            setCourseAssignments(data.assignments || []);
            // Auto-select first assignment if none selected
            if (!selectedAssignmentId && data.assignments?.length > 0) {
              setSelectedAssignmentId(data.assignments[0].canvas_assignment_id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch course assignments", err);
        }
      };
      fetchList();
    }
  }, [courseId, showDropdown]);

  // 3. Fetch task data for the SELECTED assignment
  const fetchAssignmentData = async (forceRegenerate = false) => {
    if (!courseId || !selectedAssignmentId) return;

    if (forceRegenerate) {
        setIsRegenerating(true);
    } else {
        setIsLoading(true);
    }

    try {
      // Fetch assignment metadata to update the card
      const metaRes = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { headers: FETCH_HEADERS });
      if (metaRes.ok) {
          const metaData = await metaRes.json();
          const assignmentMeta = metaData.assignments.find(a => 
             String(a.canvas_assignment_id) === String(selectedAssignmentId) || String(a.id) === String(selectedAssignmentId)
          );

          if (assignmentMeta) {
             setLocalAssignment({
                id: String(assignmentMeta.canvas_assignment_id || assignmentMeta.id),
                title: assignmentMeta.title,
                course: metaData.course_name || `Course ${courseId}`,
                color: getCourseColor(courseId),
                due: assignmentMeta.due_at ? new Date(assignmentMeta.due_at).toLocaleDateString() : 'No Date',
                raw_due: assignmentMeta.due_at
             });
          }
      }

      let tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/`, { headers: FETCH_HEADERS });
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

          tasksRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${selectedAssignmentId}/tasks/`, { headers: FETCH_HEADERS });
          if (tasksRes.ok) {
              tasksData = await tasksRes.json();
          }
      }

      if (tasksData && tasksData.tasks) {
          const locallyCompletedIds = new Set();
          Object.values(scheduledTasks).flat().forEach(t => {
              if (t.completed) locallyCompletedIds.add(t.id);
          });

          const formattedTasks = tasksData.tasks.map((t) => {
             const frontendTaskId = `task-${selectedAssignmentId}-${t.id}`;
             return {
                 id: frontendTaskId, 
                 label: t.title, 
                 estTime: t.estimated_minutes ? `${t.estimated_minutes}m` : '15m',
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
  }, [courseId, selectedAssignmentId]);

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // --- HANDLERS ---
  const handleDragStart = (e, task) => {
    draggedTaskRef.current = { 
      ...task, color: localAssignment?.color || '#3b82f6', course: localAssignment?.course || 'Canvas' 
    };
  };

  const handleDropOnCalendar = (e, dateStr) => {
    e.preventDefault(); e.stopPropagation(); 
    const task = draggedTaskRef.current;
    if (task) {
      setScheduledTasks(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => { newState[key] = newState[key].filter(t => t.id !== task.id); });
        const currentDayTasks = newState[dateStr] || [];
        newState[dateStr] = [...currentDayTasks, task];
        return newState;
      });
    }
    draggedTaskRef.current = null;
  };

  const removeTaskFromDay = (dateStr, taskId) => {
    setScheduledTasks(prev => ({ ...prev, [dateStr]: prev[dateStr].filter(t => t.id !== taskId) }));
  };

  const handleClearDay = (dateStr) => {
    setScheduledTasks(prev => { const newState = { ...prev }; delete newState[dateStr]; return newState; });
  };

  const toggleTask = (_, taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    setScheduledTasks(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(dateStr => {
        newState[dateStr] = newState[dateStr].map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
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

  if (isLoading && !localAssignment) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Analyzing assignment...</Typography>
      </Box>
    );
  }

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
        <TabSwitcher variant="assignment" activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'tasks' && (
        <>
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

            <WeeklyCalendar variant="detail" scheduledTasks={scheduledTasks} onDropTask={handleDropOnCalendar} onRemoveTask={removeTaskFromDay} onClearDay={handleClearDay} onToggleTask={toggleTask} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
             <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a' }}>Task Breakdown</Typography>
             <Box sx={{ display: 'flex', gap: 1 }}>
                 <Button onClick={handleAutoSchedule} sx={{ background: '#000', color: '#fff', textTransform: 'none', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '6px', '&:hover': { background: '#333' } }}>
                   <Sparkles size={12} style={{ marginRight: '4px' }} /> Auto
                 </Button>
                 <Button startIcon={<RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />} onClick={() => fetchAssignmentData(true)} disabled={isRegenerating} size="small" sx={{ textTransform: 'none', fontSize: '12px', color: '#6b7280' }}>
                   {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                 </Button>
             </Box>
          </Box>
          
          <div className="space-y-3">
            {tasks.length === 0 && !isRegenerating && !isLoading ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No tasks found. Click 'Regenerate' to create a plan.
                </Typography>
            ) : (
              tasks.map((task) => {
              const isExpanded = expandedTasks.includes(task.id);
              return (
                <Card key={task.id} draggable={true} onDragStart={(e) => handleDragStart(e, task)} sx={{ borderRadius: '12px', cursor: 'pointer', boxShadow: 'none', border: '1px solid #e5e7eb', bgcolor: task.completed ? '#f9fafb' : 'white', transition: 'all 0.2s', '&:hover': { borderColor: localAssignment?.color || '#3b82f6' } }} onClick={() => toggleTaskExpansion(task.id)}>
                  <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <div onClick={(e) => { e.stopPropagation(); toggleTask(null, task.id); }} className="cursor-pointer mt-1">
                        {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-gray-300" />}
                      </div>
                      <Box sx={{ flexGrow: 1 }}>
                        <div className="flex items-center justify-between">
                          <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: '#1f2937' }}>{task.label}</Typography>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{task.estTime}</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </div>
                        <Collapse in={isExpanded}>
                          <Box sx={{ pt: 1.5 }}>
                            {task.description && <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#4b5563', fontSize: '12px', lineHeight: 1.5 }}>{task.description}</Typography>}
                            {task.aiSummary && !task.completed && (
                              <Box sx={{ p: 1.5, borderRadius: '8px', background: 'linear-gradient(135deg, #f5f3ff 0%, #f0f7ff 100%)', border: '1px solid #e0e7ff' }}>
                                <div className="flex items-center gap-1.5 mb-1"><Sparkles size={12} className="text-indigo-500" /><Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#6366f1' }}>PRO TIP</Typography></div>
                                <Typography variant="caption" sx={{ color: '#4338ca', fontSize: '11px', lineHeight: 1.4, display: 'block' }}>{task.aiSummary}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                  </CardContent>
                </Card>
              );
            }))}
          </div>
        </>
      )}
      {activeTab === 'timer' && <TimerPanel />}
      {activeTab === 'stats' && <StatsPanel />}
    </Box>
  );
}