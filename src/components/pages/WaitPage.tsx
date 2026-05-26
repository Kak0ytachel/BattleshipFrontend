import anchorIcon from "/src/assets/wait-anchor.svg";
import "./WaitPage.css";

export default function WaitPage() {
    return (
        <>
            <div className={"wait-container"}>
                <h1>Czekamy na przeciwnika...</h1>
                <img className={"wait-icon"} src={anchorIcon} alt="anchor"/>
            </div>
        </>
    )
}