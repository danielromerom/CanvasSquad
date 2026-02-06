import "./TimerPanel.css";
import "./CountdownTimer"
import brainLogo from "../assets/brain-illustration.svg"; 
import brainBlackLogo from "../assets/brain-black.svg"; 
import trophyLogo from "../assets/trophy.svg"
import coffeeLogo from  "../assets/coffee.svg" 
import CountdownTimer from "./CountdownTimer";

export default function TimerPanel(){
    return(
        <div className="timer-panel-container">
            <button>Toggle Panels</button>
            <h4 className="pomodero-title">Pomodero Timer</h4>
            <h6 className="focused">Stay Focused</h6>

            <div className="countdown-timer-container">
                <div className="timer-toggle-container">
                    <div className="timer-title">Timer</div>
                    <div>Toggle Timer button</div>
                </div>
                <CountdownTimer />
                
            </div>

            <div className="tracker-container">

                <div className="sessions-container">
                    <div className="sessions"> <img  src={trophyLogo} className="item-image"/> Sessions</div>
                    <div>0</div>
                    <div className="today-sessions">Today</div>
                </div> 
                
                <div className="focus-container">
                    <div className="focus"> <img src={brainBlackLogo} className="item-image"/> Focus</div>
                    <div>0</div>
                    <div className="focus-minutes">Minutes</div>
                </div>
            </div>

            <div className="how-it-works-container">
                <div className="works-title">How It Works</div>
                <div className="list-container">
                    <ul>
                        <li>25 min focus session</li>
                        <li>5 min short break</li>
                        <li>15 min long break (4th)</li>
                    </ul>
                </div>
            </div>

            <div className="tips-container">
                <div className="tips">Tips</div>

                <div className="before-start-contiainer">
                    <div className="before-start-header">
                        <img  src={brainLogo} className="item-image"/>
                        <h5 className="before-starting">Before Starting</h5>
                    </div>
                    <ul>
                        <li>Choose one task</li>
                        <li>Eliminate distractions</li>
                        <li>Turn off notifications</li>
                    </ul>
                </div>

                <div className="breaks-contiainer">
                    <div className="breaks-header">
                         <img  src={coffeeLogo} className="item-image"/>
                         <h5 className="breaks">During Breaks</h5>
                    </div>
                    <ul>
                        <li>Step away from desk</li>
                        <li>Stretch or walk</li>
                        <li>Hydrate and rest eyes</li>
                    </ul>
                </div>
            </div>
        </div>
        
    )
}