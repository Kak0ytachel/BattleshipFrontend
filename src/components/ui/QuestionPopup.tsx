import TornCard from "../ui/TornCard.tsx";
import {useNavigate} from "react-router-dom";
import "./QuestionPopup.css";
import {useRef, useState} from "react";

export default function QuestionPopup({show = false, text = "45.\tNauka biologiczna badająca wzajemne zależności między organizmami a środowiskiem i odwrotnie", onClick = (s: string) => {console.log(s)}}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    return (
        <div className={"popup-container" + (show? "" : " popup-disabled")}  ref={popupRef}>
            <div className={"popup-background"}></div>
            <TornCard width={350} height={450}>
                <div className={"name-card-container"}>
                    <h6 className={"popup-title"}>Podaj definicje</h6>
                    <span className={"popup-description"}>{text}</span>
                    <input className={"name-input"} type={"text"} placeholder={"Wpisz tutaj..."} ref={inputRef}/>
                    <button className={"name-button"} onClick={
                        () => {
                            onClick((inputRef.current as HTMLInputElement).value);
                            (popupRef.current as HTMLElement).classList.add("popup-disabled");
                            (inputRef.current as HTMLInputElement).value = "";
                        }
                    }>Odpowiedź</button>
                </div>
            </TornCard>
        </div>
    )
}