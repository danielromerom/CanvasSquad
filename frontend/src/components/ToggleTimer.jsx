import { useState } from "react"
import { ChevronDown, Brain, Coffee, Leaf, Check} from 'lucide-react';
import CountdownTimer from "./CountdownTimer";

export default function ToggleTimer({timerTask, taskTime, handleDragStart, toggleTaskExpansion, toggleTask, localAssignment, handleTimer, activeTab}){

    const timerSessions = ["Focus", "Long", "Short"]
    const [currentSession, setCurrentSession] = useState("Focus")
    const [isOpen, setIsOpen] = useState(false)
    const [currentLogo, setCurrentLogo] = useState(<Brain size={16} className=""/>) 
    const [sessionMinutes, setSessionMinutes] = useState(taskTime ? Number(taskTime.slice(0,-1)):25)
    
    function handleDropDown(){
        setIsOpen(isOpen => !isOpen)
    }

    function getLogo(updatedSession){
        const logo = updatedSession == "Focus" && <Brain  size={16} className=""/> || 
                     updatedSession == "Short" && <Coffee size={16} className=""/> || 
                     updatedSession == "Long" && <Leaf size={16} className=""/>
        return logo
    }

    function getSessionMinutes(updatedSession){
        updatedSession == "Focus" && setSessionMinutes(25) || updatedSession == "Long" && setSessionMinutes(15) || updatedSession == "Short" && setSessionMinutes(5)
    }

    function handleSession(index){
        const updatedSession = timerSessions.filter((session) => timerSessions.indexOf(session) == index)
        const updatedLogo = getLogo(updatedSession)
        setCurrentLogo(updatedLogo)
        setCurrentSession(updatedSession)
        handleDropDown();
        getSessionMinutes(updatedSession);
    }

    function displayDropDown(){
        return(
            <>
                <div className="z-10 flex items-center justify-evenly px-4 py-1 bg-[#F3F3F5] rounded-md mb-1 w-fit gap-1" onClick={handleDropDown}> {currentLogo} {currentSession} <ChevronDown size={16} className="pl-1"/></div> 
                <ul className=" z-10 list-none rounded-md border border-[#B2B2BB] -mb-12 bg-white p-0 m-0">
                    {timerSessions.map((session, index)=>( 
                        currentSession == session ? <li className="flex px-4 py-1 hover:bg-[#F3F3F5] rounded-md" key={session} onClick={() => handleSession(index)}> {session} <Check size={16} className="ml-6 h-auto"/></li> :
                        <li className="flex px-4 py-1 hover:bg-[#F3F3F5] rounded-md" key={session} onClick={() => handleSession(index)}> {session}</li>
                    ))}
                </ul>
            </>   
        )
    }

    return(
        <>
            <div className="flex w-full items-start mb-6 h-10">
                <div className="mr-auto">Timer</div>
                <div className="z-10 w-fit">
                    {isOpen == true ?  displayDropDown() :  <div className=" z-10 flex items-center justify-evenly px-4 py-1 bg-[#F3F3F5] rounded-md hover:bg-neutral-200 w-fit gap-1" onClick={handleDropDown}> {currentLogo} {currentSession} <ChevronDown size={16} className="pl-1"/></div>}
                </div>
            </div>      
            <div className="w-full">
                <CountdownTimer currentSession={currentSession}
                    sessionMinutes={sessionMinutes}
                    timerTask={timerTask}
                    handleDragStart={handleDragStart}
                    toggleTaskExpansion={toggleTaskExpansion}
                    toggleTask={toggleTask}
                    localAssignment={localAssignment}
                    handleTimer={handleTimer}
                    activeTab={activeTab}
                   />
            </div>    
        </>
    )
}