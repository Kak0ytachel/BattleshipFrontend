import {useNavigate} from "react-router-dom";
import backIcon from "/src/assets/back-icon.svg";
import OtpOutput from "../ui/OtpOutput.tsx";
import "./CreatePage.css";
import {useAppContext} from "../AppContext.tsx";
import {type ReactNode, useRef} from "react";

export default function CreatePage() {
    const navigate = useNavigate();
    const base_link = "https://wm.chel0.dev/join/"
    const copiedRef = useRef<HTMLDivElement>(null);

    function clickCopy(e: React.MouseEvent) {
        const btn = e.target as HTMLButtonElement;
        const link = btn.textContent;
        navigator.clipboard.writeText(link);
        const element = document.getElementsByClassName("create-link-copied")[0] as HTMLElement;

        if (!element.classList.contains("create-link-copied-animated")) {
            element.classList.add("create-link-copied-animated");
        } else {
            element.classList.remove("create-link-copied-blink");
            void element.offsetWidth;
            element.classList.add("create-link-copied-blink");
        }
    }

    const context = useAppContext();
    // const code: string =

    async function clickShare(e: React.MouseEvent) {
        if (navigator.share) {
            try {
                await navigator.share({
                    // title: document.title,
                    // text: '',
                    url:  base_link + context.ownGameCode,
                });
                console.log('Successfully shared via Web Share API.');
            } catch (err) {
                console.log('The user has cancelled sharing via Web Share API or an error was raised:', err);
            }
        }
    }

    return (
        <>
            <div className="home-container">
                <div className="back-helper">
                    <button className="back-button" onClick={() => navigate('/multiplayer')}>
                        <img  src={backIcon} alt="back" />
                    </button>
                </div>
                <div className={"create-subcontainer"}>
                    <h1 style={{marginBlock: "10px"}}> Stwórz grę</h1>

                    <h3>Kod gry</h3>

                    <OtpOutput value_={context.ownGameCode || undefined} length={6}/>
                    <div><hr className={"short-hr"}/></div>

                    <span className={"join-description"}>
                        {"Lub podziel sie linkiem"}
                    </span>
                    <div className={"create-button-container"}>
                        <code onClick={clickCopy} className={"create-share-link"}>{base_link + (context.ownGameCode)}</code>
                        <div className={"create-link-copied-container"}>
                            <span className={"create-link-copied"}>Skopiowano!</span>
                        </div>
                        <button className={"create-share-button"} onClick={clickShare}>
                            Podzielić się
                        </button>
                    </div>

                </div>
            </div>
        </>
    )

}