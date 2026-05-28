import GridDragAndDrop, {type BlockCoords} from "../ui/GridDnd.tsx";
import "./PlacePage.css";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {useAppContext} from "../AppContext.tsx";

export default function PlacePage() {
    const navigate = useNavigate();
    const context = useAppContext();

    const [shipCells, setShipCells] = useState<string[]>([]);

    function onPlaced(coords: BlockCoords[]) {
        context.setOwnBlocks(coords);
        const cells: string[] = [];
        for (let i = 0; i < coords.length; i++) {
            const items = coords[i].cells;
            for (const item of items) {
                cells.push(item);
            }
        }
        console.log(cells);
        setShipCells(cells);
    }

    return (
        <div>
            <h1>Rozmieść statki</h1>
            <GridDragAndDrop onAllPlaced={(coords) => onPlaced(coords)}/>
            <button className={"place-button"} onClick={() => context.placeShips(shipCells)}>
                Gotowe
            </button>
        </div>
    )
}