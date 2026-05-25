import {useNavigate} from "react-router-dom";
import TornCard from "../ui/TornCard.tsx";
import createIcon from "/src/assets/multiplayer-create-icon.svg";
import joinIcon from "/src/assets/multiplayer-join-icon.svg";
import backIcon from "/src/assets/back-icon.svg"
// import statsIcon from "/src/assets/home-stats-icon.svg";

import "./HomePage.css"

export default function MultiplayerPage() {
    const navigate = useNavigate();

    return (
        <>
            <div className="home-container">
                <div className="back-helper">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        <img  src={backIcon} alt="back" />
                    </button>
                </div>
                <div className={"home-subcontainer"}>

                    <h1 style={{marginBlock: "10px"}}> Wybierz przeciwnika</h1>
                    <button onClick={() => navigate('/contact')}>
                        <TornCard height={250} width={250}>
                            <h3> Stwórz grę</h3>
                            <h5>Utwórz link i zaproś przyjaciela</h5>
                            <img src={createIcon} alt="create-game" />
                        </TornCard>
                        {/*<div className={"home-soon-helper"}>*/}
                        {/*    <div className={"home-soon-container"}>*/}
                        {/*        <span className={"home-soon"}>Wkrotce</span>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                    </button>

                    <button onClick={() => navigate('/contact')}>
                        <TornCard height={250} width={250}>
                            <h3> Dołącz do gry</h3>
                            <h5>Wklej link od przyjaciela</h5>
                            <img src={joinIcon} alt="join-game" />
                        </TornCard>
                    </button>
                </div>
            </div>
        </>
    )
}