import React, {useEffect, useState } from "react";
import Timer from "./Timer"
import InformationContainer from "./InformationContainer";
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import resetLogo from "../assets/reset.svg"
import ProgressBar from "./ProgressBar";
import AssignmentTask from "./AssignmentTask";

export default function CountdownTimer({currentSession, sessionMinutes, timerTask, handleDragStart, toggleTask, localAssignment, handleTimer, activeTab}){

    const getStartingMinutes = () => {
        if (currentSession === "Focus" && timerTask && timerTask.time) {
            return parseInt(timerTask.time);
        }
        return sessionMinutes;
    };

    const trueStartingMinutes = getStartingMinutes();

    const [minutes, setMinutes] = useState(trueStartingMinutes);
    const [seconds, setSeconds] = useState(0);
    const [tensSeconds, setTensSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const [isTaskExpanded, setIsTaskExpanded] = useState(false);

    const [prevTaskId, setPrevTaskId] = useState(timerTask?.id);
    const [prevSessionMin, setPrevSessionMin] = useState(sessionMinutes);

    const isNewTask = timerTask && timerTask.id !== prevTaskId;
    const isNewSessionType = sessionMinutes !== prevSessionMin;

    if (isNewTask || isNewSessionType) {
        setPrevTaskId(timerTask?.id); 
        setPrevSessionMin(sessionMinutes);
        
        setMinutes(trueStartingMinutes);
        setSeconds(0);
        setTensSeconds(0);
        setIsRunning(false);
    }

    const convertToSeconds = (minutes * 60) + (tensSeconds * 10) + seconds;
    const totalSessionSeconds = (trueStartingMinutes * 60);

    const rawProgress = totalSessionSeconds > 0 ? ((1 - (convertToSeconds / totalSessionSeconds)) * 100) : 0;
    const progress = Math.min(Math.max(rawProgress, 0), 100);

    const [focusMinutes, setFocusMinutes] = useState(()=>{
        const saved = localStorage.getItem('focusMinutes');
        return saved ? Number(JSON.parse(saved)) : 0;
    })
    const [completedSessions, setCompletedSessions] = useState(() => {
        const saved = localStorage.getItem('completedSessions');
        return saved ? Number(JSON.parse(saved)) : 0;
    })

    //Start, pause, reset functions helpers
    function startTimer(){
        if(minutes !== 0 || tensSeconds !== 0 || seconds !== 0){
            setIsRunning(true)
        }
    }

    function pauseTimer(){
        setIsRunning(false)
    }

    function resetTimer(){
        setIsRunning(false)
        setMinutes(trueStartingMinutes)
        setTensSeconds(0)
        setSeconds(0)
    }
    
    useEffect(() => {
        localStorage.setItem('focusMinutes', JSON.stringify(focusMinutes));
        localStorage.setItem('completedSessions', JSON.stringify(completedSessions));

        const updateGlobalStats = () => {
            const rawStats = localStorage.getItem('userStats');
            let stats = rawStats ? JSON.parse(rawStats) : {
                totalTasksCompleted: 0,
                currentStreak: 0,
                lastActiveDate: null,
                assignmentsCompleted: 0,
                xp: 0,
                totalFocusMinutes: 0,
                totalSessions: 0
            };

        };

      }, [focusMinutes, completedSessions]);
    

    useEffect(() => {
        let interval;

        if(isRunning){
            interval = setInterval(() =>{
                if(seconds > 0){
                    setSeconds((seconds)=> seconds-1);
                }else if(tensSeconds > 0){
                    setTensSeconds((tensSeconds) => tensSeconds-1)
                    setSeconds(9);
                }
                else{
                    if (minutes === 0) {
                        setIsRunning(false);
                        
                        const sessionMinsToAdd = parseInt(trueStartingMinutes);
                        
                        setFocusMinutes(prev => prev + sessionMinsToAdd);
                        setCompletedSessions(prev => prev + 1);

                        const rawStats = localStorage.getItem('userStats');
                        let stats = rawStats ? JSON.parse(rawStats) : {
                            totalTasksCompleted: 0,
                            currentStreak: 0,
                            lastActiveDate: null,
                            assignmentsCompleted: 0,
                            xp: 0,
                            totalFocusMinutes: 0,
                            totalSessions: 0
                        };

                        stats.totalFocusMinutes = (stats.totalFocusMinutes || 0) + sessionMinsToAdd;
                        stats.totalSessions = (stats.totalSessions || 0) + 1;
                        stats.xp = (stats.xp || 0) + (sessionMinsToAdd * 2);

                        localStorage.setItem('userStats', JSON.stringify(stats));
                    } else {
                        setMinutes((minutes) => minutes - 1);
                        setTensSeconds(5);
                        setSeconds(9);
                    }
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [seconds, minutes, tensSeconds, isRunning, trueStartingMinutes]);

    return(
        <>
            <div className="flex-col mb-6 border border-gray-200 rounded-xl p-4">
                <Timer 
                    seconds={seconds} 
                    tensSeconds={tensSeconds} 
                    minutes={minutes} 
                    currentSession={currentSession}
                /> 
                <ProgressBar progress={progress}/>

                <div className="flex items-center gap-3 justify-center">
                    {!isRunning ? (
                        
                        <button 
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex-grow justify-center" 
                            onClick={startTimer}
                        >
                            <PlayArrowOutlinedIcon size={16} fill="currentColor" /> Start
                        </button>
                    ) : (
                        <button 
                            className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-amber-600 transition-all flex-grow justify-center" 
                            onClick={pauseTimer}
                        >
                            <PauseOutlinedIcon size={16} fill="currentColor" /> Pause
                        </button>
                    )}
                        
                    <button 
                        className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-50 transition-colors" 
                        onClick={resetTimer}
                    >
                        <img src={resetLogo} alt="Reset" className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {timerTask ? <div className="mb-4"><AssignmentTask task={timerTask} isExpanded={isTaskExpanded} toggleTaskExpansion={() => setIsTaskExpanded(!isTaskExpanded)} handleDragStart={handleDragStart} toggleTask={toggleTask} localAssignment={localAssignment} handleTimer={handleTimer} activeTab={activeTab}/> </div> : null}            
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                    <InformationContainer focusMinutes={focusMinutes} completedSessions={completedSessions}/>
            </div>
        </>
    );
}