import './GamePage.css';
import {useEffect, useState} from "react";
import GridStatic from "../ui/GridStatic.tsx";
import TornCard from "../ui/TornCard.tsx";

function Timer({initialTime = 90, onFinish = () => {}}) {
    const [time, setTime] = useState(initialTime);
    // const [intervalId, setIntervalId] = useState(0);


    const minutes = Math.floor(time / 60);
    const seconds = time % 60;


    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(x => Math.max(x - 1, 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => onFinish(), initialTime * 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className={"timer"}>
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </div>
    )
}

function Bullets({count = 3}) {
    const elements = [];
    for (let i = 0; i < count; i++) {
        elements.push(<div className={"bullet"}/>);
    }
    for (let i = count; i < 5; i++) {
        elements.push(<div className={"bullet-empty"}/>);
    }

    return (
        <div className={"bullets-container"}>
            {elements}
        </div>
    )
}

export default function GamePage(){
    return (
        <div className={"game-container"}>
            <h3 className={"game-subtitle"}>Pole przeciwnika</h3>
            <h6 className={"game-subtitle"}>Twoja kolej!</h6>
            <div className={"game-indicators"}>
                <Timer initialTime={10} onFinish={() => console.log('Time is up!')}/>
                <Bullets/>
            </div>

            <GridStatic/>
            <div className={"game-card-wrapper"}>
            <TornCard>
                <div className={"game-notification-card"}>
                    <div className={"game-notification-message"}>
                        <span className={"game-notification-dot game-notification-dot-red"}/>
                        Przeciwnik trafil w twoj statek na B5!

                    </div>
                    <hr className={"very-short-hr"}/>
                    <div className={"game-notification-message"}>
                        <span className={"game-notification-dot game-notification-dot-gray"}/>
                        Pomylileś, gdy strzelales w A3!
                    </div>
                </div>
            </TornCard>
            </div>
            <div className={"game-buttons-container"}>
                <button className={"game-button"}>
                    <img src={"src/assets/game-bullet-add.svg"} alt={"add-bullet"}/>
                    {"Zgromadź\nstrzał"}
                </button>
                <button className={"game-button"}>
                    <img src={"src/assets/game-place-bomb.svg"} alt={"place-bomb"}/>
                    {"Umieść\nbomby"}
                </button>
            </div>
            <div>
                <span className={"game-notification-dot game-notification-dot-marine"}/>
                <span className={"game-notification-dot game-notification-dot-gray"}/>
            </div>


        </div>
    )

}