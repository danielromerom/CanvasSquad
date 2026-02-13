import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle, X, Sparkles } from 'lucide-react';
import TabSwitcher from './TabSwitcher';
import TimerPanel from './TimerPanel';

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

const DUMMY_ASSIGNMENT = {
  id: "math-221-pset-5",
  course: "MATH 221",
  title: "Linear Algebra Problem Set 5",
  courseColor: "#4D88FF", 
  dueDate: "Feb 2",
};

export default function AssignmentDetailView({ assignment = DUMMY_ASSIGNMENT }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- FORM STATE ---
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState(30);

  // --- DATA STATE ---
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [tasks, setTasks] = useState([
    { 
        id: 't1', 
        label: "Review eigenvalue concepts", 
        estTime: "30m", 
        completed: false, 
        description: "Go through Chapter 6 notes and review definitions.",
        aiSummary: "Key Concept: The characteristic equation $\\det(A - \\lambda I) = 0$. Ensure you understand why eigenvalues are the roots of this polynomial."
    },
    { 
        id: 't2', 
        label: "Solve problems 1-5", 
        estTime: "60m", 
        completed: false, 
        description: "Focus on application of power method.",
        aiSummary: "Pro-tip: The Power Method finds the dominant eigenvalue. Watch out for cases where the initial vector is orthogonal to the dominant eigenvector!"
    },
    { 
        id: 't3', 
        label: "Solve problems 6-10", 
        estTime: "60m", 
        completed: false,
        aiSummary: "Focus on Diagonalization. A matrix is diagonalizable if and only if it has $n$ linearly independent eigenvectors." 
    },
    { 
        id: 't4', 
        label: "Check answers with key", 
        estTime: "15m", 
        completed: false 
    },
  ]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // --- HANDLERS ---
  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `t-${Date.now()}`,
      label: newTaskTitle,
      estTime: `${newTaskDuration}m`,
      completed: false,
      description: newTaskDescription,
      // Placeholder for AI generation logic
      aiSummary: "AI is analyzing this task to provide learning insights..." 
    };

    setTasks([...tasks, newTask]);
    
    // Reset and Close
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskDuration(30);
    setShowAddTaskForm(false);
  };

  // --- DRAG AND DROP ---
  const draggedTaskRef = useRef(null);

  const handleDragStart = (e, task) => {
    const data = { ...task, color: assignment.courseColor, course: assignment.course };
    draggedTaskRef.current = data;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify(data));
  };

  const handleDrop = (e, dateKey) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    
    const task = JSON.parse(dataStr);
    
    setWeeklySchedule(prev => {
        const currentTasks = prev[dateKey] || [];
        if (currentTasks.find(t => t.id === task.id)) return prev;
        return { ...prev, [dateKey]: [...currentTasks, task] };
    });
    draggedTaskRef.current = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleRemoveTask = (dateKey, taskId) => {
      setWeeklySchedule(prev => ({
          ...prev,
          [dateKey]: prev[dateKey].filter(t => t.id !== taskId)
      }));
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pt: 1, pb: 8, pl: 2, pr: 2, maxWidth: '640px', mx: 'auto', bgcolor: '#fbfbfb' }}>
      
      {/* Header Dropdown */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Select Assignment</Typography>
        <div className="relative mt-1">
          <select 
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
            defaultValue={assignment.title}
          >
            <option>{assignment.title}</option>
            <option>History Essay Final Draft</option>
          </select>
          <ChevronDown className="absolute right-3 top-3.5 pointer-events-none text-gray-500" size={16} />
        </div>
      </Box>

      {/* Tab Switcher */}
      <div className="mb-4">
        <TabSwitcher variant="assignment" activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'tasks' && (
        <>
            {/* Assignment Card */}
            <div className="p-6 mb-6 shadow-md rounded-2xl text-white transition-all hover:shadow-lg" 
                style={{ background: `linear-gradient(135deg, ${assignment.courseColor} 0%, #2563eb 100%)` }}>
              <p className="text-[10px] opacity-80 mb-1 uppercase tracking-widest font-bold">{assignment.course}</p>
              <h2 className="text-2xl font-bold mb-4">{assignment.title}</h2>
              <div className="flex justify-between text-sm font-medium opacity-90 mb-2">
                  <span>Due: {assignment.dueDate}</span>
                  <span>{completedCount}/{tasks.length} Complete</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-1.5">
                  <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* CALENDAR */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="#374151">Schedule Tasks</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => changeWeek(-1)} size="small" sx={{ p: 0.5 }}><ChevronLeft size={16}/></IconButton>
                  <button onClick={() => setCurrentDate(new Date())} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>Today</button>
                  <IconButton onClick={() => changeWeek(1)} size="small" sx={{ p: 0.5 }}><ChevronRight size={16}/></IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, height: '120px' }}>
                {weekDates.map((date) => {
                  const dateStr = date.toDateString();
                  const dayTasks = weeklySchedule[dateStr] || [];
                  const isTodayDate = isToday(date);
                  return (
                    <Box 
                      key={dateStr}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      sx={{
                        flex: 1, minWidth: 0, transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, pb: 1, borderRadius: '12px',
                        border: isTodayDate ? '1px solid #c7d2fe' : '1px solid #e5e7eb', backgroundColor: isTodayDate ? '#eef2ff' : '#fff', overflow: 'hidden', cursor: 'default',
                        '&:hover': { flex: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                      }}
                    >
                      <Typography variant="caption" sx={{ pointerEvents: 'none', fontWeight: 'bold', textTransform: 'uppercase', color: isTodayDate ? '#4f46e5' : '#9ca3af', fontSize: '9px' }}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</Typography>
                      <Typography variant="body2" sx={{ pointerEvents: 'none', fontWeight: 'bold', mb: 1, color: isTodayDate ? '#4338ca' : '#374151', fontSize: '12px' }}>{date.getDate()}</Typography>
                      <Box sx={{ width: '100%', px: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>
                        {dayTasks.map((t, idx) => (
                          <Box key={`${t.id}-${idx}`} className="group" sx={{ bgcolor: 'white', border: '1px solid #f3f4f6', borderRadius: '4px', p: 0.5, cursor: 'pointer', borderLeft: `3px solid ${t.color || '#3b82f6'}`, fontSize: '9px', fontWeight: 500, color: '#374151', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                            <Box onClick={(e) => { e.stopPropagation(); handleRemoveTask(dateStr, t.id); }} sx={{ display: 'none', '&:hover': { color: '#ef4444' } }} className="group-hover:flex"><X size={10} /></Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            {/* TASKS LIST HEADER + TRIGGER */}
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a' }}>Tasks</Typography>
              {!showAddTaskForm && (
                <button 
                  onClick={() => setShowAddTaskForm(true)}
                  className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition active:scale-95 flex items-center gap-1 shadow-sm"
                >
                  <Sparkles size={14} /> Add Task
                </button>
              )}
            </div>

            {/* --- INLINE ADD TASK FORM --- */}
            {showAddTaskForm && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1 font-bold">Task Title *</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g., Complete readings"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1 font-bold">Description</label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Add details about this task..."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1 font-bold">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      min="5" max="480" step="5"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        setShowAddTaskForm(false);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskDuration(30);
                      }}
                      className="flex-1 bg-white text-gray-600 text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="flex-1 bg-indigo-600 text-white text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-sm"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EXISTING TASKS */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card 
                  key={task.id} 
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, task)} 
                  sx={{ 
                    borderRadius: '12px', cursor: 'grab', boxShadow: 'none', border: '1px solid #e5e7eb',
                    bgcolor: task.completed ? '#f9fafb' : 'white', transition: 'all 0.2s',
                    '&:hover': { borderColor: assignment.courseColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                    '&:active': { cursor: 'grabbing' }
                  }}
                >
                  <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <div onClick={() => toggleTask(task.id)} className="cursor-pointer text-gray-300 hover:text-blue-500 mt-1">
                        {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} />}
                      </div>
                      <Box sx={{ flexGrow: 1 }}>
                        <div className="flex items-center gap-2">
                          <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#9ca3af' : '#1f2937' }}>
                            {task.label}
                          </Typography>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${task.completed ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                            {task.estTime}
                          </span>
                        </div>
                        
                        {/* Task Description Display */}
                        {task.description && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#6b7280', fontSize: '11px', lineHeight: 1.4 }}>
                            {task.description}
                          </Typography>
                        )}

                        {/* AI Description Box */}
                        {task.aiSummary && !task.completed && (
                            <Box 
                                sx={{ 
                                    mt: 1.5, 
                                    p: 1.5, 
                                    borderRadius: '8px', 
                                    background: 'linear-gradient(135deg, #f5f3ff 0%, #f0f7ff 100%)',
                                    border: '1px solid #e0e7ff',
                                    position: 'relative'
                                }}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles size={10} className="text-indigo-500" />
                                    <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        AI Learning Insight
                                    </Typography>
                                </div>
                                <Typography variant="caption" sx={{ display: 'block', color: '#4338ca', fontSize: '11px', lineHeight: 1.4, fontStyle: 'italic' }}>
                                    {task.aiSummary}
                                </Typography>
                            </Box>
                        )}
                      </Box>
                  </CardContent>
                </Card>
              ))}
            </div>
        </>
      )}

      {activeTab === 'timer' && <TimerPanel />}
    </Box>
  );
}