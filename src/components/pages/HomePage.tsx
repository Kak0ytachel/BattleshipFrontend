import TornCard from "../ui/TornCard.tsx";
import peopleIcon from "/src/assets/home-people-icon.svg";
import botIcon from "/src/assets/home-bot-icon.svg";
import statsIcon from "/src/assets/home-stats-icon.svg";
import "./HomePage.css";
import {useNavigate} from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className={"home-subcontainer"}>
                <h1 style={{marginBlock: "10px"}}> Bitwa morska </h1>
                <button
                    // onClick={() => navigate('/contact')}
                >
                    <TornCard className="home-disabled" height={250} width={250}>
                        <h3> Z botem</h3>
                        <img src={botIcon} alt="with-bot" />
                    </TornCard>
                    <div className={"home-soon-helper"}>
                        <div className={"home-soon-container"}>
                            <span className={"home-soon"}>Wkrotce</span>
                        </div>
                    </div>

                </button>

                <button onClick={() => navigate('/multiplayer')}>
                    <TornCard height={250} width={250}>
                        <h3> Z przyjacielem</h3>
                        <img src={peopleIcon} alt="with-friend" />
                    </TornCard>
                </button>
            </div>
            <button onClick={() => navigate('/contact')}>
            <div>
                <hr/>
                <img src={statsIcon} alt="stats"/>
                <h6>Statystyka</h6>
            </div>
            </button>
        </div>
    )
}