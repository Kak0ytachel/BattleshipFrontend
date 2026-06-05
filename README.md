
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

## Video demo

## Installation

## Contributors

Many thanks to:
- [Vilena Shastak](https://linkedin.com/in/vilena-shastak) for the awesome [design project](https://github.com/Kak0ytachel/BattleshipFrontend#design-project)
- Yanina Maseichuk for the great questions in polish: 80 vocabulary questions and 11 communication topics


<br>

<br>

<br>
<br>
<br>
<br>
<br>
<br>







This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
