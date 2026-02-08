import "./CountdownTimer"
import trophyLogo from "../assets/trophy.svg"
import coffeeLogo from  "../assets/coffee.svg" 
import CountdownTimer from "./CountdownTimer";
import { Brain } from "lucide-react";

export default function TimerPanel(){
    return(
        <div className="flex flex-col h-full px-1">
            
            <div className="mb-4 shrink-0">
                <h4 className="text-xl font-bold text-gray-900 leading-tight">Pomodoro Timer</h4>
                <h6 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stay Focused</h6>
            </div>

            <div className="mb-4 shrink-0">
                <CountdownTimer />
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                            <img src={trophyLogo} className="w-4 h-auto" alt="sessions"/> Sessions
                        </div>
                        <div className="text-2xl font-bold text-gray-800 leading-none">0</div>
                        <div className="text-[9px] text-gray-400 font-medium">Today</div>
                    </div>
                    
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                            <Brain size={14} className="text-gray-900" /> 
                                Focus
                            </div>
                        <div className="text-2xl font-bold text-gray-800 leading-none">0</div>
                        <div className="text-[9px] text-gray-400 font-medium">Minutes</div>
                    </div>
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
            </div>
        </div>
    );
}