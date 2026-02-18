import { Brain } from "lucide-react";
export default function FocusContainer({focusMinutes}){
    return(
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                <Brain size={14} className="text-gray-900" /> Focus</div>
            <div className="text-2xl font-bold text-gray-800 leading-none">{focusMinutes}</div>
            <div className="text-[9px] text-gray-400 font-medium">Minutes</div>
        </div>
    )
}