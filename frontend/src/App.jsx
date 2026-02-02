import React, { useState, useEffect } from 'react';
// We removed the missing svgPaths import and replaced it with Lucide icons
import { Calendar, Timer, BarChart3, Settings, ChevronRight, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider, useDrag, useDrop } from 'react-dnd';

// --- CONSTANTS ---
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'assignment'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Dummy Data for immediate visualization
  const [assignments, setAssignments] = useState([
    {
      id: '1',
      title: 'Linear Algebra Problem Set 5',
      course: 'MATH 221',
      courseColor: '#2b7fff',
      dueDate: 'Feb 2',
      totalTasks: 4,
      scheduledTasks: 0,
      tasks: [
        { id: '1-1', title: 'Review eigenvalue concepts', description: 'Go through Chapter 6 notes.', duration: 30, completed: false },
        { id: '1-2', title: 'Solve problems 1-5', description: 'Focus on characteristic polynomial.', duration: 60, completed: false },
        { id: '1-3', title: 'Solve problems 6-10', description: 'Eigenvector calculations.', duration: 60, completed: false },
        { id: '1-4', title: 'Review and check answers', description: 'Verify using solutions guide.', duration: 30, completed: false },
      ],
    },
    {
      id: '2',
      title: 'Data Structures Project',
      course: 'CS 240',
      courseColor: '#ad46ff',
      dueDate: 'Feb 5',
      totalTasks: 4,
      scheduledTasks: 0,
      tasks: [
        { id: '2-1', title: 'Design class hierarchy', duration: 45, completed: false },
        { id: '2-2', title: 'Implement BST structure', duration: 60, completed: false },
      ],
    },
    {
      id: '3',
      title: 'History Essay Draft',
      course: 'HIST 105',
      courseColor: '#00c950',
      dueDate: 'Jan 31',
      totalTasks: 4,
      scheduledTasks: 0,
      tasks: [
        { id: '3-1', title: 'Find primary sources', duration: 30, completed: false },
        { id: '3-2', title: 'Outline main arguments', duration: 45, completed: false },
      ],
    },
  ]);

  const [weeklySchedule, setWeeklySchedule] = useState({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
  });

  // --- ACTIONS ---

  const handleSync = () => {
    // This is where we will hook up the Python Backend later!
    console.log("Syncing with Canvas...");
    alert("Syncing with Canvas (Simulation)");
  };

  const toggleAssignment = (id) => {
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, expanded: !a.expanded } : a
    ));
  };

  const addTaskToDay = (task, assignmentId, day, color) => {
    const scheduledTask = {
      id: `${task.id}-${day}-${Date.now()}`,
      taskId: task.id,
      assignmentId,
      title: task.title,
      duration: task.duration,
      color,
    };

    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [...prev[day], scheduledTask],
    }));

    // Update scheduled count logic
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return { ...a, scheduledTasks: (a.scheduledTasks || 0) + 1 };
      }
      return a;
    }));
  };

  const removeTaskFromDay = (taskId, day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(t => t.id !== taskId),
    }));
  };

  const toggleTaskCompletion = (assignmentId, taskId) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId && a.tasks) {
        return {
          ...a,
          tasks: a.tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      }
      return a;
    }));
  };

  // --- RENDER ---
  return (
    <DndProvider backend={HTML5Backend}>
      <div id="timequest-root" className="flex h-screen items-start justify-end bg-transparent">
        <div 
          className="relative h-full w-[380px] border-l border-[#e5e7eb] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] flex flex-col font-sans"
          style={{ 
            backgroundImage: "linear-gradient(113.79deg, rgb(238, 242, 255) 0%, rgb(255, 255, 255) 50%, rgb(250, 245, 255) 100%)" 
          }}
        >
          {/* Header */}
          <div className="bg-[rgba(255,255,255,0.8)] border-b border-[rgba(0,0,0,0.1)] px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 
                  className="bg-clip-text text-[20px] leading-[28px] font-bold"
                  style={{
                    backgroundImage: "linear-gradient(90deg, rgb(79, 57, 246) 0%, rgb(152, 16, 250) 100%)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  TimeQuest
                </h1>
                <p className="text-[10px] text-[#4a5565] leading-[15px]">Canvas Companion</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleSync} className="p-1 hover:bg-gray-100 rounded-full" title="Sync">
                    <RefreshCw className="size-4 text-[#6a7282]" />
                 </button>
                 <Settings className="size-5 text-[#6a7282] cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-3 py-3 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 h-[32px] rounded-[10px] text-[12px] font-medium transition-all ${
                  viewMode === 'dashboard'
                    ? 'bg-gradient-to-r from-[#4f39f6] to-[#9810fa] text-white shadow-md'
                    : 'bg-white/60 text-[#6a7282] border border-[rgba(0,0,0,0.1)]'
                }`}
              >
                Main Dashboard
              </button>
              <button
                onClick={() => {
                  setViewMode('assignment');
                  if (!selectedAssignment) {
                    setSelectedAssignment(assignments[0]);
                  }
                }}
                className={`flex-1 h-[32px] rounded-[10px] text-[12px] font-medium transition-all ${
                  viewMode === 'assignment'
                    ? 'bg-gradient-to-r from-[#4f39f6] to-[#9810fa] text-white shadow-md'
                    : 'bg-white/60 text-[#6a7282] border border-[rgba(0,0,0,0.1)]'
                }`}
              >
                Assignment
              </button>
            </div>

            {/* Tab Navigation - Only show in dashboard mode */}
            {viewMode === 'dashboard' && (
              <div className="bg-[#ececf0] rounded-[14px] p-[3px] flex gap-0">
                {['schedule', 'timer', 'stats'].map(tab => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 h-[29px] rounded-[14px] transition-colors capitalize ${
                        activeTab === tab 
                        ? 'bg-white shadow-sm' 
                        : 'bg-transparent'
                    }`}
                    >
                    {tab === 'schedule' && <Calendar className="size-[14px]" />}
                    {tab === 'timer' && <Timer className="size-[14px]" />}
                    {tab === 'stats' && <BarChart3 className="size-[14px]" />}
                    <span className="text-[12px]">{tab}</span>
                    </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="px-3 flex-1 overflow-y-auto">
            {viewMode === 'dashboard' ? (
              <>
                {activeTab === 'schedule' && (
                  <ScheduleView 
                    assignments={assignments}
                    weeklySchedule={weeklySchedule}
                    onToggleAssignment={toggleAssignment}
                    onAddTaskToDay={addTaskToDay}
                    onRemoveTaskFromDay={removeTaskFromDay}
                    onToggleTaskCompletion={toggleTaskCompletion}
                    onSelectAssignment={(assignment) => {
                      setSelectedAssignment(assignment);
                      setViewMode('assignment');
                    }}
                  />
                )}
                {activeTab === 'timer' && <TimerView />}
                {activeTab === 'stats' && <StatsView />}
              </>
            ) : (
              <AssignmentDetailView
                assignment={selectedAssignment}
                assignments={assignments}
                onSelectAssignment={setSelectedAssignment}
                onToggleTaskCompletion={toggleTaskCompletion}
                onAddTaskToDay={addTaskToDay}
                onRemoveTaskFromDay={removeTaskFromDay}
                weeklySchedule={weeklySchedule}
              />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

// --- SUB-COMPONENTS ---

function ScheduleView({ 
  assignments, 
  weeklySchedule,
  onToggleAssignment,
  onAddTaskToDay,
  onRemoveTaskFromDay,
  onToggleTaskCompletion,
  onSelectAssignment
}) {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Weekly Schedule Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] text-[#0a0a0a]">Weekly Schedule</h2>
          <button className="bg-[#030213] text-white text-[12px] px-3 h-[24px] rounded-[8px] flex items-center gap-1">
            <Wand2 className="size-3" />
            Auto
          </button>
        </div>
        <p className="text-[10px] text-[#4a5565] mb-2">Drag tasks to days, click to remove</p>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(day => (
            <DroppableDay
              key={day}
              day={day}
              tasks={weeklySchedule[day]}
              onDrop={(item) => onAddTaskToDay(item.task, item.assignmentId, day, item.color)}
              onRemove={(taskId) => onRemoveTaskFromDay(taskId, day)}
            />
          ))}
        </div>
      </div>

      {/* Assignments Section */}
      <div>
        <h3 className="text-[12px] text-[#0a0a0a] mb-2">Assignments</h3>
        <div className="flex flex-col gap-2">
          {assignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onToggle={() => onToggleAssignment(assignment.id)}
              onAddTaskToDay={onAddTaskToDay}
              onRemoveTaskFromDay={onRemoveTaskFromDay}
              onToggleTaskCompletion={onToggleTaskCompletion}
              onSelectAssignment={onSelectAssignment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DroppableDay({ day, tasks, onDrop, onRemove }) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className="bg-[rgba(249,250,251,0.5)] border border-[rgba(0,0,0,0.1)] rounded-[4px] p-2 min-h-[80px]"
      style={{ backgroundColor: isOver ? '#f0f9ff' : 'rgba(249,250,251,0.5)' }}
    >
      <p className="text-[10px] text-[#364153] mb-1">{day}</p>
      <div className="flex flex-col gap-1">
        {tasks?.map(task => (
          <div
            key={task.id}
            className="text-[8px] text-white px-1 py-0.5 rounded cursor-pointer hover:opacity-80"
            style={{ backgroundColor: task.color }}
            onClick={() => onRemove(task.taskId)}
          >
            {task.duration}m
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentCard({ assignment, onToggle, onToggleTaskCompletion, onSelectAssignment }) {
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px] p-2">
      <div 
        className="flex items-start gap-2 cursor-pointer"
        onClick={onToggle}
      >
        <ChevronRight 
          className={`size-3 mt-0.5 text-[#6a7282] transition-transform ${
            assignment.expanded ? 'rotate-90' : ''
          }`}
        />
        <div 
          className="w-0.5 h-8 rounded"
          style={{ backgroundColor: assignment.courseColor }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] text-[#0a0a0a] leading-tight mb-0.5">
            {assignment.title}
          </h4>
          <p className="text-[9px] text-[#4a5565] mb-1">{assignment.course}</p>
          <div className="flex items-center gap-2 text-[9px] text-[#6a7282]">
            <span>Due: {assignment.dueDate}</span>
            <span>{assignment.scheduledTasks}/{assignment.totalTasks} scheduled</span>
          </div>
        </div>
      </div>

      {/* Expanded Task List */}
      {assignment.expanded && assignment.tasks && (
        <div className="mt-3 ml-5 flex flex-col gap-2">
          {assignment.tasks.map(task => (
            <DraggableTask
              key={task.id}
              task={task}
              assignmentId={assignment.id}
              color={assignment.courseColor}
              onToggleCompletion={() => onToggleTaskCompletion(assignment.id, task.id)}
              onSelectAssignment={() => onSelectAssignment(assignment)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableTask({ task, assignmentId, color, onToggleCompletion }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { task, assignmentId, color },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="flex items-center gap-2 text-[10px] p-2 bg-[#f9fafb] rounded border border-[rgba(0,0,0,0.05)] cursor-move"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        className="size-3 cursor-pointer"
        onChange={(e) => {
          e.stopPropagation();
          onToggleCompletion();
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="flex-1">{task.title}</span>
      <span className="text-[#6a7282]">{task.duration}m</span>
    </div>
  );
}

function TimerView() {
    // Simplified Timer View for the Dashboard Tab
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Timer className="size-12 text-blue-500 mb-4" />
            <h3 className="text-gray-900 font-bold mb-2">Focus Mode</h3>
            <p className="text-xs text-gray-500">Select a specific task in the "Assignment" tab to start a focused timer.</p>
        </div>
    )
}

function StatsView() {
  const [focusMinutes] = useState(142);
  const [tasksDone] = useState(28);
  const [currentStreak] = useState(7);
  const [totalAssignments] = useState(12);
  const [level] = useState(12);
  const [currentXP] = useState(1250);
  const [nextLevelXP] = useState(1500);

  return (
    <div className="flex flex-col pb-4">
      {/* Achievement Card */}
      <div 
        className="rounded-[16px] p-6 mb-4"
        style={{
          background: 'linear-gradient(135deg, #4f39f6 0%, #9810fa 100%)',
        }}
      >
        <div className="flex flex-col items-center text-white">
          <div className="size-[80px] rounded-[16px] bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-3 shadow-lg">
            <Sparkles className="size-10" />
          </div>
          <h2 className="text-[18px] font-semibold mb-1">Productivity Wizard</h2>
          <p className="text-[11px] text-white/80 mb-3">Level {level} • Top 5%</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-2 rounded-full"
              style={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-white/70">
            {currentXP} / {nextLevelXP} XP to next level
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Focus Minutes */}
        <div className="bg-white rounded-[12px] p-4 border border-[rgba(0,0,0,0.05)]">
          <div className="size-8 rounded-full bg-[#eff6ff] flex items-center justify-center mb-2">
            <Timer className="size-4 text-[#4f39f6]" />
          </div>
          <div className="text-[24px] font-semibold">{focusMinutes}</div>
          <div className="text-[11px] text-[#6a7282]">FOCUS MINS</div>
        </div>

        {/* Tasks Done */}
        <div className="bg-white rounded-[12px] p-4 border border-[rgba(0,0,0,0.05)]">
          <div className="size-8 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-2">
            <Settings className="size-4 text-[#00c950]" />
          </div>
          <div className="text-[24px] font-semibold">{tasksDone}</div>
          <div className="text-[11px] text-[#6a7282]">TASKS DONE</div>
        </div>
      </div>
    </div>
  );
}

function AssignmentDetailView({ assignment, weeklySchedule, onSelectAssignment, onToggleTaskCompletion }) {
    // Placeholder to keep the file size manageable. 
    // This allows you to verify the dashboard first.
  if (!assignment) return null;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <button onClick={() => onSelectAssignment(null)} className="text-xs text-blue-500 mb-2">
        ← Back to Dashboard
      </button>
      
      <div className="rounded-[16px] p-4" style={{ background: `linear-gradient(135deg, ${assignment.courseColor}dd 0%, ${assignment.courseColor} 100%)` }}>
        <h2 className="text-[18px] font-semibold text-white mb-1">{assignment.title}</h2>
        <p className="text-white/80 text-xs">{assignment.course}</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
         <h3 className="font-bold text-sm mb-3">Tasks</h3>
         <div className="flex flex-col gap-2">
            {assignment.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                    <input type="checkbox" checked={task.completed} onChange={() => onToggleTaskCompletion(assignment.id, task.id)} />
                    <span className={task.completed ? "line-through text-gray-400" : ""}>{task.title}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}