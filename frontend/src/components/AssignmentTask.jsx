import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Collapse, Paper, IconButton, TextField } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, CalendarIcon, X, GripVertical, Trash2, Clock, Check, AlertCircle } from 'lucide-react';

export default function AssignmentTask({ 
    task, index, isEditMode, handleDragStart, toggleTaskExpansion, toggleTask, 
    localAssignment, handleTimer, activeTab, scheduledTasks, isExpanded, 
    onScheduleTask, onDelete, onUpdate, onMove 
}) {
    const [showDateBubble, setShowDateBubble] = useState(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    
    const [editValue, setEditValue] = useState(task.label || "");
    const [descValue, setDescValue] = useState(task.description || "");
    const [timeValue, setTimeValue] = useState(task.time?.toString().replace('m', '') || '15');
    
    const hasExpandableContent = Boolean(task.description || task.aiSummary || isEditMode);

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const bubbleRef = useRef(null);

    const saveChanges = (updates = {}) => {
        onUpdate(task.id, {
            label: editValue,
            description: descValue,
            time: `${timeValue}m`,
            ...updates
        });
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (showDateBubble && bubbleRef.current && !bubbleRef.current.contains(event.target)) {
                setShowDateBubble(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showDateBubble]);

    const handleDragOver = (e) => { if (!isEditMode) return; e.preventDefault(); };
    const handleDrop = (e) => {
        if (!isEditMode) return;
        try {
            const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
            if (dragData.index !== undefined && dragData.index !== index) onMove(dragData.index, index);
        } catch (err) { console.error(err); }
    };

    const { availableDates, dateLabel } = (() => {
        const days = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let limitDate = new Date(today); limitDate.setDate(limitDate.getDate() + 6); 
        if (localAssignment?.raw_due) {
            const dueDate = new Date(localAssignment.raw_due); dueDate.setHours(0, 0, 0, 0);
            if (dueDate >= today && dueDate < limitDate) limitDate = dueDate;
        }
        let current = new Date(today);
        while (current <= limitDate) { days.push(new Date(current)); current.setDate(current.getDate() + 1); }
        return { availableDates: days, dateLabel: localAssignment?.raw_due && new Date(localAssignment.raw_due) < today ? "PAST DUE" : "Available Days" };
    })();

    let scheduledDateLabel = null;
    if (scheduledTasks) {
        for (const [dateStr, dayTasks] of Object.entries(scheduledTasks)) {
            if (dayTasks?.some(t => t.id === task.id)) {
                const d = new Date(dateStr);
                scheduledDateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                break;
            }
        }
    }

    const effectiveExpanded = isEditMode || (isExpanded && hasExpandableContent);

    return (
        <div style={{ position: 'relative' }} onDragOver={handleDragOver} onDrop={handleDrop}>
            <Card 
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task, index)} 
                sx={{ 
                    borderRadius: '12px', boxShadow: 'none', 
                    border: isEditMode ? '1px dashed #a5b4fc' : '1px solid #e5e7eb',
                    bgcolor: task.completed ? '#f9fafb' : 'white',
                    transition: 'all 0.2s', mb: 1, overflow: 'visible',
                    cursor: hasExpandableContent && !isEditMode ? 'pointer' : 'default'
                }}
                onClick={() => !isEditMode && hasExpandableContent && toggleTaskExpansion(task.id)}
            >
                <CardContent sx={{ p: '12px 16px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {isEditMode ? (
                            <GripVertical size={18} className="text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        ) : (
                            <div onClick={(e) => { e.stopPropagation(); toggleTask(null, task.id); }} className="cursor-pointer flex-shrink-0">
                                {task.completed ? <CheckCircle2 size={20} className="text-green-500"/> : <Circle size={20} className="text-gray-300"/>}
                            </div>
                        )}

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            {showConfirmDelete ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fef2f2', p: 0.5, borderRadius: '8px' }}>
                                    <Typography sx={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AlertCircle size={14} /> Delete?
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold border-none cursor-pointer">Yes</button>
                                        <button onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] border-none cursor-pointer">No</button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    {isEditingLabel ? (
                                        <input 
                                            autoFocus className="w-full border-b border-indigo-500 outline-none text-sm font-bold bg-transparent"
                                            value={editValue} onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => { setIsEditingLabel(false); saveChanges(); }}
                                            onKeyDown={e => e.key === 'Enter' && setIsEditingLabel(false)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ 
                                            fontWeight: 700, textDecoration: task.completed ? 'line-through' : 'none', 
                                            color: '#1f2937', flex: 1, fontSize: '13px',
                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4
                                        }} onClick={(e) => { if(isEditMode) { e.stopPropagation(); setIsEditingLabel(true); }}}>
                                            {task.label}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 1 }}>
                                        {isEditMode ? (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f3f4f6', px: 1, borderRadius: '4px' }}>
                                                    <Clock size={10} className="text-gray-500 mr-1" />
                                                    <input 
                                                        style={{ width: '22px', background: 'transparent', border: 'none', fontSize: '10px', fontWeight: 'bold', outline: 'none' }} // Fixed: Added outline none
                                                        value={timeValue} onChange={e => setTimeValue(e.target.value)}
                                                        onBlur={() => saveChanges()}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span style={{ fontSize: '10px', color: '#6b7280' }}>m</span>
                                                </Box>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }} sx={{ p: 0.5 }}>
                                                    <Trash2 size={14} className="text-red-400" />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer" 
                                                        onClick={(e) => { e.stopPropagation(); handleTimer(task); }} 
                                                        style={{ 
                                                            border: 'none', 
                                                            outline: 'none',
                                                            boxShadow: 'none',
                                                            appearance: 'none',
                                                            WebkitAppearance: 'none'
                                                        }}
                                                    >
                                                        {task.time}
                                                    </button>
                                                    {hasExpandableContent && (
                                                        effectiveExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                                                    )}                                                </div>
                                                {!task.completed && activeTab !== 'timer' && (
                                                    <Box sx={{ position: 'relative' }} ref={bubbleRef}>
                                                        <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer transition-colors ${scheduledDateLabel ? 'text-gray-400 bg-gray-50' : 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'}`}
                                                            onClick={(e) => { e.stopPropagation(); setShowDateBubble(!showDateBubble); }}>
                                                            <CalendarIcon size={10} /> {scheduledDateLabel || "Schedule"}
                                                        </div>
                                                        {showDateBubble && (
                                                            <Paper elevation={4} sx={{ position: 'absolute', top: '100%', right: 0, zIndex: 9999, mt: 1, minWidth: '150px', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', bgcolor: 'white' }}>
                                                                <Typography sx={{ p: 1, pb: 0.5, fontSize: '9px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>{dateLabel}</Typography>
                                                                {availableDates.map((date) => (
                                                                    <Box key={date.toDateString()} onClick={(e) => { e.stopPropagation(); onScheduleTask(task, date.toDateString()); setShowDateBubble(false); }}
                                                                        sx={{ px: 1.5, py: 1, cursor: 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', '&:hover': { bgcolor: '#f5f3ff', color: '#6366f1' } }}>
                                                                        <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                                        <span style={{ opacity: 0.5 }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                    </Box>
                                                                ))}
                                                            </Paper>
                                                        )}
                                                    </Box>
                                                )}
                                            </div>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Collapse in={effectiveExpanded}>
                        <Box sx={{ pl: 4, pt: 1 }}>
                            {isEditMode ? (
                                <TextField 
                                    fullWidth multiline minRows={1} placeholder="Add a description..."
                                    variant="standard" value={descValue}
                                    onChange={e => setDescValue(e.target.value)}
                                    onBlur={() => saveChanges()}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ "& .MuiInput-root": { fontSize: '12px', color: '#4b5563' } }}
                                />
                            ) : (
                                task.description && (
                                    <Typography variant="caption" sx={{ 
                                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        color: '#4b5563', fontSize: '12px', lineHeight: 1.4 
                                    }}>
                                        {task.description}
                                    </Typography>
                                )
                            )}
                            
                            {task.aiSummary && !task.completed && (
                                <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: '#f5f3ff', border: '1px solid #e0e7ff' }}>
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Sparkles size={10} className="text-indigo-500" />
                                        <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#6366f1' }}>AI INSIGHT</Typography>
                                    </div>
                                    <Typography variant="caption" sx={{ color: '#4338ca', fontSize: '11px', display: 'block' }}>{task.aiSummary}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>
        </div>
    );
}