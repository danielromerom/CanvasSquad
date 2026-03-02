
import { Brain } from "lucide-react";
import coffeeLogo from  "../assets/coffee.svg" 
import FocusContainer from "./FocusContainer";
import SessionContainer from "./SessionContainer"

export default function InformationContainer({focusMinutes, completedSessions}){
    return(
   <>
   <div className="flex gap-3">
        <SessionContainer completedSessions={completedSessions}/>

        <FocusContainer focusMinutes={focusMinutes}/>
                    
    </div>

    <div className="bg-[#F6F4FF] border border-[#C6D2FF] rounded-xl p-3">
        <div className="font-bold text-xs h-[30px] flex items-center">How It Works</div>
        <ul className="text-[11px] text-indigo-900/80 space-y-1 list-disc pl-4 font-medium">
            <li>25 min focus session</li>
            <li>5 min short break</li>
            <li>15 min long break (4th)</li>
        </ul>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wide">Tips</div>

        <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
                <Brain size={14} className="text-[#2C7EFF]" />
                <h5 className="text-[11px] font-bold text-gray-700 m-0">Before Starting</h5>
            </div>
            <ul className="text-[11px] text-gray-500 space-y-0.5 list-disc pl-4 m-0">
                <li>Choose one task</li>
                <li>Eliminate distractions</li>
                <li>Turn off notifications</li>
            </ul>
        </div>

        <div>
            <div className="flex items-center gap-1.5 mb-1">
                <img src={coffeeLogo} className="w-4 h-auto" alt="coffee"/>
                <h5 className="text-[11px] font-bold text-gray-700 m-0">During Breaks</h5>
            </div>
            <ul className="text-[11px] text-gray-500 space-y-0.5 list-disc pl-4 m-0">
                <li>Step away from desk</li>
                <li>Stretch or walk</li>
                <li>Hydrate and rest eyes</li>
            </ul>
        </div>
    </div>
   </>
   )
}