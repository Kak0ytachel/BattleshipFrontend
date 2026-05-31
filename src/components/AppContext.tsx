import {createContext, type ReactNode, type Ref, type RefObject, useContext, useEffect, useRef, useState} from "react";
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import {type BlockCoords, cellLabel} from "./ui/GridDnd.tsx";
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
export type LastShot = {questionIndex: number, answer: string, correct: string}
type ShotPayload = {current_turn: number, next_turn: number, grid: Grid, event: string, cell: string,
    question?: number, correct?: string, answer?: string, result?: string}

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
    const myTurn = useRef<boolean>(false); // next turn
    const lastShot = useRef<LastShot | null>(null);
    const myPlacedBlocks = useRef<PlacedBlock[]>([]);
    const opponentPlacedBlocks = useRef<PlacedBlock[]>([]);

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
            const payload = payload_ as ShotPayload;
            const user_id = userIdRef.current;
            const wasMyTurn = (Number(payload.current_turn) === Number(user_id)); // previous
            const isMyNextTurn = (Number(payload.next_turn) === Number(user_id)); // next
            console.log("current", payload.current_turn, "next", payload.next_turn, "user_id", user_id, "isMyNextTurn", isMyNextTurn, "wasMyTurn", wasMyTurn)
            myTurn.current = isMyNextTurn;
            if (wasMyTurn) {
                setOpponentGrid(payload.grid); // prev my turn, their grid

                const questionIndex = payload.question as number;
                const answer = payload.answer as string;
                const correct = payload.correct as string;
                lastShot.current = {questionIndex, answer, correct};
                window.dispatchEvent(new CustomEvent('SHOW-ANSWER'));
            } else {
                setOwnGrid(payload.grid);// prev opponent turn, my grid
            }

            if (payload.event == "SHOOT") {
                const result = payload.result as string;
                if (result === "SUNK") {
                    const grid = payload.grid;

                    const coordinate = payload.cell;
                    const base_x: number = Number(coordinate.split("")[0]); // 1-based
                    const base_y: number = Number(coordinate.charCodeAt(1) - 64); // 1-based
                    const vals_x: number[] = [base_x];
                    const vals_y: number[] = [base_y];

                    for (let i = 0; i < vals_x.length; i++) {
                        for (let x = Math.max(1, vals_x[i] - 1); x <= Math.min(vals_x[i] + 1, 6); x++) {
                            for (let y = Math.max(1, vals_y[i] - 1); y <= Math.min(vals_y[i] + 1, 6); y++) {
                                if (x === vals_x[i] && y === vals_y[i]) {
                                    continue;
                                }
                                const code = `${x}${String.fromCharCode(64 + y)}`;
                                if (grid[code]?.has_ship) {
                                    let has: boolean = false;
                                    for (let j = 0; j < vals_x.length; j++) {
                                        if (x === vals_x[j] && y === vals_y[j]) {
                                            has = true;
                                            break;
                                        }
                                    }
                                    if (!has) {
                                        vals_x.push(x);
                                        vals_y.push(y);
                                    }
                                    console.log("found ship at ", x, y, " code: ", code, " vals: ", vals_x, vals_y)
                                }
                            }
                        }
                    }
                    let blockId: string;
                    const num = vals_x.length;
                    const used = (wasMyTurn)? opponentPlacedBlocks : myPlacedBlocks;
                    const usedIds = used.current.map(x => x.blockId);
                    if (num === 3) {
                        blockId = "a";
                    } else if (num === 2) {
                        blockId = (usedIds.includes("b"))? "c" : "b";
                    } else {
                        if (!(usedIds.includes("d"))) {
                            blockId = "d";
                        } else if (!(usedIds.includes("e"))) {
                            blockId = "e";
                        } else {
                            blockId = "f";
                        }
                    }
                    console.log("used", usedIds, "blockId", blockId)
                    const rotation = (num == 1)? 0 : ((Math.max(...vals_x) === Math.min(...vals_x))? 1 : 0);
                    const start_x = Math.min(...vals_x);
                    const start_y = Math.min(...vals_y);


                    const ship: PlacedBlock = {blockId: blockId, rot: rotation, col: start_x - 1, row: start_y - 1};
                    used.current.push(ship);

                    console.log("SUNK", vals_x, vals_y);


                }

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

    function sendShoot(col: number, row: number) {
        // {questionIndex: number, answer: string, coordinate: string}
        const label = cellLabel(col, row);
        const answer_ = answers[0];
        setAnswers(x => x.slice(1));
        const questionIndex = answer_.questionNumber;
        const answerText = answer_.answer;

        (socketRef.current as WebSocketPlus)
            .send_handle("SHOOT", {questionIndex: questionIndex, answer: answerText, coordinate: label})
    }


    return (
        <AppContext.Provider value={{lateInit, sendPING, ownGameCode, joinGame, setOwnBlocks, ownBlocks, placeShips, getQuestion, handleAnswer, myTurn, answers, ownGrid, opponentGrid, sendShoot, lastShot, opponentPlacedBlocks, myPlacedBlocks}}>
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
    myTurn: RefObject<boolean>;
    answers: Answer[];
    ownGrid: Grid;
    opponentGrid: Grid;
    sendShoot: (col: number, row: number) => void;
    lastShot: RefObject<LastShot | null> ;
    opponentPlacedBlocks: RefObject<PlacedBlock[]>;
    myPlacedBlocks: RefObject<PlacedBlock[]>;
}

export function useAppContext(): AppContextType{
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }
    return (context as unknown as AppContextType);
}