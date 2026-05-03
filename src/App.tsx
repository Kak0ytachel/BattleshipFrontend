import {useEffect, useState} from 'react'
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
    const [count, setCount] = useState(0)
    const [socket, setSocket] = useState< WebSocket & { send_handle: typeof send_handle } | null>(null)
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

    function send_handle(this: WebSocket, type: string, payload: object) {
        this.send(JSON.stringify({
            "type": type,
            "payload": payload,
        }))
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

    return (
        <>
            <section id="center">
                <div className="hero">
                    <img src={heroImg} className="base" width="170" height="179" alt="" />
                    <img src={reactLogo} className="framework" alt="React logo" />
                    <img src={viteLogo} className="vite" alt="Vite logo" />
                </div>
                <div>
                    <h1>Get started</h1>
                    <p>
                        Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
                    </p>
                </div>
                <input type="text" id="name_input"/>
                <button
                    type="button"
                    className="counter"
                    // onClick={() => setCount((count) => count + 1)}
                    onClick={() => createUser()}
                >
                    Count is {count}
                </button>
                <button type="button" className="counter" onClick={() => connect_websocket()}>Connect WebSocket</button>
                <p id={'test-output'}></p>
            </section>

            <div className="ticks"></div>

            <section id="next-steps">
                <div id="docs">
                    <svg className="icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#documentation-icon"></use>
                    </svg>
                    <h2>Documentation</h2>
                    <p>Your questions, answered</p>
                    <ul>
                        <li>
                            <a href="https://vite.dev/" target="_blank">
                                <img className="logo" src={viteLogo} alt="" />
                                Explore Vite
                            </a>
                        </li>
                        <li>
                            <a href="https://react.dev/" target="_blank">
                                <img className="button-icon" src={reactLogo} alt="" />
                                Learn more
                            </a>
                        </li>
                    </ul>
                </div>
                <div id="social">
                    <svg className="icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#social-icon"></use>
                    </svg>
                    <h2>Connect with us</h2>
                    <p>Join the Vite community</p>
                    <ul>
                        <li>
                            <a href="https://github.com/vitejs/vite" target="_blank">
                                <svg
                                    className="button-icon"
                                    role="presentation"
                                    aria-hidden="true"
                                >
                                    <use href="/icons.svg#github-icon"></use>
                                </svg>
                                GitHub
                            </a>
                        </li>
                        <li>
                            <a href="https://chat.vite.dev/" target="_blank">
                                <svg
                                    className="button-icon"
                                    role="presentation"
                                    aria-hidden="true"
                                >
                                    <use href="/icons.svg#discord-icon"></use>
                                </svg>
                                Discord
                            </a>
                        </li>
                        <li>
                            <a href="https://x.com/vite_js" target="_blank">
                                <svg
                                    className="button-icon"
                                    role="presentation"
                                    aria-hidden="true"
                                >
                                    <use href="/icons.svg#x-icon"></use>
                                </svg>
                                X.com
                            </a>
                        </li>
                        <li>
                            <a href="https://bsky.app/profile/vite.dev" target="_blank">
                                <svg
                                    className="button-icon"
                                    role="presentation"
                                    aria-hidden="true"
                                >
                                    <use href="/icons.svg#bluesky-icon"></use>
                                </svg>
                                Bluesky
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
        </>
    )
}

export default App
