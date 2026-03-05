import React, { useState, useRef, useEffect } from 'react'; // Added useState
import { Box, Typography, Card, CardContent, Collapse, Paper, Divider } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, CalendarIcon, X } from 'lucide-react';

export default function AssignmentTask({ task, handleDragStart, toggleTaskExpansion, toggleTask, localAssignment, handleTimer, activeTab, scheduledTasks, isExpanded, onScheduleTask }) {
    const [showDateBubble, setShowDateBubble] = useState(false);

    const bubbleRef = useRef(null);

    const { availableDates, dateLabel } = (() => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let limitDate = new Date(today);
        limitDate.setDate(limitDate.getDate() + 6); 
        let label = "Next 7 Days";

        if (localAssignment?.raw_due) {
            const dueDate = new Date(localAssignment.raw_due);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
                label = "PAST DUE";
            } else if (dueDate < limitDate) {
                limitDate = dueDate;
                label = "Until Deadline";
            }
        }

        let current = new Date(today);
        while (current <= limitDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return { availableDates: days, dateLabel: label };
    })();

    useEffect(() => {
        function handleClickOutside(event) {
            if (showDateBubble && bubbleRef.current && !bubbleRef.current.contains(event.target)) {
                setShowDateBubble(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDateBubble]);

    let scheduledDateLabel = null;
    if (scheduledTasks) {
        for (const [dateStr, dayTasks] of Object.entries(scheduledTasks)) {
            if (dayTasks && dayTasks.some(t => t.id === task.id)) {
                const d = new Date(dateStr);
                
                if (!isNaN(d.getTime())) {
                    scheduledDateLabel = d.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                }
                break;
            }
        }
    }

    return (
        <div style={{ position: 'relative' }}>
            {task ? (
                <Card 
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task)} 
                    sx={{ 
                        borderRadius: '12px', cursor: 'pointer', boxShadow: 'none', border: '1px solid #e5e7eb',
                        bgcolor: task.completed ? '#f9fafb' : 'white',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: localAssignment?.color || '#3b82f6' },
                        mb: 1,
                        overflow: 'visible'
                    }}
                    onClick={() => toggleTaskExpansion(task.id)}
                >
                    <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <div onClick={(e) => { e.stopPropagation(); toggleTask(null, task.id); }} className="cursor-pointer mt-1">
                            {task.completed ? <CheckCircle2 size={20} className="text-green-500"/> : <Circle size={20} className="text-gray-300"/>}
                        </div>

                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                
                                {/* Title Container */}
                                <Typography variant="body2" sx={{ 
                                    fontWeight: 600, 
                                    textDecoration: task.completed ? 'line-through' : 'none', 
                                    color: '#1f2937', 
                                    flex: 1,
                                    minWidth: 0,
                                    pr: 2, 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'anywhere', 
                                    lineHeight: 1.4
                                }}>
                                    {task.label}
                                </Typography>

                                {/* Actions Container */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-end', 
                                    gap: '6px', 
                                    flexShrink: 0 // Prevent the buttons from being squished
                                }}>
                                    <div className="flex items-center gap-2">
                                        {activeTab !== 'timer' && (
                                            <button  
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" 
                                                onClick={(e) => { e.stopPropagation(); handleTimer(task); }} 
                                                style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                                            >
                                                {task.time}
                                            </button>
                                        )}
                                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </div>

                                    {/* SCHEDULE LOGIC */}
                                    {!task.completed && activeTab !== 'timer' && (
                                        <Box sx={{ position: 'relative' }} ref={bubbleRef}>
                                            <div 
                                                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
                                                    scheduledDateLabel ? 'text-gray-400 bg-gray-50' : 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
                                                }`}
                                                onClick={(e) => { e.stopPropagation(); setShowDateBubble(!showDateBubble); }}
                                            >
                                                <CalendarIcon size={10} />
                                                {scheduledDateLabel || "Schedule"}
                                            </div>

                                            {showDateBubble && (
                                                <Paper 
                                                    elevation={4}
                                                    sx={{ 
                                                        position: 'absolute', top: '100%', right: 0, zIndex: 9999, mt: 1,
                                                        minWidth: '150px', borderRadius: '12px', border: '1px solid #e5e7eb',
                                                        overflow: 'hidden', bgcolor: 'white'
                                                    }}
                                                >
                                                    <Typography sx={{ p: 1, pb: 0.5, fontSize: '9px', fontWeight: 800, color: dateLabel === "PAST DUE" ? '#ef4444' : '#9ca3af', textTransform: 'uppercase' }}>
                                                        {dateLabel}
                                                    </Typography>

                                                    {availableDates.map((date) => (
                                                        <Box 
                                                            key={date.toDateString()}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onScheduleTask(task, date.toDateString());
                                                                setShowDateBubble(false);
                                                            }}
                                                            sx={{ 
                                                                px: 1.5, py: 1, cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                                                display: 'flex', justifyContent: 'space-between',
                                                                '&:hover': { bgcolor: '#f5f3ff', color: '#6366f1' }
                                                            }}
                                                        >
                                                            <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                            <span style={{ opacity: 0.5 }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        </Box>
                                                    ))}
                                                    
                                                    {scheduledDateLabel && (
                                                        <>
                                                            <Divider />
                                                            <Box 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onScheduleTask(task, null);
                                                                    setShowDateBubble(false);
                                                                }}
                                                                sx={{ 
                                                                    px: 1.5, py: 1, cursor: 'pointer', fontSize: '11px', fontWeight: 700, 
                                                                    color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1,
                                                                    '&:hover': { bgcolor: '#fef2f2' }
                                                                }}
                                                            >
                                                                <X size={12} /> Clear Date
                                                            </Box>
                                                        </>
                                                    )}
                                                </Paper>
                                            )}
                                        </Box>
                                    )}
                                </Box>  
                            </Box>

                            <Collapse in={isExpanded}>
                                <Box sx={{ pt: 1.5 }}>
                                    {task.description && (
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#4b5563', fontSize: '12px', lineHeight: 1.5 }}>
                                            {task.description}
                                        </Typography>
                                    )}
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
            ) : null}
        </div>
    );
}