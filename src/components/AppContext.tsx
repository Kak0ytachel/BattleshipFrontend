import {createContext, type ReactNode, useContext, useEffect, useRef, useState} from "react";
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import type {BlockCoords} from "./ui/GridDnd.tsx";
import type {PlacedBlock} from "./ui/GridStatic.tsx";
// import {Link, MemoryRouter, Route, Routes, useNavigate} from "react-router-dom";


async function wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const AppContext = createContext(null);

function send_handle(this: WebSocket, type: string, payload: object) {
    this.send(JSON.stringify({
        "type": type,
        "payload": payload,
    }))
}

type Answer = {
    questionNumber: number;
    answer: string;
}

function empty_grid(): Grid {
    const grid: {[index: string]: {"is_shot": boolean, "has_ship": boolean, "attempted": boolean}} = {};
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            const name: string =`${i + 1}${String.fromCharCode(65 + j)}`;
            grid[name] = {"is_shot": false, "has_ship": false, "attempted": false};
        }
    }
    return grid;
}

type WebSocketPlus =  WebSocket & { send_handle: typeof send_handle }
type Grid = {[key: string]: {is_shot: boolean, has_ship: boolean, attempted: boolean}}

export default function AppContextProvider({ children }: {children: ReactNode}) {

    const socketRef = useRef<WebSocketPlus| null>(null);
    const userIdRef = useRef<number | null>(null);

    const [userId, setUserId] = useLocalStorage<string | null>('user_id', null);
    const [ownGameCode, setOwnGameCode] = useLocalStorage<string>('join_game_code', "ERROR!");
    const [ownBlocks, setOwnBlocks] = useState<PlacedBlock[] | null>(null);
    const [unusedQuestions, setUnusedQuestions] = useState<number[]>([]);
    const [answers, setAnswers] = useState< Answer[] >([]);

    const [ownGrid, setOwnGrid] = useState<Grid>(empty_grid);
    const [opponentGrid, setOpponentGrid] = useState<Grid>(empty_grid);
    const [myTurn, setMyTurn] = useState<boolean>(false); // next turn

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
            console.log("ping ws ", socketRef.current)
        },
        "HELLO": async (websocket, payload) => {
            await wait(1000);
            updateCode();
        },
        "JOIN-CODE": async (websocket, payload) => {
            // console.log('event fired');
            const code = (payload as {join_code: string}).join_code;
            console.log("JOIN CODE: " + code);
            setOwnGameCode(code);
        },
        "ERROR-CODE": async (websocket, payload) => {
            const wsEvent = new CustomEvent('ERROR-CODE');
            window.dispatchEvent(wsEvent);
        },
        "START-GAME": async (websocket, payload) => {
            navigate('/place');
        },
        "PLACE-WAIT": async (websocket, payload) => {
            navigate('/wait');
        },
        "PLACE-DONE": async (websocket, payload) => {
            navigate('/game');
            requestQuestions();
        },
        "QUESTIONS-SEND": async (websocket, payload) => {
            const questions = (payload as {questions: number[]}).questions;
            for (const question of questions) {
                setUnusedQuestions(x => [...x, question]);
            }
        },
        "TURN-INFO": async (websocket, payload_) => {
            const payload = payload_ as {current_turn: number, "next_turn": number, "grid": Grid, "event": string, "cell": string};
            const user_id = userIdRef.current;
            const wasMyTurn = (Number(payload.current_turn) === Number(user_id)); // previous
            const isMyNextTurn = (Number(payload.next_turn) === Number(user_id)); // next
            console.log("current", payload.current_turn, "next", payload.next_turn, "user_id", user_id, "isMyNextTurn", isMyNextTurn, "wasMyTurn", wasMyTurn)
            setMyTurn(isMyNextTurn);
            if (wasMyTurn) {
                setOpponentGrid(payload.grid); // prev my turn, their grid
            } else {
                setOwnGrid(payload.grid); // prev opponent turn, my grid
            }

            // TODO: add events log from event and cell
        },
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
            socketRef.current = ws;
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
        if (socketRef.current) {
            socketRef.current.send_handle("PING", {});
        } else {
            console.log("ERROR: no socket connected");
        }
    }

    function updateCode() {
        if (socketRef.current) {
            socketRef.current.send_handle("CREATE-GAME", {});
        } else {
            console.log("ERROR: no socket connected");
        }
    }

    function joinGame(code: string) {
        if (socketRef.current) {
            // const element = document.getElementById("join-code");
            // const join_code = (element as HTMLInputElement).value;
            socketRef.current.send_handle("JOIN-GAME", {join_code: code});
        } else {
            console.log("ERROR: no socket connected");
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
        userIdRef.current = user_id;

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
            if (userId === null) {
                navigate('/name');
                return;
            }
            if (socketRef.current === null) {
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

    function placeShips(cells: string[]) {
        if (socketRef.current) {
            socketRef.current.send_handle("PLACE-SHIPS", {coordinates: cells});
        } else {
            console.log("ERROR: no socket connected");
        }
    }

    function requestQuestions() {
        if (socketRef.current) {
            socketRef.current.send_handle("QUESTIONS-GET", {});
        } else {
            console.log("ERROR: no socket connected");
        }
    }

    function getQuestion(): number {
        console.log("unused questions: ", unusedQuestions);
        const q = unusedQuestions[0];
        setUnusedQuestions(x => x.slice(1));
        if (unusedQuestions.length <= 1) {
            requestQuestions();
        }
        return q;
    }

    function handleAnswer(question: number, answer: string) {
        setAnswers(x => [...x, {questionNumber: question, answer: answer}]);
        console.log("answers (prev): ", answers);
    }


    return (
        <AppContext.Provider value={{lateInit, sendPING, ownGameCode, joinGame, setOwnBlocks, ownBlocks, placeShips, getQuestion, handleAnswer, myTurn, answers, ownGrid, opponentGrid}}>
            {children}
        </AppContext.Provider>
    )
}

interface AppContextType {
    lateInit: (name: string) => Promise<void>;
    sendPING: () => void;
    ownGameCode: string | null;
    joinGame: (code: string) => void;
    setOwnBlocks: (blocks: PlacedBlock[] | null) => void;
    ownBlocks: PlacedBlock[] | null;
    placeShips: (cells: string[]) => void;
    getQuestion: () => number;
    handleAnswer: (question: number, answer: string) => void;
    myTurn: boolean;
    answers: Answer[];
    ownGrid: Grid;
    opponentGrid: Grid;
}

export function useAppContext(): AppContextType{
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }
    return (context as unknown as AppContextType);
}