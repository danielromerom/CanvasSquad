import React, { useState } from 'react';
import { Box, Typography, Chip, Card, CardContent, Checkbox } from '@mui/material';
import { Timer } from 'lucide-react'; // Ensure you have this installed

const DUMMY_ASSIGNMENT = {
  course: "MATH 221",
  title: "Linear Algebra Problem Set 5",
  courseColor: "#4D88FF", // Updated to the blue in your original image
  dueDate: "Feb 2",
};

export default function AssignmentPanel({ 
  assignment = DUMMY_ASSIGNMENT, 
  initialTasks = [] 
}) {
  // --- 1. DEFINE THE MISSING STATE ---
  const [assignmentTab, setAssignmentTab] = useState('tasks');

  const [tasks, setTasks] = useState(initialTasks.length > 0 ? initialTasks : [
    { id: 1, label: "Review eigenvalue concepts", estTime: "30m", completed: false },
    { id: 2, label: "Solve problems 1-5", estTime: "60m", completed: false },
    { id: 3, label: "Solve problems 6-10", estTime: "60m", completed: false },
    { id: 4, label: "Review and check answers", estTime: "30m", completed: false },
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Box sx={{ pt: 1, pb: 2, pl: 1.5, pr: 1.5, maxWidth: '640px', mx: 'auto' }}>
      
      {/* --- 2. TOGGLE BUTTONS --- */}
      <div className="bg-[#ececf0] rounded-[14px] p-[3px] flex gap-0 mb-8 max-w-sm mx-auto">
        <button
          onClick={() => setAssignmentTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-2 h-[29px] rounded-[14px] transition-all ${
            assignmentTab === 'tasks' ? 'bg-white shadow-sm' : 'bg-transparent text-gray-500'
          }`}
        >
          <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[12px] font-medium">Tasks</span>
        </button>
        <button
          onClick={() => setAssignmentTab('pomodoro')}
          className={`flex-1 flex items-center justify-center gap-2 h-[29px] rounded-[14px] transition-all ${
            assignmentTab === 'pomodoro' ? 'bg-white shadow-sm' : 'bg-transparent text-gray-500'
          }`}
        >
          <Timer className="size-[14px]" />
          <span className="text-[12px] font-medium">Pomodoro</span>
        </button>
      </div>

      {/* --- 3. CONDITIONAL RENDERING --- */}
      {assignmentTab === 'tasks' ? (
        <>
          {/* ASSIGNMENT HEADER */}
          <div
            className="p-6 mb-6 shadow-lg"
            style={{
              borderRadius: '24px',   
              background: `linear-gradient(135deg, ${assignment.courseColor} 0%, #3a6ed1 100%)`,
              width: '100%',
            }}
          >
            <div className="flex flex-col text-white">
              <p className="text-[11px] opacity-90 mb-2 uppercase tracking-[0.2em] font-semibold">
                {assignment.course}
              </p>
              <h2 className="text-[28px] font-bold mb-6 leading-[1.15]">
                {assignment.title}
              </h2>
              <div className="flex items-center justify-between text-[14px] mb-3 font-semibold">
                <span>Due: {assignment.dueDate}</span>
                <span>{completedTasks}/{totalTasks} Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-[6px]">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* SECTION HEADER & TASK LIST */}
          <Box sx={{ mb: 2.5, pl: 1 }}>
             <Chip label="AI BREAKDOWN" size="small" sx={{ mb: 1.5, fontWeight: 700, fontSize: '9px', background: 'linear-gradient(45deg, #9c27b0, #673ab7)', color: 'white', height: '20px' }} />
             <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a1a' }}>Assignment Tasks</Typography>
          </Box>
          
          <div className="space-y-2.5">
            {tasks.map((task, index) => (
              <Card key={task.id} variant="outlined" sx={{ borderRadius: '14px', '&:hover': { borderColor: assignment.courseColor } }}>
                <CardContent sx={{ p: '14px 18px !important', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                   <Checkbox checked={task.completed} onChange={() => toggleTask(task.id)} sx={{ '&.Mui-checked': { color: assignment.courseColor } }} />
                   <Box>
                     <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#9ca3af' : '#1f2937' }}>
                       {index + 1}. {task.label}
                     </Typography>
                     <Typography variant="caption" sx={{ color: '#9ca3af' }}>Estimated: {task.estTime}</Typography>
                   </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* POMODORO PLACEHOLDER */
        <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <Timer className="mx-auto size-10 text-gray-300 mb-2" />
          <Typography className="text-gray-400">Pomodoro Timer Coming Soon</Typography>
        </div>
      )}
    </Box>
  );
}