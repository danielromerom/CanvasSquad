import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { LayoutList, ChevronRight, ChevronDown, CheckCircle2, Circle, ExternalLink, Calendar } from 'lucide-react';

// --- Sub-component for the collapsible Assignment Group ---
const AssignmentDropdown = ({ assignment, color, onToggleTask, openAssignmentLink }) => {
  const [isOpen, setIsOpen] = useState(true); // Default to open

  return (
    <Box sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', bgcolor: 'white' }}>
      
      {/* Assignment Header (Click to toggle expand/collapse) */}
      <Box 
        onClick={() => setIsOpen(!isOpen)}
        sx={{ 
          p: 1.5, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          bgcolor: '#f9fafb',
          borderLeft: `4px solid ${color}`,
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: '#f3f4f6' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', lineHeight: 1.2 }}>
            {assignment.title}
          </Typography>
          
          {/* UPDATED: Due Date Display with Urgent Color Logic */}
          {assignment.due && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Calendar size={10} color={assignment.isUrgent ? "#ef4444" : "#9ca3af"} />
              <Typography sx={{ 
                fontSize: '10px', 
                fontWeight: 600, 
                color: assignment.isUrgent ? '#ef4444' : '#6b7280', 
                textTransform: 'uppercase' 
              }}>
                Due {assignment.due}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Open in Canvas Button */}
          {assignment.canvasCourseId && (
             <IconButton 
               size="small" 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 openAssignmentLink(assignment.canvasCourseId, assignment.assignId); 
               }}
               title="Open in Canvas"
               sx={{ color: '#9ca3af', '&:hover': { color: '#4f46e5', bgcolor: '#e0e7ff' } }}
             >
               <ExternalLink size={16} />
             </IconButton>
          )}
          {/* Chevron Toggle */}
          <Box sx={{ color: '#9ca3af', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <ChevronDown size={18} />
          </Box>
        </Box>
      </Box>

      {/* Nested Tasks List */}
      <Collapse in={isOpen}>
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {assignment.tasks.map((task) => (
            <Box 
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              sx={{ 
                p: 1.5, 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: task.completed ? 0.6 : 1,
                '&:hover': { bgcolor: '#f3f4f6' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: task.completed ? '#10b981' : '#d1d5db' }}>
                  {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </Box>
                <Typography sx={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: task.completed ? '#9ca3af' : '#374151', 
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                  {task.label}
                </Typography>
              </Box>
              
              {task.time && (
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', bgcolor: '#f3f4f6', px: 1, py: 0.5, borderRadius: '4px' }}>
                  {task.time}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Collapse>

    </Box>
  );
};


// --- Main Panel Component ---
export default function DailyPanel({ scheduledTasks, allHydratedAssignments, onToggleTask }) {
  const todayString = new Date().toDateString();
  const tasksForToday = scheduledTasks[todayString] || [];

  const openAssignmentLink = (courseId, assignId) => {
    window.open(`https://ufldev.instructure.com/courses/${courseId}/assignments/${assignId}`, '_blank');
  };

  // 1. Group tasks by Course, then by Assignment
  const groupedData = tasksForToday.reduce((acc, task) => {
    const parts = task.id.split('-');
    const parentAssignId = parts.length > 1 ? parts[1] : null;
    
    const parentAssign = allHydratedAssignments.find(a => 
      String(a.canvas_assignment_id) === String(parentAssignId) || 
      String(a.id) === String(parentAssignId)
    );

    const courseName = parentAssign ? parentAssign.course : 'Other Tasks';
    const courseColor = parentAssign ? parentAssign.color : '#9ca3af';
    const assignTitle = parentAssign ? parentAssign.title : 'General Subtasks';
    const assignId = parentAssignId || 'general';
    const canvasCourseId = parentAssign ? parentAssign.canvas_course_id : null;
    
    // Extract the due date
    const dueDate = parentAssign ? parentAssign.due : null;

    // NEW: Calculate urgency (due today or tomorrow)
    let isUrgent = false;
    if (parentAssign && parentAssign.raw_due_at) {
      const dueDateObj = new Date(parentAssign.raw_due_at);
      const todayObj = new Date();
      const tomorrowObj = new Date(todayObj);
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);

      dueDateObj.setHours(0,0,0,0);
      todayObj.setHours(0,0,0,0);
      tomorrowObj.setHours(0,0,0,0);

      if (dueDateObj.getTime() === todayObj.getTime() || dueDateObj.getTime() === tomorrowObj.getTime()) {
          isUrgent = true;
      }
    }

    // Initialize Course Group
    if (!acc[courseName]) {
      acc[courseName] = { color: courseColor, assignments: {} };
    }
    // Initialize Assignment Group
    if (!acc[courseName].assignments[assignId]) {
      acc[courseName].assignments[assignId] = {
        title: assignTitle,
        canvasCourseId,
        assignId,
        due: dueDate, 
        isUrgent: isUrgent, // Pass urgency to the dropdown
        tasks: []
      };
    }
    
    // Add task to assignment
    acc[courseName].assignments[assignId].tasks.push(task);
    
    return acc;
  }, {});


  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1f2937' }}>
          Today's Plan
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {tasksForToday.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9fafb', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
          <LayoutList size={32} color="#9ca3af" style={{ margin: '0 auto', mb: '12px' }} />
          <Typography variant="body2" color="text.secondary" fontWeight="bold">
            Your day is clear!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drag tasks onto today in the Schedule tab to build your plan.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Render grouped data */}
          {Object.entries(groupedData).map(([courseName, courseData]) => (
            <Box key={courseName}>
              
              {/* Course Level Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pl: 0.5 }}>
                 <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', bgcolor: courseData.color }} />
                 <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                   {courseName}
                 </Typography>
              </Box>

              {/* Assignment Level Dropdowns */}
              {Object.values(courseData.assignments).map(assignment => (
                <AssignmentDropdown 
                  key={assignment.assignId}
                  assignment={assignment}
                  color={courseData.color}
                  onToggleTask={onToggleTask}
                  openAssignmentLink={openAssignmentLink}
                />
              ))}

            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}