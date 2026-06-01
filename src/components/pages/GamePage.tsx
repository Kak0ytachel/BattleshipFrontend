import './GamePage.css';
import {type JSX, useEffect, useState} from "react";
import GridStatic from "../ui/GridStatic.tsx";
import TornCard from "../ui/TornCard.tsx";
import {type LastShot, type LogItem, useAppContext} from "../AppContext.tsx";
import QuestionPopup from "../ui/QuestionPopup.tsx";
import {cellLabel} from "../ui/GridDnd.tsx";
import AnswerPopup from "../ui/AnswerPopup.tsx";
import {useNavigate} from "react-router-dom";

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

function LogCard() {
    const navigate = useNavigate();
    const context = useAppContext();

    const messages: LogItem[] = [...context.logs.current];
    while (messages.length < 2) {
        messages.push({type: "HELP", color: "gray", text: "Kliknij tutaj, aby otworzyć", time: 0});
    }

    // const maxLength = 50;
    // function cutText(text: string) {
    //     text.slice(0, 100);
    // }

    return (
        <div className={"game-card-wrapper"} onClick={() => navigate("/log")}>
            <TornCard width={350}>
                <div className={"game-notification-card"}>
                    <div className={"game-notification-message"}>
                        <span className={`game-notification-dot game-notification-dot-${messages[0].color}`}/>
                        {messages[0].text}

                    </div>
                    <hr className={"very-short-hr"}/>
                    <div className={"game-notification-message"}>
                        <span className={`game-notification-dot game-notification-dot-${messages[1].color}`}/>
                        {messages[1].text}
                    </div>
                </div>
            </TornCard>
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
    const [showAnswerPopup, setShowAnswerPopup] = useState(false);

    const navigate = useNavigate();

    function showQuestion() {
        const qn = context.getQuestion();
        setQuestionNumber(qn);
        setShowQuestionPopup(true);
    }

    function answerQuestion(ans: string) {
        setShowQuestionPopup(false);
        console.log(ans);
        context.handleAnswer(questionNumber, ans); // delete the question being answered from the queue TODO move to after answering
    }

    function shoot(e: MouseEvent, col: number, row: number) {
        console.log(col, row, cellLabel(col, row))
        if (!context.myTurn.current) {
            context.setSnackbarText("Nie twoja kolej!");
            context.setShowSnackbar(true);
            console.log("not my turn");
            return;
        }
        if (context.answers.length <= 0) {
            context.setSnackbarText("Nie masz strzałów!");
            context.setShowSnackbar(true);
            console.log("no answers");
            return;
        }
        context.sendShoot(col, row)
    }

    function showAnswer() {
        // console.log("show answer");
        // console.log("self last shot", lastShot);
        // console.log("context last shot", context.lastShot.current);
        setShowAnswerPopup(true);
    }

    // useEffect(() => {
    //     console.log("last shot", context.lastShot);
    //     if (context.lastShot != undefined) {
    //         showAnswer();
    //     }
    // }, [context.lastShot])

    useEffect(() => {
        window.addEventListener('SHOW-ANSWER', showAnswer);

        return () => {
            window.removeEventListener('SHOW-ANSWER', showAnswer);
        };
    }, []);

    return (
        <div className={"game-container"}>
            <div>
                <h3 className={"game-title"}>Pole przeciwnika</h3>
                <h6 className={"game-subtitle"}>{context.myTurn.current? "Twoja kolej!" : "Kolej przeciwnika..."}</h6>
            </div>
            <div className={"game-indicators"}>
                <Timer initialTime={60} onFinish={() => console.log('Time is up!')}/>
                <Bullets count={Math.min(5, context.answers.length)}/>
            </div>

            <GridStatic gridData={context.opponentGrid} turn={context.myTurn.current} onShoot={shoot} blocks={context.opponentPlacedBlocks.current}/>
            <LogCard/>
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
            <QuestionPopup show={showQuestionPopup} index={questionNumber} onClick={answerQuestion}/>
            <AnswerPopup show={showAnswerPopup}
                         answer={context.lastShot.current?.answer} correct={context.lastShot.current?.correct}
                         index={context.lastShot.current?.questionIndex}
            onClick={() => setShowAnswerPopup(false)}/>
        </div>
    )

}