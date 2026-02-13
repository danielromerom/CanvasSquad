import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, IconButton, CircularProgress, Collapse } from '@mui/material';
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle, X, Sparkles, ChevronUp } from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import TimerPanel from './TimerPanel';
import { API_BASE_URL, FETCH_HEADERS } from '../../config.js';


// --- HELPERS ---
const getWeekDates = (baseDate) => {
  const dates = [];
  const current = new Date(baseDate);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(current.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

export default function AssignmentDetailView({ initialAssignment }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [localAssignment, setLocalAssignment] = useState(initialAssignment || null);

  const [expandedTasks, setExpandedTasks] = useState([]);

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

  useEffect(() => {
    const fetchSubtasks = async () => {
      if (!courseId || !assignmentId) return;

      const cacheKey = `tasks_cache_${assignmentId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData && localAssignment) {
        setTasks(JSON.parse(cachedData));
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/canvas/courses/${courseId}/assignments/`, { 
          headers: FETCH_HEADERS 
        });
        const data = await res.json();
        
        const backendAssign = data.tasks.assignments.find(a => String(a.id) === String(assignmentId));
        
        if (backendAssign) {
          setLocalAssignment({
            id: String(backendAssign.id),
            title: backendAssign.title,
            course: data.course_name || `Course ${courseId}`,
            color: '#3b82f6',
            due: backendAssign.due_at ? new Date(backendAssign.due_at).toLocaleDateString() : 'No Date'
          });

          const formattedTasks = backendAssign.tasks.map((t, i) => ({
            id: `task-${assignmentId}-${i}`, 
            label: t.label,
            estTime: `${Math.round(t.estimated_time_hours * 60)}m`,
            completed: false,
            aiSummary: t.ai_insight || null,
            description: t.description || null,
          }));

          setTasks(formattedTasks);
          localStorage.setItem(cacheKey, JSON.stringify(formattedTasks));
        }
      } catch (err) {
        console.error("Fetch subtasks error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubtasks();
  }, [courseId, assignmentId]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const draggedTaskRef = useRef(null);

  // --- HANDLERS ---
  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const handleDragStart = (e, task) => {
    draggedTaskRef.current = { 
      ...task, 
      color: localAssignment?.color || '#3b82f6', 
      course: localAssignment?.course || 'Canvas' 
    };
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const task = draggedTaskRef.current;
    if (task) {
      setScheduledTasks(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(day => {
          newState[day] = newState[day].filter(t => t.id !== task.id);
        });
        const currentDayTasks = newState[dateStr] || [];
        newState[dateStr] = [...currentDayTasks, task];
        return newState;
      });
    }
  };

  const removeTaskFromDay = (dateStr, taskId) => {
    setScheduledTasks(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].filter(t => t.id !== taskId)
    }));
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

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
      
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="#111827">Assignment Details</Typography>
      </Box>

      <div className="mb-4">
        <TabSwitcher variant="assignment" activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'tasks' && (
        <>
            {/* Assignment Card */}
            <div className="p-6 mb-6 shadow-md rounded-2xl text-white transition-all hover:shadow-lg" 
                style={{ background: `linear-gradient(135deg, ${localAssignment?.color || '#3b82f6'} 0%, #2563eb 100%)` }}>
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
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="#374151">Schedule Tasks</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => changeWeek(-1)} size="small" sx={{ p: 0.5 }}><ChevronLeft size={16}/></IconButton>
                  <IconButton onClick={() => changeWeek(1)} size="small" sx={{ p: 0.5 }}><ChevronRight size={16}/></IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, height: '120px' }}>
                {weekDates.map((date) => {
                  const dateStr = date.toDateString();
                  const dayTasks = scheduledTasks[dateStr] || [];
                  const isTodayDate = isToday(date);
                  return (
                    <Box 
                      key={dateStr}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      sx={{
                        flex: 1, minWidth: 0, transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, pb: 1, borderRadius: '12px',
                        border: isTodayDate ? '1px solid #c7d2fe' : '1px solid #e5e7eb', backgroundColor: isTodayDate ? '#eef2ff' : '#fff', overflow: 'hidden', cursor: 'default',
                        '&:hover': { flex: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                      }}
                    >
                      <Typography variant="caption" sx={{ pointerEvents: 'none', fontWeight: 'bold', textTransform: 'uppercase', color: isTodayDate ? '#4f46e5' : '#9ca3af', fontSize: '9px' }}>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</Typography>
                      <Typography variant="body2" sx={{ pointerEvents: 'none', fontWeight: 'bold', mb: 1, color: isTodayDate ? '#4338ca' : '#374151', fontSize: '12px' }}>{date.getDate()}</Typography>
                      <Box sx={{ width: '100%', px: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>
                        {dayTasks.map((t, idx) => (
                          <Box 
                            key={`${t.id}-${idx}`} 
                            className="group"
                            sx={{ 
                              bgcolor: 'white', border: '1px solid #f3f4f6', borderRadius: '4px', p: 0.5, 
                              borderLeft: `3px solid ${t.color || '#3b82f6'}`, fontSize: '9px', fontWeight: 500, 
                              color: '#374151', position: 'relative', display: 'flex', alignItems: 'center', 
                              justifyContent: 'space-between', mb: 0.5 
                            }}
                          >
                            <span className="truncate" style={{ flex: 1 }}>{t.label}</span>
                            
                            <Box 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                removeTaskFromDay(dateStr, t.id); 
                              }} 
                              sx={{ 
                                display: 'none',
                                cursor: 'pointer',
                                ml: 0.5,
                                color: '#9ca3af',
                                '&:hover': { color: '#ef4444' },
                                '.group:hover &': { display: 'flex' }
                              }}
                            >
                              <X size={10} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>

          {/* DYNAMIC TASKS LIST */}
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 2 }}>Task Breakdown</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
              const isExpanded = expandedTasks.includes(task.id);
              
              return (
                <Card 
                  key={task.id} 
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, task)} 
                  sx={{ 
                    borderRadius: '12px', cursor: 'pointer', boxShadow: 'none', border: '1px solid #e5e7eb',
                    bgcolor: task.completed ? '#f9fafb' : 'white',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: localAssignment?.color || '#3b82f6' }
                  }}
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      
                      {/* Checkbox */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTasks(tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t));
                        }} 
                        className="cursor-pointer mt-1"
                      >
                        {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-gray-300" />}
                      </div>

                      <Box sx={{ flexGrow: 1 }}>
                        
                        {/* Header Row: Label + Chevron */}
                        <div className="flex items-center justify-between">
                          <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: '#1f2937' }}>
                            {task.label}
                          </Typography>
                          
                          <div className="flex items-center gap-2">
                             <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                {task.estTime}
                             </span>
                             {/* Chevron rotates based on expanded state */}
                             {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ pt: 1.5 }}>
                            {/* DESCRIPTION */}
                            {task.description && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#4b5563', fontSize: '12px', lineHeight: 1.5 }}>
                                {task.description}
                              </Typography>
                            )}

                            {/* AI INSIGHT */}
                            {task.aiSummary && !task.completed && (
                              <Box sx={{ p: 1.5, borderRadius: '8px', background: 'linear-gradient(135deg, #f5f3ff 0%, #f0f7ff 100%)', border: '1px solid #e0e7ff' }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Sparkles size={12} className="text-indigo-500" />
                                  <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.5px' }}>PRO TIP</Typography>
                                </div>
                                <Typography variant="caption" sx={{ color: '#4338ca', fontSize: '11px', lineHeight: 1.4, display: 'block' }}>
                                  {task.aiSummary}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>

                      </Box>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </>
      )}
      {activeTab === 'timer' && <TimerPanel />}
    </Box>
  );
}