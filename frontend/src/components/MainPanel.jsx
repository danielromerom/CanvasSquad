import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import {Timer, BarChart3, ChevronLeft, ChevronRight, Sparkles, ChevronDown, ChevronRight as ChevronRightIcon, GripVertical, CheckCircle2, Circle, X} from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import { API_BASE_URL, FETCH_HEADERS } from '../../config.js';
import WeeklyCalendar from './WeeklyCalendar';
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
  
  const phi = 0.618033988749895;
  const index = Math.floor((numId * phi % 1) * COURSE_COLORS.length);
  
  return COURSE_COLORS[index];
};

export default function MainPanel() {
  const [currentTab, setCurrentTab] = useState('schedule');

  const [assignmentStartDate, setAssignmentStartDate] = useState(new Date());
  const [assignmentTimeframe, setAssignmentTimeframe] = useState(7);

  const [allRawAssignments, setAllRawAssignments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);

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
    const fetchInitial = async () => {
      setIsInitialLoading(true);
      try {
        const coursesResponse = await fetch(`${API_BASE_URL}/api/canvas/courses/`, { headers: FETCH_HEADERS });
        const coursesData = await coursesResponse.json();
        const courseList = coursesData.courses || [];

        const syncPromises = courseList.map(course => 
            fetch(`${API_BASE_URL}/api/canvas/courses/${course.id}/sync/`, { 
                method: 'POST', 
                headers: FETCH_HEADERS 
            })
        );
        await Promise.all(syncPromises);

        // fetch all assignments for all courses
        const assignmentPromises = courseList.map(async (course) => {
          const res = await fetch(`${API_BASE_URL}/api/canvas/courses/${course.id}/assignments/`, { headers: FETCH_HEADERS });
          if (!res.ok) return [];
          const data = await res.json();
          
          return data.assignments.map(a => ({
            ...a,
            course_name: course.name || course.course_code,
            course_id: course.id
          }));
        });

        const nestedAssignments = await Promise.all(assignmentPromises);
        setAllRawAssignments(nestedAssignments.flat());

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    const filterAndHydrate = async () => {
      if (isInitialLoading) return;
      setIsAssignmentsLoading(true);

      // date boundaries based on state
      const start = new Date(assignmentStartDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + assignmentTimeframe - 1);
      end.setHours(23, 59, 59, 999);

      // filter within the timeframe
      const filtered = allRawAssignments.filter(assign => {
        if (!assign.due_at) return false;
        const dueDate = new Date(assign.due_at);
        return dueDate >= start && dueDate <= end;
      });

      // sort by due date ascending
      filtered.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

      const locallyCompletedIds = new Set();
      Object.values(scheduledTasks).flat().forEach(t => {
          if (t.completed) locallyCompletedIds.add(t.id);
      });

      const hydrated = await Promise.all(filtered.map(async (assign) => {
          let tasks = [];
          const taskIdToUse = assign.canvas_assignment_id || assign.id; 

          try {
              const taskRes = await fetch(`${API_BASE_URL}/api/canvas/assignments/${taskIdToUse}/tasks/`, { headers: FETCH_HEADERS });
              if (taskRes.ok) {
                  const taskData = await taskRes.json();
                  tasks = taskData.tasks || [];
              }
          } catch (err) {
              console.warn(`Could not fetch tasks for assignment ${assign.id}`, err);
          }

          return {
              id: `assign-${assign.course_id}-${assign.id}`,
              course: assign.course_name,
              canvas_assignment_id: assign.canvas_assignment_id,
              canvas_course_id: assign.course_id,
              title: assign.title,
              color: getCourseColor(assign.course_id),
              raw_due_at: assign.due_at,
              due: new Date(assign.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' }),
              tasks: tasks.map((t) => {
                  const frontendTaskId = `task-${taskIdToUse}-${t.id}`;
                  return {
                      id: frontendTaskId,
                      label: t.title,
                      time: t.estimated_minutes ? `${t.estimated_minutes}m` : '15m', 

                      completed: t.is_completed || locallyCompletedIds.has(frontendTaskId)
                  };
              })
          };
      }));

      setAssignments(hydrated);
      setIsAssignmentsLoading(false);
    };

    filterAndHydrate();
  }, [allRawAssignments, assignmentStartDate, assignmentTimeframe, isInitialLoading]);

  // assignment date navigation handlers
  const moveAssignmentDate = (direction) => {
    const newDate = new Date(assignmentStartDate);
    newDate.setDate(newDate.getDate() + (direction * assignmentTimeframe));
    setAssignmentStartDate(newDate);
  };

  const resetAssignmentDate = () => {
    setAssignmentStartDate(new Date());
  };

  const assignmentEndText = useMemo(() => {
    const end = new Date(assignmentStartDate);
    end.setDate(end.getDate() + assignmentTimeframe - 1);
    return end;
  }, [assignmentStartDate, assignmentTimeframe]);

  const dateRangeText = `${assignmentStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${assignmentEndText.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  
  // handler for accordion assignment
  const toggleAccordion = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openAssignmentLink = (assign) => {
      const cID = assign.canvas_course_id;
      const aID = assign.canvas_assignment_id;
      window.open(`https://ufldev.instructure.com/courses/${cID}/assignments/${aID}`, '_blank');
  };

  const toggleAssignmentTask = (_, taskId) => {
    
    setAssignments(prevAssignments => {
      return prevAssignments.map(assign => ({
        ...assign,
        tasks: assign.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed }; 
          }
          return t;
        })
      }));
    });

    setScheduledTasks(prevSchedule => {
      const newState = { ...prevSchedule };
      
      let isTaskCurrentlyCompleted = false;
      for (const date of Object.values(prevSchedule)) {
        const found = date.find(task => task.id === taskId);
        if (found) {
          isTaskCurrentlyCompleted = found.completed;
          break;
        }
      }
      if (!isTaskCurrentlyCompleted) {
        for (const assign of assignments) {
          const foundInList = assign.tasks.find(t => t.id === taskId);
          if (foundInList) {
              isTaskCurrentlyCompleted = foundInList.completed;
              break;
          }
        }
      }

      const exactNewState = !isTaskCurrentlyCompleted;

      Object.keys(newState).forEach(dateStr => {
        newState[dateStr] = newState[dateStr].map(t => {
          if (t.id === taskId) {
            return { ...t, completed: exactNewState };
          }
          return t;
        });
      });
      
      return newState;
    });
  };
  
  // drag and drop
  const handleDragStart = (e, task, courseColor) => {
    draggedTaskRef.current = { ...task, color: courseColor, completed: false };
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ ...task, color: courseColor }));
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

  const handleDragEnd = () => {
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

  const handleAutoSchedule = () => {
    const alreadyScheduledIds = new Set();
    Object.values(scheduledTasks).flat().forEach(t => alreadyScheduledIds.add(t.id));

    const newSchedule = { ...scheduledTasks };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tasksScheduled = 0;

    // Process tasks grouped BY ASSIGNMENT so we preserve chronological order
    assignments.forEach(assign => {
      // Get strictly the unscheduled tasks for THIS assignment
      const pendingTasks = assign.tasks.filter(task => !task.completed && !alreadyScheduledIds.has(task.id));
      if (pendingTasks.length === 0) return;

      // Determine valid days: From Today until the day BEFORE it's due
      const validDays = [];
      let currentDate = new Date(today);
      const dueDate = new Date(assign.raw_due_at);
      dueDate.setHours(0, 0, 0, 0);

      // If it's due today or overdue, all tasks must be scheduled today
      if (dueDate <= today) {
          validDays.push(new Date(today));
      } else {
          // Otherwise, collect every day from today until the deadline
          while (currentDate < dueDate) {
              validDays.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
          }
      }

      // Distribute tasks chronologically across the available days
      pendingTasks.forEach((task, index) => {
        // Math magic to evenly space steps. 
        // e.g., 4 tasks over 3 days maps to: Day 1, Day 1, Day 2, Day 3
        const dayIndex = Math.floor((index / pendingTasks.length) * validDays.length);
        const scheduledDay = validDays[dayIndex];
        const dateStr = scheduledDay.toDateString();

        if (!newSchedule[dateStr]) newSchedule[dateStr] = [];
        newSchedule[dateStr].push({
          ...task,
          color: assign.color
        });
        
        tasksScheduled++;
      });
    });

    if (tasksScheduled === 0) {
      alert("All active tasks are already scheduled!");
    } else {
      setScheduledTasks(newSchedule);
    }
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
            <WeeklyCalendar 
              scheduledTasks={scheduledTasks}
              onDropTask={handleDropOnCalendar}
              onRemoveTask={removeTaskFromDay}
              onToggleTask={toggleAssignmentTask}
              onClearDay={handleClearDay}
            />

            <Box sx={{ mb: 2 }}>
                
              {/* Header Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                
                {/* Title and Date Grouped Together */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="#1f2937" sx={{ lineHeight: 1 }}>
                    Assignments
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#9ca3af', lineHeight: 1 }}>
                    {dateRangeText}
                  </Typography>
                </Box>

                <button 
                onClick={handleAutoSchedule}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Sparkles size={12} /> Auto
                </button>
              </Box>

              {/* Date Range Text */}
              

              {/* Navigation Bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  
                {/* Timeframe Dropdown */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <select 
                     value={assignmentTimeframe} 
                     onChange={(e) => setAssignmentTimeframe(Number(e.target.value))}
                     style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 6px', fontSize: '12px', background: 'white', color: '#374151', cursor: 'pointer', outline: 'none', fontWeight: 500 }}
                  >
                     <option value={3}>Next 3 Days</option>
                     <option value={7}>Next 7 Days</option>
                     <option value={14}>Next 14 Days</option>
                     <option value={30}>Next 30 Days</option>
                  </select>
                </Box>

                {/* Arrows */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton onClick={() => moveAssignmentDate(-1)} size="small" sx={{ p: 0.5, bgcolor: 'white', border: '1px solid #e5e7eb' }}><ChevronLeft size={16} /></IconButton>
                  <button 
                      onClick={resetAssignmentDate} 
                      style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                      Today
                  </button>
                  <IconButton onClick={() => moveAssignmentDate(1)} size="small" sx={{ p: 0.5, bgcolor: 'white', border: '1px solid #e5e7eb' }}><ChevronRight size={16} /></IconButton>
                </Box>
              </Box>

            </Box>


            {isInitialLoading || isAssignmentsLoading ? (
               <Box sx={{ textAlign: 'center', py: 4 }}>
                 <Typography variant="body2" color="text.secondary">Loading your assignments...</Typography>
               </Box>
            ) : assignments.length === 0 ? (
               <Box sx={{ textAlign: 'center', py: 4 }}>
                 <Typography variant="body2" color="text.secondary">No assignments due in this timeframe! 🎉</Typography>
               </Box>
            ) : (
              assignments.map((assignment) => {
                  const isExpanded = expandedIds.includes(assignment.id);
                  const totalSubtasks = assignment.tasks.length;
                  const hasTasks = totalSubtasks > 0;

                  let scheduledCount = 0;
                  Object.values(scheduledTasks).flat().forEach(t => { if (assignment.tasks.some(at => at.id === t.id)) scheduledCount++; });

                  return (
                    <div key={assignment.id} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
                      
                      {/* Accordion Header */}
                      <div 
                        onClick={() => hasTasks ? toggleAccordion(assignment.id) : null}
                        style={{ padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}
                      >
                        <div style={{ width: '4px', height: '40px', backgroundColor: assignment.color, borderRadius: '4px', flexShrink: 0}} />
                        
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
                              onClick={(e) => { e.stopPropagation(); openAssignmentLink(assignment); }}
                            >
                              {assignment.title}
                            </h4>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{assignment.course}</p>
                            </div>
                            <div style={{ color: '#9ca3af' }}>
                              {hasTasks ? (
                                  isExpanded ? <ChevronDown size={18} /> : <ChevronRightIcon size={18} />
                              ) : (
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); openAssignmentLink(assignment); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}
                                  >
                                    <Sparkles size={12} />
                                    <span>Generate Plan</span>
                                  </div>
                              )}                            </div>
                          </div>
                          <div style={{ marginTop: '4px', display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                            <span>Due: {assignment.due}</span>
                            {hasTasks && (
                                <span style={{ color: scheduledCount === totalSubtasks ? '#16a34a' : '#9ca3af' }}>
                                    {scheduledCount}/{totalSubtasks} scheduled
                                </span>
                            )}
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