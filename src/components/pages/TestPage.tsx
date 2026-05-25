// import {Link, MemoryRouter, Route, Routes, useNavigate} from "react-router-dom";
// import reactLogo from '/src/assets/react.svg'
// import viteLogo from '/src/assets/vite.svg'
// import heroImg from '/src/assets/hero.png'

export default function TestPage() {
    return (
        <>
            <section id="center">

                <div>
                    {/*<h1>User id: #{user_id}</h1>*/}
                </div>
                <input type="text" id="name_input" placeholder="name"/>
                <button
                    type="button"
                    className="counter"
                    // onClick={() => setCount((count) => count + 1)}
                    // onClick={() => createUser()}
                >
                    {/*Count is {count}*/}
                </button>
                {/*<button type="button" className="counter" onClick={() => connect_websocket()}>Connect WebSocket</button>*/}
                {/*<button type="button" className="counter" onClick={() => sendPING()}>Send PING</button>*/}
                {/*    <p id={"test-output"}></p>*/}
                {/*<button type="button" className="counter" onClick={() => createGame()}>Send START</button>*/}
                {/*<p id="show-join-code"></p>*/}
                {/*<input type="text" id="join-code" placeholder="enter join code"/>*/}
                {/*<button type="button" className="counter" onClick={() => joinGame()}>Join game</button>*/}
                {/*<button type="button" className="counter" onClick={() => getQuestions()}>Join game</button>*/}
                <p></p>

            </section>

            <div className="ticks"></div>

            <section id="next-steps">
                <div id="docs">





                </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
        </>
  );
}
