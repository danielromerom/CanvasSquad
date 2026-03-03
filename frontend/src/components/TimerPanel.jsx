import ToggleTimer from "./ToggleTimer";
export default function TimerPanel({timerTask, handleDragStart, toggleTaskExpansion, toggleTask, localAssignment, handleTimer, activeTab}){

    return(
        <div>
            {timerTask?(
                <>
                    <div className="flex flex-col h-full px-1">
                
                        <div className="mb-4 shrink-0">
                            <h4 className="text-xl font-bold text-gray-900 leading-tight">Pomodoro Timer</h4>
                            <h6 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stay Focused</h6>
                        </div>

                        <div className="flex flex-col items-center border-2 border-gray-400 rounded-xl justify-center shadow-sm mb-4 shrink-0 p-2"> 
                            <ToggleTimer timerTask={timerTask}
                             taskTime={timerTask.time}
                              handleDragStart={handleDragStart}
                              toggleTaskExpansion={toggleTaskExpansion} 
                              toggleTask={toggleTask} 
                              localAssignment={localAssignment}
                              handleTimer={handleTimer}
                              activeTab={activeTab}
                              />
                        </div>
                    </div>
                </>
            ):(    
                <div className="flex flex-col h-full px-1">
            
                    <div className="mb-4 shrink-0">
                        <h4 className="text-xl font-bold text-gray-900 leading-tight">Pomodoro Timer</h4>
                        <h6 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stay Focused</h6>
                    </div>

                    <div className="flex flex-col items-center border-2 border-gray-400 rounded-xl justify-center shadow-sm mb-4 shrink-0 p-2"> 
                        <ToggleTimer/>
                    </div>
                </div>
                
            )}
        </div>
    );
}