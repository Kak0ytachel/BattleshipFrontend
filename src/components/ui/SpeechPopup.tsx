import TornCard from "../ui/TornCard.tsx";
import "./QuestionPopup.css";
import {useRef, useState} from "react";
import "./SpeechPopup.css";
import topics from "/src/assets/topics.json";


export default function SpeechPopup({show = false, index = 2, self = false, onClick = (value: number) => {}}) {
    const inputRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const title= self? "Odpowiedz przeciwnikowi!" : "Oceń odpowiedź przeciwnika!"

    function getResult () {
        let value = 0;
        inputRef.current?.querySelectorAll("input[type=radio]").forEach((radio_: Element) => {
            const radio = radio_ as HTMLInputElement;
            if (radio.checked) {
                value = parseInt(radio.value);
            }
        })
        console.log(value);
        onClick(value);
    }

    const text = topics[index] || "ERROR";


    return (
        <div className={"popup-container" + (show? "" : " popup-disabled")}  ref={popupRef}>
            <div className={"popup-background"}></div>
            <TornCard width={350} height={450}>
                <div className={"name-card-container"}>
                    <h6 className={"popup-title"}>{title}</h6>
                    <span className={"popup-description"}>{text}</span>
                    <div className={"popup-answer-container"}>
                        {self? <div className={"popup-subtitle"}>Oceń swoją odpowiedź:</div> : ""}
                        <div ref={inputRef}>
                        <input className={"speech-input-radio"} type={"radio"} name={"answer"} value={"1"}/>
                        <input className={"speech-input-radio"} type={"radio"} name={"answer"} value={"2"}/>
                        <input className={"speech-input-radio"} type={"radio"} name={"answer"} value={"3"} defaultChecked={true}/>
                        <input className={"speech-input-radio"} type={"radio"} name={"answer"} value={"4"}/>
                        <input className={"speech-input-radio"} type={"radio"} name={"answer"} value={"5"}/>
                        </div>
                        {/*<div className={"popup-answer"}> {12334}</div>*/}
                    </div>
                    {/*<div className={"popup-answer-container"}>*/}
                    {/*    <div className={"popup-subtitle"}>Twoja odpowiedz:</div>*/}
                    {/*    <div className={"popup-answer"}> {435346}</div>*/}
                    {/*</div>*/}

                    <button className={"name-button"} onClick={
                        () => { getResult();

                        }
                    }>Zagłosować</button>
                </div>
            </TornCard>
        </div>
    )
}