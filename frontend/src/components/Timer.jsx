export default function Timer({seconds, tensSeconds, minutes, currentSession}){
    // for double digits ex 5 would be 05
    const formatTime = (val) => String(val).padStart(2, '0');

    function focusSession(){
        return(
            <div className="bg-gradient-to-br from-[#2C7EFF] to-[#4F3BF7] rounded-2xl p-6 text-black text-center shadow-lg relative overflow-hidden mb-4 -z-10">
        
            <div className="relative z-10 flex flex-col items-center">

                <div className="text-6xl font-mono font-bold tracking-widest leading-none mb-8 tabular-nums">
                        {formatTime(minutes)}:{tensSeconds}{seconds}
                </div>

                <div className="bg-white/20 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full mb-4 border border-white/10 uppercase tracking-wider w-fit">
                    {currentSession}
                </div>
            </div>
        </div>
        )
    }

    function longSession(){
        return(
             <div className="w-full bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl p-6 text-black text-center shadow-lg relative overflow-hidden mb-4 -z-10">
            
            <div className="relative z-10 flex flex-col items-center">

                <div className="text-6xl font-mono font-bold tracking-widest leading-none mb-8 tabular-nums">
                        {formatTime(minutes)}:{tensSeconds}{seconds}
                </div>

                <div className="bg-white/20 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full mb-4 border border-white/10 uppercase tracking-wider">
                    {currentSession}
                </div>
            </div>
        </div> 
        )
    }

    function shortSession(){
        return(
            <div className="w-full bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 text-black text-center shadow-lg relative overflow-hidden mb-4 -z-10">
        
            <div className="relative z-10 flex flex-col items-center">

                <div className="text-6xl font-mono font-bold tracking-widest leading-none mb-8 tabular-nums">
                        {formatTime(minutes)}:{tensSeconds}{seconds}
                </div>

                <div className="bg-white/20 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full mb-4 border border-white/10 uppercase tracking-wider">
                    {currentSession}
                </div>
            </div>
        </div>
        )
    }

    return(
        <>
         {currentSession == "Focus" && focusSession() || currentSession == "Long" && longSession() || currentSession == "Short" && shortSession()}
        </>
       
    )
}