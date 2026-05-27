import './GamePage.css';
// import {useEffect, useState} from "react";
import GridStatic from "../ui/GridStatic.tsx";
import TornCard from "../ui/TornCard.tsx";



export default function OpponentPage(){
    return (
        <div className={"game-container"}>
            <h3 className={"game-subtitle"}>Twoje pole</h3>
            <h6 className={"game-subtitle"}>Twoja kolej!</h6>
            {/*<div className={"game-indicators"}>*/}
            {/*    <Timer initialTime={10} onFinish={() => console.log('Time is up!')}/>*/}
            {/*    <Bullets/>*/}
            {/*</div>*/}

            <GridStatic active={false}/>
            <div className={"game-card-wrapper"}>
                <TornCard>
                    <div className={"game-notification-card"}>
                        <div className={"game-notification-message"}>
                            <span className={"game-notification-dot game-notification-dot-red"}/>
                            Przeciwnik trafil w twoj statek na B5!

                        </div>
                        <hr className={"very-short-hr"}/>
                        <div className={"game-notification-message"}>
                            <span className={"game-notification-dot game-notification-dot-gray"}/>
                            Pomylileś, gdy strzelales w A3!
                        </div>
                    </div>
                </TornCard>
            </div>

            <div>
                <span className={"game-notification-dot game-notification-dot-gray"}/>
                <span className={"game-notification-dot game-notification-dot-marine"}/>
            </div>


        </div>
    )

}