import TornCard from "../ui/TornCard.tsx"
import "./NamePage.css"
import {useNavigate} from "react-router-dom";

export default function NamePage() {
    const navigate = useNavigate();
    return (
        <div className={"name-container"}>
            <h1>Bitwa morska</h1>
            <TornCard width={300} height={400}>
                <div className={"name-card-container"}>
                    <h1 className={"name-card-title"}>Witam!</h1>
                    <h3 className={"name-card-text"}>Podaj swoje imie</h3>
                        <input className={"name-input"} type={"text"} placeholder={"Wpisz tutaj..."}/>
                        <button className={"name-button"} onClick={() => navigate("/home")}>Dalej</button>
                </div>
            </TornCard>

        </div>
    )
}