import './GamePage.css';
import {useEffect, useState} from "react";
import GridStatic from "../ui/GridStatic.tsx";
import TornCard from "../ui/TornCard.tsx";
import {useAppContext} from "../AppContext.tsx";
import QuestionPopup from "../ui/QuestionPopup.tsx";
import {cellLabel} from "../ui/GridDnd.tsx";

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
        elements.push(<div className={"bullet"} key={i}/>);
    }
    for (let i = count; i < 5; i++) {
        elements.push(<div className={"bullet-empty"} key={i}/>);
    }

    return (
        <div className={"bullets-container"}>
            {elements}
        </div>
    )
}

export default function GamePage(){
    const context = useAppContext();
    const [showQuestionPopup, setShowQuestionPopup] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(0);

    function showQuestion() {
        const qn = context.getQuestion();
        setQuestionNumber(qn);
        setShowQuestionPopup(true);
    }

    function answerQuestion(ans: string) {
        setShowQuestionPopup(false);
        console.log(ans);
        context.handleAnswer(questionNumber, ans);
    }

    function shoot(e: MouseEvent, col: number, row: number) {
        console.log(col, row, cellLabel(col, row))
        if (!context.myTurn) {
            console.log("not my turn");
            // TODO: add message
            return;
        }
        if (context.answers.length <= 0) {
            // TODO: add message
            console.log("no answers");
            return;
        }
        context.sendShoot(col, row)
    }

    return (
        <div className={"game-container"}>
            <div>
                <h3 className={"game-title"}>Pole przeciwnika</h3>
                <h6 className={"game-subtitle"}>{context.myTurn? "Twoja kolej!" : "Kolej przeciwnika..."}</h6>
            </div>
            <div className={"game-indicators"}>
                <Timer initialTime={60} onFinish={() => console.log('Time is up!')}/>
                <Bullets count={Math.min(5, context.answers.length)}/>
            </div>

            <GridStatic gridData={context.opponentGrid} turn={context.myTurn} onShoot={shoot}/>
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
                <button className={"game-button"} onClick={() => showQuestion()}>
                    <img src={"src/assets/game-bullet-add.svg"} alt={"add-bullet"}/>
                    {"Zgromadź\nstrzał"}
                </button>
                <button className={"game-button"} onClick={() => console.log(context.ownGrid)}>
                    <img src={"src/assets/game-place-bomb.svg"} alt={"place-bomb"}/>
                    {"Umieść\nbomby"}
                </button>
            </div>
            <div>
                <span className={"game-notification-dot game-notification-dot-marine"}/>
                <span className={"game-notification-dot game-notification-dot-gray"}/>
            </div>
            {/*TODO: replace with real question*/}
            <QuestionPopup show={showQuestionPopup} text={String(questionNumber)} onClick={answerQuestion}/>
        </div>
    )

}