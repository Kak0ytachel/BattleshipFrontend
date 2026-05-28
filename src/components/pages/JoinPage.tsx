import {useNavigate} from "react-router-dom";

import backIcon from "/src/assets/back-icon.svg"
// import statsIcon from "/src/assets/home-stats-icon.svg";
import "./JoinPage.css"

import "./HomePage.css"
import OtpInput from "../ui/OtpInput.tsx";
import {useAppContext} from "../AppContext.tsx";
import {useEffect, useRef} from "react";

export default function JoinPage() {
    const navigate = useNavigate();
    const context = useAppContext();
    const errRef = useRef<HTMLDivElement>(null);


    function clickCopy() {
        const element = errRef.current as HTMLElement;

        if (!element.classList.contains("create-link-copied-animated")) {
            element.classList.add("create-link-copied-animated");
        } else {
            element.classList.remove("create-link-copied-blink");
            void element.offsetWidth;
            element.classList.add("create-link-copied-blink");
        }
    }

    useEffect(() => {
        window.addEventListener('ERROR-CODE', clickCopy);

        return () => {
            window.removeEventListener('ERROR-CODE', clickCopy);
        };
    }, []);

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

                    <OtpInput onComplete={(code) => context.joinGame(code)}/>
                    <div className={"create-link-copied-container"}>
                        <div ref={errRef} className={"join-code-error"} >Błedny kod, sprobój ponownie!</div>
                    </div>

                    <div><hr className={"short-hr"}/></div>

                    <span className={"join-description"}>
                        {"Lub otworz wyslany ci \nprzez opponenta link, np. \n https://wm.chel0.dev/join/abc123"}
                    </span>


                </div>
            </div>
        </>
    )
}