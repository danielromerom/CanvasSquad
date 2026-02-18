import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import {Timer, BarChart3, ChevronLeft, ChevronRight, Sparkles, ChevronDown, ChevronRight as ChevronRightIcon, GripVertical, CheckCircle2, Circle, X} from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import { API_BASE_URL, FETCH_HEADERS } from '../../config.js';
import TimerPanel from './TimerPanel.jsx';
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
  return COURSE_COLORS[numId % COURSE_COLORS.length];
};

export default function MainPanel() {
  const [currentTab, setCurrentTab] = useState('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [expandedIds, setExpandedIds] = useState([]); 
  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const saved = localStorage.getItem('scheduledTasks');
    return saved ? JSON.parse(saved) : {};
  });

  const draggedTaskRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        
        const coursesResponse = await fetch(`${API_BASE_URL}/api/canvas/courses/`, { headers: FETCH_HEADERS}); 
        const coursesData = await coursesResponse.json();

        const courseList = coursesData.courses || [];

        // fetch Assignments for each course in parallel
        const promises = courseList.map(course => 
          fetch(`${API_BASE_URL}/api/canvas/courses/${course.id}/assignments/`, { headers: FETCH_HEADERS })
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(assignmentData => {
                if (assignmentData) {
                    assignmentData.course_name = course.course_code || course.name; 
                }
                return assignmentData;
            })
        );

        const results = await Promise.all(promises);

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const allAssignments = results
          .filter(data => data !== null)
          .flatMap(data => {
            const courseId = data.course_id;
            const backendAssignments = data.tasks.assignments;
            const courseName = data.course_name;

            // Filter individual assignments b4 mapping
            const filteredBackend = backendAssignments.filter(assign => {
                if (!assign.due_at) return false;
                const dueDate = new Date(assign.due_at);

                return dueDate >= now && dueDate <= nextWeek;
            });

            // Map to UI structure
            return filteredBackend.map((assign, index) => ({
              id: `assign-${courseId}-${index}`,
              course: `${courseName}`,

              canvas_assignment_id: assign.id,
              canvas_course_id: courseId,

              title: assign.title,
              color: getCourseColor(courseId),

              due: new Date(assign.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' }),
              priority: assign.priority,
              tasks: assign.tasks.map((t, tIndex) => ({
                id: `task-${courseId}-${index}-${tIndex}`,
                label: t.description,
                time: `${t.estimated_time_hours}h`,
                completed: false
              }))
            }));
          });

        setAssignments(allAssignments);
        setIsLoading(false);

      } catch (error) {
        console.error("Failed to fetch assignments:", error);
        setIsLoading(false);
      }
    };

    fetchAllData();
    }, []);

  // date utilities
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

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // handler for accordion assignment
  const toggleAccordion = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAssignmentTask = (assignmentId, taskId) => {
    setAssignments(prev => prev.map(assign => {
      if (assign.id !== assignmentId) return assign;
      return {
        ...assign,
        tasks: assign.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    }));
  };
  
  // drag and drop
  const handleDragStart = (e, task, courseColor) => {
    draggedTaskRef.current = { ...task, color: courseColor, completed: false };
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ ...task, color: courseColor }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, dateStr) => {
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

  const handleDragEnd = () => {
    draggedTaskRef.current = null;
  };

  const removeTaskFromDay = (dateStr, taskId) => {
    setScheduledTasks(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].filter(t => t.id !== taskId)
    }));
  };
  
  return (
    <Box sx={{ pt: 2, pb: 4, pl: 1.5, pr: 1.5, maxWidth: '640px', mx: 'auto' }}>
      

      {/* tab switch */}
      <div className="mb-6 px-2">
        <TabSwitcher 
          variant="main" 
          activeTab={currentTab} 
          onTabChange={setCurrentTab} 
        />
      </div>

      <Box sx={{ px: 1 }}>
        
        {currentTab === 'schedule' && (
          <>
            {/* week nav. */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="#111827">
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => changeWeek(-1)} size="small"><ChevronLeft size={20} /></IconButton>
                <button 
                    onClick={() => setCurrentDate(new Date())} 
                    style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                    Today
                </button>
                <IconButton onClick={() => changeWeek(1)} size="small"><ChevronRight size={20} /></IconButton>
              </Box>
            </Box>

            {/* calendar grid */}
            <Box sx={{ 
                display: 'flex', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 1, 
                mb: 4 
            }}>
              {weekDates.map((date) => {
                const dateStr = date.toDateString();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                const tasksForDay = scheduledTasks[dateStr] || [];
                const isTodayDate = isToday(date);

                return (
                  <Box 
                    key={dateStr}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pt: 1.5,
                      pb: 1,
                      borderRadius: '12px',
                      border: isTodayDate ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                      backgroundColor: isTodayDate ? '#eef2ff' : '#fff',
                      minHeight: '120px',
                      overflow: 'hidden',
                      flex: 1, 
                      minWidth: 0,
                      transition: 'flex 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s', 
                      cursor: 'default',
                      '&:hover': {
                        flex: 6,
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ pointerEvents: 'none', fontWeight: 'bold', textTransform: 'uppercase', color: isTodayDate ? '#4f46e5' : '#9ca3af', fontSize: '10px' }}>
                      {dayName}
                    </Typography>
                    <Typography variant="body2" sx={{ pointerEvents: 'none', fontWeight: 'bold', mb: 1, color: isTodayDate ? '#4338ca' : '#374151' }}>
                      {dayNum}
                    </Typography>

                    {/* Dropped Tasks */}
                    <Box sx={{
                        width: '100%',
                        px: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        flexGrow: 1, 
                        overflowY: 'auto',
                        minHeight: 0,
                        '::-webkit-scrollbar': { display: 'none' } 
                    }}>
                      {tasksForDay.map((task) => (
                        <Box 
                          key={task.id}
                          className="group" // Enables hover effects for child
                          onClick={(e) => {
                            e.stopPropagation(); 
                          }}
                          sx={{
                              bgcolor: 'white',
                              border: '1px solid #f3f4f6',
                              borderRadius: '4px',
                              borderColor: task.completed ? '#e5ebe5' : '#f3f4f6',
                              p: 0.5,
                              cursor: 'pointer',
                              borderLeft: `3px solid ${task.color}`,
                              fontSize: '9px',
                              fontWeight: 500,
                              color: task.completed ? '#9ca3af' : '#374151',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              opacity: task.completed ? 0.7 : 1,
                              textDecoration: task.completed ? 'line-through' : 'none',
                              '&:hover .remove-btn': { display: 'flex' }
                          }}
                        >
                          
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.label}
                          </span>

                          <Box 
                            className="remove-btn" 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                removeTaskFromDay(dateStr, task.id);
                            }}
                            sx={{
                               display: 'none',
                               position: 'absolute',
                               right: 2,
                               top: '50%',
                               transform: 'translateY(-50%)',
                               bgcolor: '#fff',
                               borderRadius: '50%',
                               p: 0.5,
                               boxShadow: 1
                            }}
                          >
                            <X size={10} color="#ef4444" />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Assignments */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#1f2937">Assignments</Typography>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Sparkles size={12} /> Auto
              </button>
            </Box>

            {isLoading ? (
               <Box sx={{ textAlign: 'center', py: 4 }}>
                 <Typography variant="body2" color="text.secondary">Loading your assignments...</Typography>
               </Box>
            ) : assignments.length === 0 ? (
               <Box sx={{ textAlign: 'center', py: 4 }}>
                 <Typography variant="body2" color="text.secondary">No assignments due in the next 7 days! 🎉</Typography>
               </Box>
            ) : (
              assignments.map((assignment) => {
                  const isExpanded = expandedIds.includes(assignment.id);
                  const totalSubtasks = assignment.tasks.length;
                  let scheduledCount = 0;
                  Object.values(scheduledTasks).flat().forEach(t => { if (assignment.tasks.some(at => at.id === t.id)) scheduledCount++; });

                  return (
                    <div key={assignment.id} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
                      
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleAccordion(assignment.id)}
                        style={{ padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}
                      >
                        <div style={{ width: '4px', height: '40px', backgroundColor: assignment.color, borderRadius: '4px' }} />
                        
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                          <h4 
                              style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: '#111827',
                                cursor: 'pointer',
                                transition: 'text-decoration 0.2s'
                              }}
                              className="hover:underline"
                              onClick={(e) => {
                                e.stopPropagation(); 

                                const cID = assignment.canvas_course_id;
                                const aID = assignment.canvas_assignment_id;

                                window.open(`https://ufldev.instructure.com/courses/${cID}/assignments/${aID}`, '_blank');
                              }}
                            >
                              {assignment.title}
                            </h4>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{assignment.course}</p>
                            </div>
                            <div style={{ color: '#9ca3af' }}>
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRightIcon size={18} />}
                            </div>
                          </div>
                          <div style={{ marginTop: '4px', display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                            <span>Due: {assignment.due}</span>
                            <span style={{ color: scheduledCount === totalSubtasks ? '#16a34a' : '#9ca3af' }}>
                              {scheduledCount}/{totalSubtasks} scheduled
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      <Collapse in={isExpanded}>
                        <div style={{ background: '#f9fafb', padding: '8px', borderTop: '1px solid #f3f4f6' }}>
                          {assignment.tasks.map((task) => (
                            <Box 
                              key={task.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, task, assignment.color)}
                              onDragEnd={handleDragEnd}
                              sx={{ 
                                  bgcolor: 'white', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px', 
                                  p: 1, 
                                  mb: 1, 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  cursor: 'grab', 
                                  userSelect: 'none',
                                  transition: 'border-color 0.2s',
                                  '&:hover': { borderColor: '#a5b4fc' },
                                  '&:hover .grip-icon': { color: '#6b7280' }
                              }}
                            >
                              {/* Left Side: Checkbox + Text */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                
                                {/* CHECKBOX: Click to toggle */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Stop drag from starting
                                    toggleAssignmentTask(assignment.id, task.id);
                                  }}
                                  style={{ cursor: 'pointer', display: 'flex' }}
                                >
                                  {task.completed ? 
                                    <CheckCircle2 size={18} color="#10b981" /> : 
                                    <Circle size={18} color="#d1d5db" />
                                  }
                                </div>

                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none' }}>
                                  {task.label}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                  {task.time}
                                </span>
                                <GripVertical size={14} className="grip-icon" color="#d1d5db" />
                              </div>
                            </Box>
                          ))}
                        </div>
                      </Collapse>
                    </div>
                  );
                })
              )}
            </>
        )}

        {/* Placeholders for other tabs */}
        {currentTab === 'timer' && (
          <TimerPanel />
        )}

        {currentTab === 'stats' && (
          <Box sx={{ textAlign: 'center', p: 5, border: '2px dashed #e5e7eb', borderRadius: 4, mt: 4, bgcolor: 'white' }}>
            <BarChart3 className="mx-auto" size={40} color="#d1d5db" />
            <Typography color="#9ca3af" fontWeight={500}>Stats Coming Soon</Typography>
          </Box>
        )}

      </Box>
    </Box>
  );
}