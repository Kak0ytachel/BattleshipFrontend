import TornCard from "../ui/TornCard.tsx";
import "./QuestionPopup.css";


export default function ActiveGamePopup({show = false, onClick = () => {}}) {
    return (
        <div className={"popup-container" + (show? "" : " popup-disabled")}>
            <div className={"popup-background"}></div>
            <TornCard width={350} height={350}>
                <div className={"name-card-container"}>
                    <h6 className={"popup-title"}>Już grasz! </h6>
                    <span className={"popup-description"}>Już masz już otwartą grę! Jeśli ona jest otwarta w innej karcie przeglądarki, przejdź do niej. W przeciwnym razie kliknij tutaj, aby ją zakończyć </span>

                    <button className={"name-button"} onClick={() => { onClick()}}>Zakończ grę</button>
                </div>
            </TornCard>
        </div>
    )
}