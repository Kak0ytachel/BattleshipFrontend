import { MemoryRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import './App.css'
import TornCard from "./components/ui/TornCard.tsx";
import TestPage from "./components/pages/TestPage.tsx";
import HomePage from "./components/pages/HomePage.tsx";
import MultiplayerPage from "./components/pages/MultiplayerPage.tsx";
// import OtpInput from "./components/ui/OtpInput.tsx";
import JoinPage from "./components/pages/JoinPage.tsx";
import CreatePage from "./components/pages/CreatePage.tsx";
import PlacePage from "./components/pages/PlacePage.tsx";
import WaitPage from "./components/pages/WaitPage.tsx";
import NamePage from "./components/pages/NamePage.tsx";
import GridStatic from "./components/ui/GridStatic.tsx";
// import TestComponent from "./components/ui/TestComponent.tsx";
import GamePage from "./components/pages/GamePage.tsx";
import OpponentPage from "./components/pages/OpponentPage.tsx";
import SwipeLayout from "./components/ui/SwipeLayout.tsx";
import PopupPage from "./components/pages/PopupPage.tsx";
import AppContextProvider from "./components/AppContext.tsx";

const Home = () => <h2>Home Page</h2>;
const About = () => <h2>About Page</h2>;
const Contact = () => <GridStatic/>;


function App() {


    // )

    function Navigation() {
        const navigate = useNavigate();

        return (
            <nav className="navbar">
                {/* You can use standard Links */}
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/test">Test</Link>
                <Link to="/home">home</Link>
                <Link to="/join">Join</Link>
                <Link to="/create">Create</Link>
                <br/>
                <Link to="/place">Place</Link>
                <Link to="/wait">Wait</Link>
                <Link to="/name">Name</Link>
                <Link to="/game">Game</Link>
                <Link to="/opponent">Opp</Link>
                <Link to="/popup">Popup</Link>

                {/* Or navigate programmatically via functions */}
                <button onClick={() => navigate('/contact')}>Contact</button>
            </nav>
        );
    }
    return (
        <MemoryRouter initialEntries={['/multiplayer']}>
            <AppContextProvider>
                <Navigation/>
                    {/* The router handles all the "manual" switching automatically */}
                <Routes>
                    <Route element={<SwipeLayout />}>

                        <Route path="/game" element={<GamePage/>} />
                        <Route path="/opponent" element={<OpponentPage/>} />
                    </Route>

                    <Route path="/home" element={<HomePage />}/>
                    <Route path="/multiplayer" element={<MultiplayerPage />}/>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/create" element={<CreatePage />} />
                    <Route path="/place" element={<PlacePage />} />
                    <Route path="/wait" element={<WaitPage />} />
                    <Route path="/name" element={<NamePage/>} />
                    <Route path="/popup" element={<PopupPage/>} />
                </Routes>
            </AppContextProvider>
        </MemoryRouter>
    );
}

export default App
