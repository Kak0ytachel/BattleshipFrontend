import victory_icon from "/src/assets/victory.svg";
import defeat_icon from "/src/assets/defeat.svg";
import {type EndGameStats, useAppContext} from "../AppContext.tsx";
import "./EndGamePage.css";
import {useNavigate} from "react-router-dom";
import GridStatic from "../ui/GridStatic.tsx";

export default function EndGamePage() {
    const navigate = useNavigate();
    const context = useAppContext();
    const isVictory = context.victory.current;


    const correct: number = context.endGameStats.current?.correct_answers || 1;
    const wrong: number = context.endGameStats.current?.wrong_answers || 1;
    const percentage = Math.floor((correct / (correct + wrong)) * 100);
    const bombs: number = context.endGameStats.current?.bombs_placed || 0;

    function clickLeave() {
        const victoryRef = context.victory
        victoryRef.current = null;
        navigate("/home");
    }
    return (
        <div className={"endgame-container"}>
            <h1>{isVictory? "Zwycięstwo!": "Porażka"}</h1>
            <img src={isVictory? victory_icon : defeat_icon} alt={isVictory? "victory": "defeat"}/>
            <h3>{isVictory? "Wspaniała praca!": "Następnym razem się uda!"}</h3>
            <div>


            <h3>Statystyka</h3>
            <div className={"endgame-grid"}>
                {/*<GridItem text={"Pomyliles, gdy strzelales na C4"} time={"2 min temu"} color={"red"} index={3}/>*/}
                <div className={"log-grid-item"}>Poprwanych odpowiedzi</div>
                <span className={"endgame-grid-value"}>{correct}</span>
                <div className={"log-grid-separator"}/>
                <div className={"log-grid-item"}>Blednych odpowiedzi</div>
                <span className={"endgame-grid-value"}>{wrong}</span>

                <div className={"log-grid-separator"}></div>
                <div className={"log-grid-item"}>Procent poprwnych</div>
                <span className={"endgame-grid-value"}>{percentage}%</span>
                <div className={"log-grid-separator"}></div>
                <div className={"log-grid-item"}>Bomb zamieszczono</div>
                <span className={"endgame-grid-value"}>{bombs}</span>
            </div>
                <button className={"endgame-button"} onClick={() => clickLeave()}>
                    Powrót do menu
                </button>
            </div>



        </div>
    )
}
