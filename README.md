
<img width="576" height="99" alt="Image" src="https://github.com/user-attachments/assets/52fbe599-1969-46b8-a69e-9997b5128308" />

# Battleship

"Bitwa morska" (eng. Battleship) is a Frontend Web Application for the [Battleship](https://en.wikipedia.org/wiki/Battleship_(game)) game being built with TypeScript, React & Vite


## Idea

Built as a board-like game at a polish course, as a game to revise the vocabulary before the final polish exam while competing with groupmates.


## Key differences

- Has 6 x 6 grid and less ships ( 3x1 - 1, 2x1 - 2, 1x1 - 3 )
- Has so-called bullets, required to shoot enemy's ships. To get a bullet, a player need to answer a vocabulary question. If the answer is correct, the player gets a live round, otherwise a blank one. The rounds can be stacked, and it is unknown to the player, wherher a round is a real or a blank until the shot is fired. 
- Has an addition of so-called bombs. To deploy a bomb, player needs to answer a conversational question. Then both the player and his opponent rate the speech on scale from 1 to 5, and a bomb hits several (1-5) cells within the selected 3x3 area counted as a random value between the lower and the higher grade of the speech.

## Design project

<img width="2169" height="1399" alt="Image" src="https://github.com/user-attachments/assets/ce21444d-52e7-494f-8fec-3855783e2238" />

Design in Figma was made by Vilena Shastak. Unfortunately a couple of elements were not implemented (like Reconnect or Rematch popups) due to the tight deadline, but overall over 90% of pages are there in the project.

## Technical implementation

The project implements the Client-Server architecture and consist of a separate Frontend, written with TypeScript, React and Vite (this repository), a separate Backend in TypeScript with Fastify ( [`Kak0ytachel/BattleshipFrontend`](https://github.com/Kak0ytachel/BattleshipBackend) ), that connects to a Postgress database. 

The Frontend and the Backend communicate via several REST API endpoints and a WebSocket connection.

### REST API

The REST API includes 4 endpoints:
- GET `/create-user` - takes `name` as the only query parameter, creates a user account and returns `user_id`, JWT `access_token` and `refresh_token`
- GET `/update-token` - takes 'refresh_token', returns new `access_token`, `refresh_token` along with `user_id`. 
- GET `/websocket-auth` - takes `access_token`, returns a short-term JWT `tiket` with a lifespan of 1 minute, that allows to securely connect to the websocket
- GET `/websocket` - takes `ticket` and upgrades the connection to the WebSocket protocol 

### Authorization and JWT

The project uses JSON Web Tokens to authorize users. At the moment, the project does not have a propper login / password authorization due to the lack of necessity. When first opening the page, the app shows the "enter your name" page. Then it uses the name to create an account via the corresponding endpoint. The account is tied to the browser by storing user_id and JWT tokens in browser's localStorage. An account stores only stores the active game session and some statistics, so there is no need to log in it from another device. When an account is created, the app refreshes the token if needed, generates a ticket (a short-term JWT with a lifespan of 1 minute) and uses it to connect to the WebSocket endpoint.

### WebSocket

Both the server and the client apps implement a semi-custom protocol of WebSocket. Each message consist of request type, written in all caps with "-" symbols as word separators, and a JSON-formatted string of the request payload. 

## Frontend implementation

The project implements the Client-Server architecture and consist of a separate Frontend, written with TypeScript, React and Vite (this repository), a separate Backend in TypeScript with Fastify ( [`Kak0ytachel/BattleshipFrontend`](https://github.com/Kak0ytachel/BattleshipBackend) ), that connects to a Postgress database. 

### React App

The React app is build aroung React Context (`useContext` hook), that stores all global variables (`useState`, `useRef` and `useLocalStorage` for saving intersessional data using [usehooks-ts](https://www.npmjs.com/package/usehooks-ts)) and global logic like 'useEffect' hooks, JWT token exchange, setting up WebSocket connection and handling incoming events. 

The App utilizes `MemoryRouter` from `react-router-dom`. It allows to route in-app screens without changing page's url. Each page is built as a separate react component. UI element components encapsulate own variables and logics, allowing them to me reused (like in-game timer, game grid, torn cards, etc). The app includes several popups being shown directly inside the MemoryRouter on top of any page. 

The app includes 14 pages, 11 reusable and several page-specific components. 

### Drag-and-drop

<img width="600" height="600" alt="drag-and-drop-demo" src="https://github.com/user-attachments/assets/9917e679-a0d5-4938-8193-9db56fa56938" />

The app includes drag-and-drop component for placing ships. It utilizes HTML Drag-and-drop API for object dragging and manually calculates placement position in real time, showing red/blue "ghost" (color depends on whether the ship can be placed there). It also allows ship rotation on click and returning the ship back to the container on double click. 



## Video demo

https://github.com/user-attachments/assets/1f93572a-fec3-43a9-9736-fac99d5b339c

## Installation

## Contributors

Many thanks to:
- [Vilena Shastak](https://linkedin.com/in/vilena-shastak) for the awesome [design project](https://github.com/Kak0ytachel/BattleshipFrontend#design-project)
- Yanina Maseichuk for the great questions in polish: 80 vocabulary questions and 11 communication topics


## Known issues
- HTML Drag-and-drop API does not work on iOS due to platform-specific Drag-and-drop.
- The in-game timer is not fully implemented yet and for now does not pass the turn to another player when the time is out



