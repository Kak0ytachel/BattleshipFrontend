import GridDragAndDrop from "../ui/GridDnd.tsx";
import "./PlacePage.css";
import {useNavigate} from "react-router-dom";

export default function PlacePage() {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Rozmieść statki</h1>
            <GridDragAndDrop/>
            <button className={"place-button"} onClick={() => navigate("/wait")}>
                Gotowe
            </button>
        </div>
    )
}