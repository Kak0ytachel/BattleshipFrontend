import TornCard from "../ui/TornCard.tsx"
import "./NamePage.css"
import {useNavigate} from "react-router-dom";
import {useAppContext} from "../AppContext.tsx";
import {useRef} from "react";

export default function NamePage() {
    const navigate = useNavigate();
    const context = useAppContext()
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={"name-container"}>
            <h1>Bitwa morska</h1>
            <TornCard width={300} height={350}>
                <div className={"name-card-container"}>
                    <h1 className={"name-card-title"}>Witam!</h1>
                    <h3 className={"name-card-text"}>Podaj swoje imie</h3>
                    <input className={"name-input"} type={"text"} placeholder={"Wpisz tutaj..."} ref={inputRef}/>
                    <button className={"name-button"} onClick={
                        async () =>
                            await context.lateInit((inputRef.current as HTMLInputElement).value)
                    }>Dalej</button>
                </div>
            </TornCard>

        </div>
    )
}