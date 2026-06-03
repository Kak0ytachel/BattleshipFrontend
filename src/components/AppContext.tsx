import {
    createContext,
    type Dispatch,
    type ReactNode,
    type Ref,
    type RefObject, type SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {useLocalStorage} from "usehooks-ts";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import {type BlockCoords, cellLabel} from "./ui/GridDnd.tsx";
import type {PlacedBlock} from "./ui/GridStatic.tsx";
import App, {BASE_URL, BASE_URL_WS} from "../App.tsx";
// import {Link, MemoryRouter, Route, Routes, useNavigate} from "react-router-dom";

async function wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const AppContext = createContext<AppContextType | null>(null);

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
    question?: number, correct?: string, answer?: string, result?: string, cells: string[], };
export type LogItem = {type: string, text: string, color: string, time: number};
export type EndGameStats = {correct_answers: number, wrong_answers: number, bombs_placed: number}
export type StatsRow = {user_id: number, name: string, games_won: number, games_lost: number, correct_answers: number,
    wrong_answers: number, winrate?: number, correct_percentage?: number}

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


    const logs = useRef<LogItem[]>([]);
    const victory = useRef<boolean | null>(null);
    const endGameStats = useRef<EndGameStats | null>(null);

    const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
    const [snackbarText, setSnackbarText] = useState<string>("");

    const [showSpeech, setShowSpeech] = useState<boolean>(false);
    const [unusedSpeechTopics, setUnusedSpeechTopics] = useState< number[] > ([]);
    const [speechTopic, setSpeechTopic] = useState<number>(0);
    const speechGrade = useRef<number>(0);
    const [isMySpeech, setIsMySpeech] = useState<boolean>(false);
    const [isBombing, setIsBombing] = useState<boolean>(false);
    const [showActiveGamePopup, setShowActiveGamePopup] = useState<boolean>(false);
    const [stats, setStats] = useState<StatsRow[]>([]);
    const sortByGames = useRef<boolean>(true);
    const [isTerminated, setIsTerminated] = useState(false);

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
            checkGame();
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
            updateCode();
            setIsTerminated(false);
        },
        "PLACE-WAIT": async (websocket, payload) => {
            navigate('/wait');
        },
        "PLACE-DONE": async (websocket, payload) => {
            navigate('/game');
            requestQuestions();
            requestTopics();
            // eslint-disable-next-line react-hooks/purity
            logs.current = [{type: "START", text: "Zaczęto grę", color: "marine", time: Math.floor(Number(Date.now()) / 1000)}];
        },
        "QUESTIONS-SEND": async (websocket, payload) => {
            const questions = (payload as {questions: number[]}).questions;
            for (const question of questions) {
                setUnusedQuestions(x => [...x, question]);
            }
        },
        "TOPICS-SEND": async (websocket, payload) => {
            const topics = (payload as {topics: number[]}).topics;
            for (const topic of topics) {
                setUnusedSpeechTopics(x => [...x, topic]);
            }
        },
        "TURN-INFO": async (websocket, payload_) => {
            const payload = payload_ as ShotPayload;
            const user_id = userIdRef.current || userId;
            console.log(userId, userIdRef);
            const wasMyTurn = (Number(payload.current_turn) === Number(userId)); // previous
            const isMyNextTurn = (Number(payload.next_turn) === Number(userId)); // next
            console.log("current", payload.current_turn, "next", payload.next_turn, "user_id (ref)", user_id, "userId (state)", userId, "isMyNextTurn", isMyNextTurn, "wasMyTurn", wasMyTurn)
            myTurn.current = isMyNextTurn;
            if (wasMyTurn) {
                setOpponentGrid(payload.grid); // prev my turn, their grid
            } else {
                setOwnGrid(payload.grid);// prev opponent turn, my grid
            }

            if (wasMyTurn && payload.event != "BOMB") {
                const questionIndex = payload.question as number;
                const answer = payload.answer as string;
                const correct = payload.correct as string;
                lastShot.current = {questionIndex, answer, correct};
                window.dispatchEvent(new CustomEvent('SHOW-ANSWER'));
            }

            const cell = payload.cell as string;
            console.log("payload.result ", payload.result, "wasMyTurn ", wasMyTurn);
            let text = (() => {
                if (wasMyTurn) {
                    switch (payload.result) {
                        case "SUNK":
                            return `Zatopiłeś statek przeciwnika w polu ${cell}`;
                        case "HIT":
                            return `Trafiłeś w statek przeciwnika w polu ${cell}`;
                        case "EMPTY":
                            return `Nie trafiłeś w statek przeciwnika w polu ${cell}`;
                        case "MISTAKE":
                            return `Popełniłeś błąd, strzelając w pole ${cell}`;
                    }
                } else {
                    switch (payload.result) {
                        case "SUNK":
                            return `Przeciwnik zatopił twój statek w polu ${cell}`;
                        case "HIT":
                            return `Przeciwnik trafił w twój statek w polu ${cell}`;
                        case "EMPTY":
                            return `Przeciwnik nie trafił w twój statek w polu ${cell}`;
                        case "MISTAKE":
                            return `Przeciwnik popełnił błąd, strzelając w pole ${cell}`;
                    }
                }
                return "ERROR";
            }) ();
            console.log("text", text);

            let color: string;
            if (payload.result == "SUNK" || payload.result == "HIT") {
                color = (wasMyTurn)? "green" : "red";
            } else {
                color = "gray";
            }

            if (payload.event != "START" && payload.event != "BOMB") {
                logs.current = [{type: payload.event, text: text, color: color, time: Math.floor(Number(Date.now()) / 1000)}, ...logs.current];
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

            if (payload.event == "BOMB") {
                const shot_ships: string[] = [];
                const shot_empty: string[] = [];

                const grid = payload.grid;
                console.log("grid", grid);
                const cells = payload.cells;
                for (const cell of cells) {
                    console.log("cell", cell);
                    if (grid[cell].has_ship) {
                        shot_ships.push(cell);
                    }
                }
                console.log("shot_ships", shot_ships);
                console.log("shot_empty", shot_empty);

                if (wasMyTurn) {
                    if (shot_ships.length > 0) {
                        color = "green";
                        text = `Twoje bomby wybuchly na polach ${cells.join(", ")} i trafiły w statki przeciwnika`
                    } else {
                        color = "gray";
                        text = `Twoje bomby wybuchly na polach ${shot_empty.join(", ")}, ale nie trafiły w statki przeciwnika`
                    }
                } else {
                    if (shot_ships.length > 0) {
                        color = "red";
                        text = `Bomby przeciwnkia wybuchly na polach ${cells.join(", ")} i trafiły w twoje statki`
                    } else {
                        color = "gray";
                        text = `Bomby przeciwnkia wybuchly na polach ${shot_empty.join(", ")}, ale nie trafiły w twoje statki`
                    }
                }

                logs.current = [{type: payload.event, text: text, color: color, time: Math.floor(Number(Date.now()) / 1000)}, ...logs.current];
                if (shot_ships.length == 0) {
                    console.log("len 0, returning")
                    return;
                }
                for (const coordinate of shot_ships) {
                    console.log("starting for ", coordinate);
                    const base_x: number = Number(coordinate.split("")[0]); // 1-based
                    const base_y: number = Number(coordinate.charCodeAt(1) - 64); // 1-based
                    const vals_x: number[] = [base_x];
                    const vals_y: number[] = [base_y];
                    let break_flag = false;

                    for (let i = 0; i < vals_x.length && !break_flag; i++) {
                        for (let x = Math.max(1, vals_x[i] - 1); x <= Math.min(vals_x[i] + 1, 6) && !break_flag; x++) {
                            for (let y = Math.max(1, vals_y[i] - 1); y <= Math.min(vals_y[i] + 1, 6) && !break_flag; y++) {
                                if (x === vals_x[i] && y === vals_y[i]) {
                                    continue;
                                }
                                const code = `${x}${String.fromCharCode(64 + y)}`;
                                if (!grid[code]?.is_shot && grid[code].has_ship) {
                                    break_flag = true;
                                    console.log("found not shot ship at ", code, " breaking");
                                    console.log(code, grid[code]);
                                    break;
                                }
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
                    if (break_flag) {
                        console.log("breaking flag");
                        continue;
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

                    const ind = used.current?.findIndex(block => block.col == start_x - 1 && block.row == start_y - 1);
                    if (ind !== -1) {
                        console.log("found ship with index: ", ind, used.current[ind]);
                        continue;
                    }
                    console.log("adding ship")

                    const ship: PlacedBlock = {blockId: blockId, rot: rotation, col: start_x - 1, row: start_y - 1};
                    console.log(ship);
                    used.current.push(ship);
                }

            }
            // TODO: add events on turn skipping

            // TODO: add events log from event and cell
        },
        "END-GAME": async (websocket, payload) => {
            const winner_id = (payload as {winner: number, stats: Record<string, EndGameStats>}).winner;
            console.log("userIdRef.current", userIdRef.current, " userId", userId);
            const user_id = userIdRef.current || userId;
            victory.current = (winner_id == user_id);
            const allStats = (payload as {winner: number, stats: Record<string, EndGameStats>}).stats;
            endGameStats.current = allStats[String(user_id)];
            if ("terminated" in payload) {
                setIsTerminated(true);
            }
            updateCode();
            navigate('/endgame');
        },
        "REQUEST-RATE": async (websocket, payload) => {
            const topic = (payload as {topic: number}).topic;
            setSpeechTopic(topic);
            setIsMySpeech(false);
            setShowSpeech(true);
        },
        "BOMBING-READY": async (websocket, payload) => {
            myTurn.current = true;
            setIsBombing(true);
        },
        "GAME-INFO": async (websocket, payload) => {
            const game_id = (payload as {game_id: number}).game_id;
            const has_game = game_id !== -1;
            console.log("has_game", has_game, game_id);
            if (has_game) {
                setShowActiveGamePopup(true);
            }
        },
        "TERMINATE-DONE": async (websocket, payload) => {
            setSnackbarText("Zakończono grę");
            setShowSnackbar(true);
        },
        "STATS-SEND": async (websocket, payload) => {
            const current_stats = (payload as {"stats": StatsRow[]}).stats;
            for (let i = 0; i < current_stats.length; i++) {
                const won = current_stats[i].games_won;
                const lost = current_stats[i].games_lost;
                current_stats[i].winrate = (won + lost == 0)? 0: Math.floor(won / (won + lost) * 100);

                const correct = current_stats[i].correct_answers;
                const wrong = current_stats[i].wrong_answers;
                current_stats[i].correct_percentage = (correct + wrong == 0) ? 0 : Math.floor(correct / (correct + wrong) * 100);
            }
            sortStats(current_stats);

        }
    }

    function sortStats(_stats: StatsRow[] | null = null) {
        const current_stats = _stats || [...stats];
        if (sortByGames.current) {
            console.log("sort a")
            current_stats.sort((a: StatsRow, b: StatsRow) => {
                return (b.winrate || 0) - (a.winrate || 0)
                    || (b.games_won - a.games_won) || (a.games_lost - b.games_lost)}
            );
        } else {
            console.log("sort b")
            current_stats.sort((a: StatsRow, b: StatsRow) => {
                return (b.correct_percentage || 0) - (a.correct_percentage || 0)
                    || (b.correct_answers - a.correct_answers) || (a.wrong_answers - b.wrong_answers)}
            );

        }
        setStats(current_stats);
    }

    function changeSort() {
        sortByGames.current = !sortByGames.current;
        console.log(sortByGames);
        sortStats();


    }

    function endGame() {
        setShowActiveGamePopup(false);
        if (socketRef.current) {
            socketRef.current.send_handle("TERMINATE-GAME", {});
        } else {
            console.log("ERROR: no refresh token found");
        }
    }

    async function connect_websocket() {
        await check_refresh_token();
        const token = tokenManager.getToken();
        const auth_url = BASE_URL + "/websocket-auth" + (token ? `?token=${token}` : "");
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

        const ws_ = new WebSocket(BASE_URL_WS + '/websocket' + (ticket ? `?ticket=${ticket}` : ""))
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

        const refresh_url = BASE_URL + "/update-token";
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

    function checkGame() {
        if (socketRef.current) {
            socketRef.current.send_handle("CHECK-GAME", {});
        } else {
            console.log("ERROR: no socket to connect");
        }
    }

    function sendPING() {
        console.log(userId);
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
        const base_url = BASE_URL + '/create-user';
        const params = new URLSearchParams({name});
        const url = (name.length > 0)? `${base_url}?${params}` : base_url;
        const result = await fetch(url, {
            method: 'GET', // или 'POST'
            mode: 'cors',  // Явно указываем режим CORS
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }});
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
    function requestTopics() {
        if (socketRef.current) {
            socketRef.current.send_handle("TOPICS-GET", {});
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

    function showSpeechPopup() {
        if (myTurn.current) {
            if (isBombing) {
                setSnackbarText("Już umieszczaj bombę!")
                setShowSnackbar(true);
                return;
            }
            setSpeechTopic(unusedSpeechTopics[0]);
            (socketRef.current as WebSocketPlus).send_handle("REQUEST-BOMBING", {"topic": unusedSpeechTopics[0]});
            setIsMySpeech(true);
            setUnusedSpeechTopics(x => x.slice(1));
            if (unusedSpeechTopics.length <= 1) {
                requestTopics();
            }
            setShowSpeech(true);
            myTurn.current = false;
        } else {
            setSnackbarText("Nie twoja kolej!")
            setShowSnackbar(true);
        }

    }

    function sendSpeech(grade: number) {
        setShowSpeech(false);

        if (isMySpeech) {
            speechGrade.current = grade;
        } else {
            (socketRef.current as WebSocketPlus).send_handle("RATE-DONE", {"grade": grade});
        }
        // TODO
    }

    function bomb(e: MouseEvent, col: number, row: number) {
        // TODO: implement
        console.log("bomb", col, row);
        const cell = cellLabel(col, row);
        if (socketRef.current) {
            console.log("bombing: ", cell, speechGrade.current);
            socketRef.current.send_handle("BOMB", {"cell": cell, "grade": speechGrade.current});
            // speechGrade.current = 0;
            setIsMySpeech(false);
            setIsBombing(false);
        } else {
            console.log("ERROR: no socket connected");
        }
        // setIsBombing(false);
        // setIsMySpeech(false);
    }

    function getStats() {
        if (socketRef.current) {
            socketRef.current.send_handle("STATS-GET", {});
        } else {
            console.log("ERROR: no socket connected");
        }
    }



    return (
        <AppContext.Provider value={{lateInit, sendPING, ownGameCode, joinGame, setOwnBlocks, ownBlocks, placeShips,
            getQuestion, handleAnswer, myTurn, answers, ownGrid, opponentGrid, sendShoot, lastShot,
            opponentPlacedBlocks, myPlacedBlocks, victory, logs, endGameStats, showSnackbar, setShowSnackbar,
            snackbarText, setSnackbarText, showSpeechPopup, sendSpeech, showSpeech, isMySpeech, isBombing, bomb,
            speechTopic, showActiveGamePopup, endGame, getStats, stats, changeSort, isTerminated}}>
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
    victory: RefObject<boolean | null>;
    logs: RefObject<LogItem[]>;
    endGameStats: RefObject<EndGameStats | null>;
    showSnackbar: boolean
    setShowSnackbar: Dispatch<SetStateAction<boolean>>;
    snackbarText: string;
    setSnackbarText: Dispatch<SetStateAction<string>>;
    showSpeechPopup: () => void;
    sendSpeech: (grade: number) => void;
    showSpeech: boolean;
    isMySpeech: boolean;
    isBombing: boolean;
    bomb: (e: MouseEvent, col: number, row: number) => void;
    speechTopic: number;
    showActiveGamePopup: boolean;
    endGame: () => void;
    getStats: () => void;
    stats: StatsRow[];
    changeSort: () => void;
    isTerminated: boolean;
}

export function useAppContext(): AppContextType{
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }
    return (context as unknown as AppContextType);
}