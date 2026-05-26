import {useNavigate} from "react-router-dom";

import backIcon from "/src/assets/back-icon.svg"
// import statsIcon from "/src/assets/home-stats-icon.svg";
import "./JoinPage.css"

import "./HomePage.css"
import OtpInput from "../ui/OtpInput.tsx";

export default function JoinPage() {
    const navigate = useNavigate();

    return (
        <>
            <div className="home-container">
                <div className="back-helper">
                    <button className="back-button" onClick={() => navigate('/multiplayer')}>
                        <img  src={backIcon} alt="back" />
                    </button>
                </div>
                <div className={"join-subcontainer"}>
                    <h1 style={{marginBlock: "10px"}}> Dołącz do gry</h1>

                    <h3>Wpisz kod gry</h3>

                    <OtpInput onComplete={() => navigate('/contact')}/>
                    <div><hr className={"short-hr"}/></div>

                    <span className={"join-description"}>
                        {"Lub otworz wyslany ci \nprzez opponenta link, np. \n https://wm.chel0.dev/join/abc123"}
                    </span>


                </div>
            </div>
        </>
    )
}