import React, {useEffect, useState} from "react";
import Timer from "./Timer"
import "./CountdownTimer.css"
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import resetLogo from "../assets/reset.svg"

export default function CountdownTimer(){
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [tensSeconds, setTensSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    let initialTime = 0;

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
                    setMinutes((minutes)=> minutes-1);
                    setTensSeconds(5);
                    setSeconds(9);
                }
            }, 1000);
        }
        if(minutes === 0 && tensSeconds === 0 && seconds === 0){
            resetTimer();
        }
        return () => clearInterval(interval);
    }, [seconds, minutes, isRunning])


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

    //Handlers
    const changeSeconds =(e)=>{
        setSeconds(e.target.value)
    }

    const changeTensSeconds =(e)=>{
        setTensSeconds(e.target.value)
    }
    const changeMinutes =(e)=>{
        setMinutes(e.target.value)
    }
    
    return(
        <div className="countdown-container">
            <Timer 
            seconds={seconds}
            tensSeconds={tensSeconds} 
            minutes={minutes} 
            changeSeconds={changeSeconds}
            changeTensSeconds={changeTensSeconds} 
            changeMinutes={changeMinutes}
            />

            <div className="timer-buttons">
                {!isRunning &&
                    (<button className="play-btn" onClick={startTimer}>
                        <div className="play-icon"><PlayArrowOutlinedIcon sx={{ color: "white", fontSize: "medium" }} /></div> 
                        Start
                    </button>)}
                {isRunning &&
                (<button className="pause-btn" onClick={pauseTimer}>
                    <div className="pause-icon"><PauseOutlinedIcon sx={{ color: "white", fontSize: "medium" }} /></div>
                    Pause
                </button>)}
                <button className="reset-btn" onClick={resetTimer}>
                    <div><img  src={resetLogo} className="reset-logo"/></div>
                </button>
            </div>
        </div>
    )
}