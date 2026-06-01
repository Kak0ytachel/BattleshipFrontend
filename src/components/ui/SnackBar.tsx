import TornCard from "./TornCard.tsx";
import {useEffect, useState} from "react";
import "./SnackBar.css";

export default function SnackBar({show, text, duration, onHide = () => {}}: {show: boolean, text: string, duration: number, onHide: () => void}) {

    useEffect(() => {
        const intervalId = setInterval(() => {
            onHide();
        }, 1000 * duration);

        return () => clearInterval(intervalId);
    })

    return (
        <div className={"snackbar" + (show? " snackbar--visible": "")}>
            <TornCard>
                <span className={"snackbar-text"}>{text}</span>
            </TornCard>
        </div>

    )
}
