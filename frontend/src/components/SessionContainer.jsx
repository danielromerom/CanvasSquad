
import trophyLogo from "../assets/trophy.svg"
export default function SessionContainer({completedSessions}){
    return(
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                <img src={trophyLogo} className="w-4 h-auto" alt="sessions"/> Sessions
            </div>
            <div className="text-2xl font-bold text-gray-800 leading-none">{completedSessions}</div>
            <div className="text-[9px] text-gray-400 font-medium">Today</div>
        </div>
    )
}