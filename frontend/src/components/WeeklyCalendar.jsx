import React, { useState, useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function WeeklyCalendar({ scheduledTasks, onDropTask, onRemoveTask, onToggleTask, onClearDay, variant = 'detail', onGroupClick, assignments = [], localAssignment }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // helpers
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInternalDragStart = (e, task, sourceDate) => {
    const dragData = {
      ...task,
      sourceDate: sourceDate,
      isInternalMove: true
    };
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {/* Week Navigation */}
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

      {/* Calendar Grid */}
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

          let currentAssignmentTasks = [];

          if (variant === 'detail') {
            tasksForDay.forEach(task => {
              if (task.id.includes(`task-${localAssignment?.id}`)) {
                currentAssignmentTasks.push(task);
              }
            });
          }

          const groupedTasks = {};
          if (variant === 'main') {
              tasksForDay.forEach(task => {
                  const parts = task.id.split('-');
                  const assignId = parts.length > 1 ? parts[1] : 'unknown';
                  if (!groupedTasks[assignId]) {
                    let title = "Loading...";
                    let due = "";
                    let isUrgent = false;
                    
                    if (assignments.length > 0) {
                        const parentAssign = assignments.find(a => 
                            String(a.canvas_assignment_id) === String(assignId) || 
                            String(a.id).endsWith(`-${assignId}`)
                        );
                        if (parentAssign) {
                            title = parentAssign.title;
                            due = parentAssign.due; 
                            if (due) due = due.split(',')[0]; 

                            if (parentAssign.raw_due_at) {
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
                        }
                    }

                    groupedTasks[assignId] = {
                        id: assignId,
                        title: title,
                        due: due,
                        isUrgent: isUrgent,
                        color: task.color || '#3b82f6',
                        total: 0,
                        completed: 0,
                        totalMinutes: 0
                    };
                  }

                  if (task.time) {
                      const mins = parseInt(task.time) || 0;
                      groupedTasks[assignId].totalMinutes += mins;
                  }

                  groupedTasks[assignId].total += 1;
                  if (task.completed) groupedTasks[assignId].completed += 1;
              });
          }
          
          return (
            <Box 
              key={dateStr}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => onDropTask(e, dateStr)} 
              sx={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, pb: 1, borderRadius: '12px',
                border: isTodayDate ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                backgroundColor: isTodayDate ? '#eef2ff' : '#fff',
                minHeight: '120px', overflow: 'hidden', flex: 1, minWidth: 0,
                transition: 'flex 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s', 
                cursor: 'default',
                '&:hover': { flex: 6, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                '&:hover .clear-day-btn': { opacity: 1, visibility: 'visible' },
                '& .due-date-text': { opacity: 0, height: 0, overflow: 'hidden', transition: 'all 0.2s ease' },
                '&:hover .due-date-text': { opacity: 1, height: 'auto' }
              }}
            >
              
              {/* TOP HEADER ROW: Holds Centered Day Name and Absolute X Button */}
              <Box sx={{ width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', mb: 0.5, px: 1 }}>
                
                {/* Centered Day Name */}
                <Typography variant="caption" sx={{ pointerEvents: 'none', fontWeight: 'bold', textTransform: 'uppercase', color: isTodayDate ? '#4f46e5' : '#9ca3af', fontSize: '10px' }}>
                  {dayName}
                </Typography>

                {/* CLEAR DAY BUTTON - Absolute Right */}
                {(variant === 'main' ? tasksForDay.length > 0 : currentAssignmentTasks.length > 0) && (
                  <Box 
                    className="clear-day-btn"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onClearDay(dateStr, variant === 'detail' ? localAssignment?.id : null); 
                    }}
                    sx={{ 
                      opacity: 0, 
                      visibility: 'hidden',
                      position: 'absolute', 
                      right: 18,            
                      top: '50%',
                      transform: 'translateY(-50%)', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#fee2e2', 
                      color: '#ef4444', 
                      borderRadius: '50%', 
                      p: '2px', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#fca5a5', color: '#b91c1c' }
                    }}
                    title={variant === 'detail' ? "Clear tasks for this assignment" : "Clear all tasks for this day"}
                  >
                    <X size={10} strokeWidth={3} />
                  </Box>
                )}
              </Box>

              {/* Day Number */}
              <Typography variant="body2" sx={{ pointerEvents: 'none', fontWeight: 'bold', mb: 1, color: isTodayDate ? '#4338ca' : '#374151' }}>
                {dayNum}
              </Typography>

              {/* Dynamic render */}
              <Box sx={{ width: '100%', px: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto', minHeight: 0, '::-webkit-scrollbar': { display: 'none' } }}>
                
                {variant === 'main' ? (
                   /* OVERVIEW MODE: Render Grouped Assignment Blocks */
                   Object.values(groupedTasks).map(group => {
                       const isAllDone = group.completed === group.total;
                       return (
                          <Box 
                             key={group.id}
                             onClick={(e) => { e.stopPropagation(); if(onGroupClick) onGroupClick(group.id); }}
                             sx={{
                                bgcolor: isAllDone ? '#f3f4f6' : 'white',
                                border: '1px solid', borderColor: isAllDone ? '#e5e7eb' : '#e5e7eb',
                                borderRadius: '6px', p: 1, cursor: 'pointer',
                                borderLeft: `4px solid ${isAllDone ? '#d1d5db' : group.color}`,
                                boxShadow: isAllDone ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex', flexDirection: 'column', gap: 0.5,
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: group.color }
                             }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography sx={{ 
                                fontSize: '9px', 
                                fontWeight: 800, 
                                color: isAllDone ? '#d1d5db' : group.color,
                                bgcolor: isAllDone ? 'transparent' : `${group.color}10`,
                                px: 0.5,
                                borderRadius: '4px'
                              }}>
                                {group.totalMinutes >= 60 
                                  ? `${Math.floor(group.totalMinutes / 60)}h ${group.totalMinutes % 60}m` 
                                  : `${group.totalMinutes}m`}
                              </Typography>
                            </Box>
                              
                            {/* Title */}
                             <Typography sx={{ fontSize: '10px', fontWeight: 800, color: isAllDone ? '#9ca3af' : (group.isUrgent ? '#ef4444' : '#1f2937'), lineHeight: 1.2, mb: 0.25, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                                 {group.title}
                             </Typography>
                             
                             {/* due date */}
                            <Box className="due-date-text">
                               {group.due && (
                                 <Typography sx={{ 
                                     fontSize: '8px', 
                                     fontWeight: 700, 
                                     color: isAllDone ? '#d1d5db' : (group.isUrgent ? '#ef4444' : '#9ca3af'), 
                                     textTransform: 'uppercase'
                                 }}>
                                   Due {group.due}
                                 </Typography>
                               )}
                             </Box>

                             {/* Progress */}
                            <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: isAllDone ? '#9ca3af' : '#1f2937' }}>
                              {group.completed}/{group.total} Done
                            </Typography>                              
                            
                             <Box sx={{ width: '100%', height: '4px', bgcolor: isAllDone ? '#d1d5db' : '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                                 <Box sx={{ width: `${(group.completed / group.total) * 100}%`, height: '100%', bgcolor: isAllDone ? '#9ca3af' : group.color, transition: 'width 0.3s' }} />
                             </Box>
                          </Box>
                       )
                   })
                ) : (
                   /* DETAIL MODE: Render Individual Tasks */
                  <>
                    {/* 1. Show summary message for OTHER assignments scheduled today at the TOP */}
                    {(() => {
                      const otherTasksTime = tasksForDay
                        .filter(task => !task.id.includes(`task-${localAssignment?.id}`))
                        .reduce((acc, curr) => acc + (parseInt(curr.time) || 0), 0);

                      return otherTasksTime > 0 ? (
                        <Box sx={{ 
                          width: '100%',
                          mb: 1, 
                          p: 0.5, 
                          bgcolor: '#f9fafb', 
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          borderLeft: '3px solid #d1d5db',
                          display: 'flex', 
                          alignItems: 'center', 
                          minHeight: '22px',
                          boxSizing: 'border-box'
                        }}>
                          <Typography sx={{ 
                            fontSize: '8px', 
                            color: '#6b7280', 
                            fontWeight: 700, 
                            textAlign: 'left',
                            ml: 0.5, 
                            lineHeight: 1.2,
                            letterSpacing: '0.2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {otherTasksTime >= 60 
                              ? `${Math.floor(otherTasksTime / 60)}h ${otherTasksTime % 60}m` 
                              : `${otherTasksTime}m`} of Other Work
                          </Typography>
                        </Box>
                      ) : null;
                    })()}

                    {/* 2. Show detailed blocks ONLY for current assignment tasks BELOW the summary */}
                    {tasksForDay
                      .filter(task => task.id.includes(`task-${localAssignment?.id}`))
                      .map((task) => (
                        <Box 
                          key={task.id}
                          className="group"
                          draggable={true} 
                          onDragStart={(e) => handleInternalDragStart(e, task, dateStr)}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onToggleTask(null, task.id); 
                          }}
                          sx={{
                              bgcolor: task.completed ? '#f3f4f6' : 'white', 
                              border: '1px solid',
                              borderColor: task.completed ? '#e5e7eb' : '#f3f4f6', 
                              borderRadius: '4px',
                              p: 0.5, 
                              cursor: 'pointer', 
                              borderLeft: `3px solid ${task.completed ? '#d1d5db' : task.color}`,
                              fontSize: '9px', 
                              fontWeight: 500, 
                              color: task.completed ? '#9ca3af' : '#374151', 
                              boxShadow: task.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                              position: 'relative', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              transition: 'all 0.2s ease',
                              mb: 0.5, // Added small margin between subtasks
                              '&:hover .remove-btn': { display: 'flex' }
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: task.completed ? 'line-through' : 'none' }}>
                              {task.label}
                          </span>

                          {task.time && (
                            <Box sx={{ 
                              fontSize: '7px', 
                              fontWeight: 'bold', 
                              color: task.completed ? '#9ca3af' : '#6b7280', 
                              bgcolor: task.completed ? 'transparent' : '#f3f4f6', 
                              px: 0.5, 
                              py: 0.25, 
                              borderRadius: '4px',
                              flexShrink: 0
                            }}>
                              {task.time}
                            </Box>
                          )}

                          <Box 
                            className="remove-btn" 
                            onClick={(e) => { e.stopPropagation(); onRemoveTask(dateStr, task.id); }}
                            sx={{ display: 'none', position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: '#fff', borderRadius: '50%', p: 0.5, boxShadow: 1 }}
                          >
                            <X size={10} color="#ef4444" />
                          </Box>
                        </Box>
                      ))}
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}