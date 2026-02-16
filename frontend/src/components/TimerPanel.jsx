import ToggleTimer from "./ToggleTimer"
export default function TimerPanel(){
    return(
        <div className="flex flex-col h-full px-1 bg-linear-to-br from-">
            
            <div className="mb-4 shrink-0">
                <h4 className="text-xl font-bold text-gray-900 leading-tight">Pomodoro Timer</h4>
                <h6 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stay Focused</h6>
            </div>

            <div className="flex flex-col items-center border border-gray-200 rounded-xl justify-center shadow-sm mb-4 shrink-0 p-2"> 
                <ToggleTimer />
            </div>
        </div>
    );
}