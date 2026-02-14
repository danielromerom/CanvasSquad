import React from "react"
import { useState } from "react"
import { ChevronDown, Brain, Coffee, Leaf} from 'lucide-react';

export default function ToggleTimer(){
    const timerSessions = ["Focus", "Short", "Long"]
    const logos = [Brain]
    const [currentSession, setCurrentSession] = useState("Focus")
    const [isOpen, setIsOpen] = useState(false)
    const [toggleDropDown, setToggleDropDown] = useState(1)
    const [currentLogo, setCurrentLogo] = useState(<div><Brain size={16} className="pr-1"/></div>)

    function handleDropDown(){
        console.log("inside handle drop down menu function")
        setToggleDropDown(toggleDropDown + 1)
        console.log("toggle dropdown value: " +  toggleDropDown)

        if(toggleDropDown % 2){
            setIsOpen(true)
        }else{
            setIsOpen(false)
        }
    }

    function getLogo(updatedSession){
        const logo = updatedSession == "Focus" && <div><Brain  size={16} className="pr-1"/></div> || 
                     updatedSession == "Short" && <div><Coffee size={16} className="pr-1"/></div> || 
                     updatedSession == "Long" && <div><Leaf size={16} className="pr-1"/></div>
        return logo
    }
    function handleSession(index){
        const updatedSession = timerSessions.filter((session) => timerSessions.indexOf(session) == index)
        const updatedLogo = getLogo(updatedSession)
        setCurrentLogo(updatedLogo)
        setCurrentSession(updatedSession)
        handleDropDown();
    }

    function displayDropDown(){
        return(
            <>
                <div className="flex items-center px-4 py-1 bg-[#F3F3F5] rounded-md mb-1" onClick={handleDropDown}> {currentLogo} {currentSession} <ChevronDown size={16} className="pl-1"/></div>
                <ul className="list-none rounded-md border border-[#B2B2BB] -mb-12 bg-white">
                    {timerSessions.map((session, index)=>(
                        <li className="flex px-4 py-1 hover:bg-[#F3F3F5] rounded-md" key={session} onClick={() => handleSession(index)}> {session}</li>
                    ))}
                </ul>
            </>
           
        )
    }
    return(
        <div>
            {isOpen == true ?  displayDropDown() :  <div className=" flex items-center px-4 py-1 bg-[#F3F3F5] rounded-md mb-1" onClick={handleDropDown}> {currentLogo}  {currentSession} <ChevronDown size={16} className="pl-1"/></div>}
        </div>
    )
}