import GridDragAndDrop, {type BlockCoords} from "../ui/GridDnd.tsx";
import "./PlacePage.css";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {useAppContext} from "../AppContext.tsx";
import type {PlacedBlock} from "../ui/GridStatic.tsx";

export default function PlacePage() {
    const navigate = useNavigate();
    const context = useAppContext();

    const [shipCells, setShipCells] = useState<string[]>([]);

    function onPlaced(coords: BlockCoords[], placed: PlacedBlock[]) {
        console.log(placed);
        context.setOwnBlocks(placed);
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

    function onFinish() {
        if (!shipCells) {
            return;
        }
        context.placeShips(shipCells)
    }

    return (
        <div>
            <h1>Rozmieść statki</h1>
            <p className={"place-helper"}>{"kliknij, aby obrócić · przeciągnij, aby umieścić \nkliknij dwukrotnie, aby usunąć umieszczony statek"}</p>
            <GridDragAndDrop onAllPlaced={onPlaced}/>
            <button className={"place-button"} onClick={onFinish}>
                Gotowe
            </button>
        </div>
    )
}