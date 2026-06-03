import {type StatsRow, useAppContext} from "../AppContext.tsx";
import {useNavigate} from "react-router-dom";
import backIcon from "/src/assets/back-icon.svg";
import "./HomePage.css"
import "./StatsPage.css"
import {useEffect, useRef} from "react";

function StatsItem({data, _key}: {data: StatsRow, _key?: number}) {
    return (
        <>
            {/* data.user_id */}
            <div className={"stats-grid-cell"}>{(_key || 0) + 1}</div>
            <div className={"stats-grid-cell"}>{data.name}</div>
            <div className={"stats-grid-cell"}>{data.games_won}</div>
            <div className={"stats-grid-cell"}>{data.games_lost}</div>
            <div className={"stats-grid-cell"}>{data.winrate}%</div>
            <div className={"stats-grid-cell"}>{data.correct_answers}</div>
            <div className={"stats-grid-cell"}>{data.wrong_answers}</div>
            <div className={"stats-grid-cell"}>{data.correct_percentage}%</div>
        </>
    );


}


export default function StatsPage({}) {
    const context = useAppContext()
    const navigate = useNavigate()

    const statsRows = [];

    for (let i = 0; i < context.stats.length; i++) {
        statsRows.push(<StatsItem data={context.stats[i]} key={i} _key={i} />)
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            // context.getStats();
            showUpdate();
        }, 15 * 1000);
        console.log("stats update");

        return () => clearInterval(intervalId);
    }, [])

    useEffect(() => {
        context.getStats()
    }, [])

    const updateRef = useRef<HTMLDivElement>(null);

    function showUpdate() {
        context.getStats()
        updateRef.current?.classList.remove("stats-hidden-appear");
        void updateRef.current?.offsetWidth;
        updateRef.current?.classList.add("stats-hidden-appear");
    }

    return (
        <div className="stats-wrapper">
            <div className="stats-back-helper">
                <button className="back-button" onClick={() => navigate('/home')}>
                    <img  src={backIcon} alt="back" />
                </button>
            </div>
            <div className="stats-container">
                <h1 className={"stats-header"}> Statystyka</h1>
                <div className={"stats-button-row"}>
                    <button className={"stats-helper"} onClick={showUpdate}>Odśwież</button>
                    <button className={"stats-helper"} onClick={context.changeSort}>Sortuj</button>
                    <span ref={updateRef} className={"stats-helper stats-hidden"}>Aktualizacja...</span>
                </div>
                <div className={"stats-grid"}>
                    <div className={"stats-grid-header"}>#</div>
                    <div className={"stats-grid-header"}>Gracz</div>
                    <div className={"stats-grid-header"}>Zwycięstwa</div>
                    <div className={"stats-grid-header"}>Porażki</div>
                    <div className={"stats-grid-header"}>% Zwycięstw</div>
                    <div className={"stats-grid-header"}>Poprwane</div>
                    <div className={"stats-grid-header"}>Błędy</div>
                    <div className={"stats-grid-header"}>% Poprawnych</div>

                    {statsRows}

                </div>
            </div>
            {/*<button onClick={() => }> get stats</button>*/}
            {/*<button onClick={() => console.log(context.stats)}> show stats</button>*/}
        </div>
    );

}