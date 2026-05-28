import {createContext, type ReactNode, useContext, useEffect, useRef, useState} from "react";
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
// import {Link, MemoryRouter, Route, Routes, useNavigate} from "react-router-dom";


const AppContext = createContext(null);

function send_handle(this: WebSocket, type: string, payload: object) {
    this.send(JSON.stringify({
        "type": type,
        "payload": payload,
    }))
}

type WebSocketPlus =  WebSocket & { send_handle: typeof send_handle }

export default function AppContextProvider({ children }: {children: ReactNode}) {

    const [socket, setSocket] = useState< WebSocketPlus| null>(null);
    const [user_id, setUserId] = useLocalStorage<string | null>('user_id', null);

    const navigate = useNavigate();

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
            const data = JSON.parse(event.data);
            const type = data.type;
            const payload = data.payload;
            if (type in events) {
                events[type](ws, payload);
            }
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

    async function createUser(name: string) {
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

        console.log("User created with id #" + payload.user_id)

        // setToken(token);
        // setRefreshToken(refresh_token);
        // const output = document.getElementById("test-output");
        // if (!output) {
        //     console.log("ERROR: unable to find #test-output")
        //     return;
        // }
        // output.textContent = ;
    }


    // initialization

    const hasInited = useRef(false)
    useEffect(() => {
        async function initialize() {
            if (hasInited.current) {
                return;
            }
            hasInited.current = true;
            if (user_id === null) {
                navigate('/name');
                return;
            }
            if (socket === null) {
                await connect_websocket();
            }
            return () => {};
        }
        initialize();
    }, [])

    async function lateInit(name: string) {
        await createUser(name);
        await connect_websocket();
        navigate('/home');
    }

    return (
        <AppContext.Provider value={{lateInit, sendPING}}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext);