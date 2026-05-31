import exitIcon from "/src/assets/exit.svg";
import "./LogPage.css";
import {useAppContext} from "../AppContext.tsx";
import {useNavigate} from "react-router-dom";

function GridItem({text, time, color, index}: {text: string, time: number | string, color: string, index: number}) {

    const sep = (index !== 0)? <div className={"log-grid-separator"} key={index + "d"}/> : null;
    if (typeof time === "number") {
        const now = Number(new Date()) / 1000;
        const minutes = Math.floor((now - time) / 60);
        if (minutes < 1) {
            time = "teraz";
        } else if (minutes < 60) {
            time = minutes + " min temu";
        } else {
            const hours = Math.floor(minutes / 60);
            time = hours + " godzin temu";
        }
    }
    return <>
        {sep}
        <div className={`log-grid-dot log-dot-${color}`} key={index + "a"}></div>
        <div className={"log-grid-item"} key={index + "b"}>{text}</div>
        <span className={"log-grid-time"} key={index + "c"}>{time}</span>
    </>
}

export default function LogPage() {
    const context = useAppContext();
    const navigate = useNavigate();

    const items = [];
    for (let i = 0; i < context.logs.current.length; i++) {
        items.push(<GridItem text={context.logs.current[i].text} time={context.logs.current[i].time}
                             color={context.logs.current[i].color} index={i}/>);
    }

    return (
        <div className={"log-wrapper"}>
            <div className={"log-exit-helper"}>
                <button className={"log-exit-button"} onClick={() => navigate("/game")}>
                    <img src={exitIcon} alt={"back"}/>
                </button>
            </div>
            <div className={"log-container"}>
                <h1 className={"log-title"}>Wszystkie wydarzenia</h1>
                <div className={"log-grid"}>
                    {items}
                    {/*<GridItem text={"Pomyliles, gdy strzelales na C4"} time={"2 min temu"} color={"red"} index={3}/>*/}
                    {/*<div className={"log-grid-separator"}/>*/}
                    {/*<div className={"log-grid-dot"}/>*/}
                    {/*<div className={"log-grid-item"}>Gra zaczela</div>*/}
                    {/*<span className={"log-grid-time"}>dawno</span>*/}

                    {/*<div className={"log-grid-separator"}></div>*/}
                </div>
            </div>

        </div>
    )
}