import {useAppContext} from "../AppContext.tsx";
import SpeechPopup from "../ui/SpeechPopup.tsx";
import {useState} from "react";
import ActiveGamePopup from "../ui/ActiveGamePopup.tsx";

export default function PopupPage() {
    const context = useAppContext();
    const [show, setShow] = useState(false);

    return (
        <div className={"name-container"}>
            <h1>Bitwa morska</h1>
            <button onClick={() => setShow(true)}>show</button>
            <button onClick={() => context.setSnackbarText(x => x + "1")}>add</button>
            <ActiveGamePopup show={show} onClick={() => setShow(false)}/>
        </div>
    )
}