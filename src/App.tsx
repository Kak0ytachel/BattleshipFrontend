import {useEffect, useState} from 'react'
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
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
import TestComponent from "./components/ui/TestComponent.tsx";

const Home = () => <TestComponent/>;
const About = () => <h2>About Page</h2>;
const Contact = () => <GridStatic/>;

function send_handle(this: WebSocket, type: string, payload: object) {
    this.send(JSON.stringify({
        "type": type,
        "payload": payload,
    }))
}

type WebSocketPlus =  WebSocket & { send_handle: typeof send_handle }

function App() {
    const [socket, setSocket] = useState< WebSocketPlus| null>(null)
    // const [token, setToken] = useLocalStorage<string | null>('token', null);
    // const [refresh_token, setRefreshToken] = useLocalStorage<string | null>('refresh_token', null);
    const [user_id, setUserId] = useLocalStorage<string | null>('user_id', null);

    const tokenManager = {
        getToken: () => {
            return localStorage.getItem('token');
        },
        setToken: (token: string) => {
            localStorage.setItem('token', token);
        },
        getRefreshToken: () => {
            return localStorage.getItem('refresh_token');
        },
        setRefreshToken: (token: string) => {
            localStorage.setItem('refresh_token', token);
        }
    }

    const events: Record<string, (websocket: WebSocketPlus, payload: object) => void> = {
        PING: async (websocket, payload) => {
            websocket.send_handle("PONG", {});
        },
        "JOIN-CODE": async (websocket, payload) => {
            console.log('event fired');
            const element: Element | null = document.getElementById("show-join-code");
            if (!element) {
                console.log("ERROR: unable to find #show-join-code");
                return;
            }
            element.textContent = (payload as {join_code: string}).join_code;
        }
    }



    async function connect_websocket() {
        await check_refresh_token();
        const token = tokenManager.getToken();
        const auth_url = "http://localhost:3000/websocket-auth" + (token ? `?token=${token}` : "");
        const result = await fetch(auth_url, {
            headers: {Authorization: `Bearer ${token}`}
        });
        const payload = await result.json();
        console.log(payload);
        const ticket = payload.ticket;
        if (!ticket) {
            console.log("ERROR: no ticket received from server");
            return;
        }


        const ws_ = new WebSocket('ws://localhost:3000/websocket' + (ticket ? `?ticket=${ticket}` : ""))
        const ws = ws_ as WebSocket & { send_handle: typeof send_handle };
        ws.send_handle = send_handle;

        ws.onopen = (event) => {
            setSocket(ws)
        }

        ws.onmessage = (event) => {
            console.log('Message from server:', event.data)
            const test_output = document.getElementById("test-output");
            const data = JSON.parse(event.data);
            const type = data.type;
            const payload = data.payload;
            if (type in events) {
                events[type](ws, payload);
            }
            if (!test_output) {
                console.log("ERROR: unable to find #test-output")
                return;
            }
            test_output.textContent = event.data;
        }

        ws.onclose = (event) => {
            console.log('Disconnected');
        }
    }

    async function check_refresh_token() {
        if (!tokenManager.getRefreshToken()) {
            console.log("ERROR: no refresh token found");
            return;
        }
        const old_payload = jwtDecode(tokenManager.getToken() as string) as { exp: number };
        const exp = old_payload.exp;
        const now = Date.now() / 1000;
        if (exp - now > 60) {
            return;
        }

        const refresh_url = "http://localhost:3000/update-token";
        const result = await fetch(refresh_url, {
            headers: {Authorization: `Bearer ${tokenManager.getRefreshToken()}`}
        })
        const payload = await result.json();
        console.log(payload);
        if (!payload.token) {
            console.log("ERROR: no token received from server");
            return;
        }
        tokenManager.setToken(payload.token);
        tokenManager.setRefreshToken(payload.refresh_token);
        // setToken(payload.token);
        // setRefreshToken(payload.refresh_token);

    }

    function sendPING() {
        if (socket) {
            socket.send_handle("PING", {});
        }
    }

    function createGame() {
        if (socket) {
            socket.send_handle("CREATE-GAME", {});
        }
    }

    function joinGame() {
        if (socket) {
            const element = document.getElementById("join-code");
            const join_code = (element as HTMLInputElement).value;
            socket.send_handle("JOIN-GAME", {join_code: join_code});
        }
    }

    async function getQuestions() {
        if (socket) {
            socket.send_handle("QUESTIONS-GET", {});
        }
    }

    async function createUser() {
        const element = document.getElementById("name_input");
        if (!element) {
            console.log("ERROR: unable to find #name_input")
            return;
        }
        const input = element as HTMLInputElement;
        const name: string = input.value;
        const base_url = 'http://localhost:3000/create-user';
        const params = new URLSearchParams({name});
        const url = (name.length > 0)? `${base_url}?${params}` : base_url;
        const result = await fetch(url, {});
        const payload = await result.json();
        console.log(result);

        const {user_id, token, refresh_token} = payload;
        console.log(user_id, token, refresh_token);
        tokenManager.setToken(token);
        tokenManager.setRefreshToken(refresh_token);
        setUserId(user_id);
        // setToken(token);
        // setRefreshToken(refresh_token);

        const output = document.getElementById("test-output");
        if (!output) {
            console.log("ERROR: unable to find #test-output")
            return;
        }
        output.textContent = "User created with id #" + payload.user_id;


    }


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
                <Link to="/place">Place</Link>
                <Link to="/wait">Wait</Link>
                <Link to="/name">Name</Link>

                {/* Or navigate programmatically via functions */}
                <button onClick={() => navigate('/contact')}>Contact</button>
            </nav>
        );
    }
    return (
        <MemoryRouter initialEntries={['/multiplayer']}>
                <Navigation/>
                    {/* The router handles all the "manual" switching automatically */}
                <Routes>
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
                </Routes>
        </MemoryRouter>
    );
}

export default App
