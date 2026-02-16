# DnD Planetary Map Wiki

A "vibe-coded" interactive map wiki tool for managing D&D campaigns, planetary systems, and world-building projects. This application allows you to upload map images, place interactive pins, and document your world with a rich text editor.

> ✨ **Note:** This project was entirely "vibe-coded".

## Features
*   **Interactive Maps:** Drag and drop map images, pan, and zoom.
*   **Nested Locations:** Create infinite levels of sub-maps (e.g., Planet -> Continent -> City -> Building).
*   **Rich Text Editor:** Document your locations with full formatting support.
*   **Atlas View:** Navigate your world using a hierarchical tree view.
*   **Export/Import:** Backup your entire wiki to JSON or export map images as PNGs.
*   **Sound Effects:** Immersive audio feedback for interactions.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/tberasle/DnD-Planetary-Map-Wiki.git
    cd DnD-Planetary-Map-Wiki
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser to the local URL provided (usually `http://localhost:5173`).

## Usage
*   **Add Pin:** Double-click on the map.
*   **Edit Pin:** Click a pin to open the editor.
*   **Move Pin:** Drag pins while in "Edit" mode.
*   **Sub-Maps:** In the editor, drag a new map image into the "Location Map" area to create a nested level.

## License
MIT

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
