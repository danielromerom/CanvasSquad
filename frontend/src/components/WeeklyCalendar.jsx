import React, { useState, useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function WeeklyCalendar({ scheduledTasks, onDropTask, onRemoveTask, onToggleTask, onClearDay }) {
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

          return (
            <Box 
              key={dateStr}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => onDropTask(e, dateStr)} 
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, pb: 1, borderRadius: '12px',
                border: isTodayDate ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                backgroundColor: isTodayDate ? '#eef2ff' : '#fff',
                minHeight: '120px', overflow: 'hidden', flex: 1, minWidth: 0,
                transition: 'flex 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s', 
                cursor: 'default',
                '&:hover': { flex: 6, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                '&:hover .clear-day-btn': { opacity: 1, visibility: 'visible' } 
              }}
            >
              
              {/* TOP HEADER ROW: Holds Centered Day Name and Absolute X Button */}
              <Box sx={{ width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', mb: 0.5, px: 1 }}>
                
                {/* Centered Day Name */}
                <Typography variant="caption" sx={{ pointerEvents: 'none', fontWeight: 'bold', textTransform: 'uppercase', color: isTodayDate ? '#4f46e5' : '#9ca3af', fontSize: '10px' }}>
                  {dayName}
                </Typography>

                {/* CLEAR DAY BUTTON - Absolute Right */}
                {tasksForDay.length > 0 && (
                  <Box 
                    className="clear-day-btn"
                    onClick={(e) => { e.stopPropagation(); onClearDay(dateStr); }}
                    sx={{ 
                      opacity: 0, 
                      visibility: 'hidden',
                      position: 'absolute', // Floating so it doesn't break centering
                      right: 18,             // Pushed to the right edge
                      top: '50%',
                      transform: 'translateY(-50%)', // Centers it vertically with the text
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#fee2e2', 
                      color: '#ef4444', 
                      borderRadius: '50%', 
                      p: '2px', // Slightly smaller padding so it fits well 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#fca5a5', color: '#b91c1c' }
                    }}
                    title="Clear all tasks for this day"
                  >
                    <X size={10} strokeWidth={3} />
                  </Box>
                )}
              </Box>

              {/* Day Number */}
              <Typography variant="body2" sx={{ pointerEvents: 'none', fontWeight: 'bold', mb: 1, color: isTodayDate ? '#4338ca' : '#374151' }}>
                {dayNum}
              </Typography>

              {/* Dropped Tasks */}
              <Box sx={{ width: '100%', px: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto', minHeight: 0, '::-webkit-scrollbar': { display: 'none' } }}>
                {tasksForDay.map((task) => (
                  <Box 
                     key={task.id}
                     className="group"
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       onToggleTask(null, task.id); 
                     }}
                     sx={{
                         bgcolor: task.completed ? '#f3f4f6' : 'white', border: '1px solid',
                         borderColor: task.completed ? '#e5e7eb' : '#f3f4f6', borderRadius: '4px',
                         p: 0.5, cursor: 'pointer', borderLeft: `3px solid ${task.completed ? '#d1d5db' : task.color}`,
                         fontSize: '9px', fontWeight: 500, color: task.completed ? '#9ca3af' : '#374151', 
                         boxShadow: task.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                         position: 'relative', display: 'flex', alignItems: 'center', gap: 0.5,
                         transition: 'all 0.2s ease',
                         '&:hover .remove-btn': { display: 'flex' }
                     }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.label}
                    </span>
                    <Box 
                      className="remove-btn" 
                      onClick={(e) => { e.stopPropagation(); onRemoveTask(dateStr, task.id); }}
                      sx={{ display: 'none', position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: '#fff', borderRadius: '50%', p: 0.5, boxShadow: 1 }}
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
    </>
  );
}