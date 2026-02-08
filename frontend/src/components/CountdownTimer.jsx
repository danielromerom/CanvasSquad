import React, {useEffect, useState} from "react";
import Timer from "./Timer"
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import resetLogo from "../assets/reset.svg"

export default function CountdownTimer(){
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [tensSeconds, setTensSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

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
                    } else {
                        setMinutes((minutes) => minutes - 1);
                        setTensSeconds(5);
                        setSeconds(9);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [seconds, minutes, tensSeconds, isRunning])


    //Start, pause, reset functions
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
        setMinutes(25)
        setTensSeconds(0)
        setSeconds(0)
    }
    
    return(
        <div className="flex flex-col w-full">
            <Timer 
                seconds={seconds} 
                tensSeconds={tensSeconds} 
                minutes={minutes} 
            />

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
    );
}