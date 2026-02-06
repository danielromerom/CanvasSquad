import "./Timer.css"
export default function Timer({seconds, tensSeconds, minutes, changeSeconds,changeTensSeconds, changeMinutes}){
    return(
        <div className="timer-container">
            <div className="time">
                <div value={minutes} onChange={changeMinutes}>{minutes}</div>
                <div>:</div>
                <div value={tensSeconds} onChange={changeTensSeconds}>{tensSeconds}</div>
                <div value={seconds} onChange={changeSeconds}>{seconds}</div>
            </div>
            
            <div className="session-type">Focus</div>
        </div>
    )

}