import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Collapse, Button } from '@mui/material';
import { ChevronDown, CheckCircle2, Circle, Sparkles, ChevronUp, RefreshCw } from 'lucide-react';

export default function AssignmentTask({task, handleDragStart, toggleTaskExpansion, toggleTask, localAssignment, handleTimer, activeTab}){
    const[isExpanded, setIsExpanded] = useState(false)

    return (
        <div>
        {task?(<>
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
                                toggleTask(null, task.id);
                                }} 
                                className="cursor-pointer mt-1"
                            >
                                {task.completed ? <CheckCircle2 size={20} className="text-green-500"/> : <Circle size={20} className="text-gray-300"/>}

                            </div>
                    <Box sx={{ flexGrow: 1 }}>
                                    
                            {/* Header Row: Label + Chevron */}
                            <div className="flex items-center justify-between">
                            <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: '#1f2937', maxWidth: "236px", wordWrap: "break-word" }}>
                                {task.label}
                            </Typography>

                            {activeTab == 'timer'? 
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" onClick={() => setIsExpanded(isExpanded => !isExpanded)}/> : <ChevronDown size={16} className="text-gray-400" onClick={() => setIsExpanded(isExpanded => !isExpanded)}/>}
                                </div>
                                :
                                <div className="flex items-center gap-2 ">
                                    <button  className="bg-blue-50 hover:bg-blue-150  text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" onClick={() => handleTimer(task)}>
                                        {task.estTime}
                                    </button>
                                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" onClick={() => setIsExpanded(isExpanded => !isExpanded)}/> : <ChevronDown size={16} className="text-gray-400" onClick={() => setIsExpanded(isExpanded => !isExpanded)}/>}
                                </div>
                            }        
                    </div>
        
                    {/* Collapsible Content */}
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
            </>):(null)}
        </div>
    );
   
}
