# XO Multiplayer Game

This is a real-time multiplayer Tic-Tac-Toe (XO) game built with Node.js, Express, Socket.IO, HTML, CSS, and JavaScript. Players can create or join rooms to play against each other.

## Features

*   Real-time multiplayer gameplay
*   Create and join custom rooms
*   Win and draw detection
*   Animated win celebrations and confetti
*   Responsive design

## Technologies Used

*   **Backend:** Node.js, Express, Socket.IO
*   **Frontend:** HTML5, CSS3, JavaScript, Socket.IO (client-side)

## Setup and Installation

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd xo-multiplayer-game
    ```
    (Replace `[repository-url]` with the actual URL of your repository if applicable)

2.  **Install dependencies:**
    Navigate to the project root directory and install the Node.js dependencies:
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000` (or another port if specified in `server.js`).

## How to Play

1.  **Access the game:**
    Open your web browser and go to `http://localhost:3000`. This will take you to the `index.html` launcher page.

2.  **Launch the game:**
    Click the "Play Turn Bast" button to navigate to the `game.html` page.

3.  **Create or Join a Room:**
    *   **Create Room:** Enter a desired Room ID in the input field (optional) and click "Create Room". If no ID is provided, a random one will be generated. Share this Room ID with your opponent.
    *   **Join Room:** Enter the Room ID provided by your opponent and click "Join Room".

4.  **Gameplay:**
    *   Once two players are in a room, the game will start.
    *   Player 'X' goes first.
    *   Click on an empty cell on the board to make your move.
    *   The game will indicate whose turn it is.
    *   The first player to get three of their marks in a row (horizontally, vertically, or diagonally) wins.
    *   If all cells are filled and no player has won, the game is a draw.

5.  **Reset Game:**
    After a game ends (win or draw), you can click the "Reset Game" button to start a new round within the same room.

## Project Structure

*   `index.html`: Landing page to launch the game.
*   `game.html`: Main game interface.
*   `style.css`: Styles for both `index.html` and `game.html`.
*   `script.js`: Client-side logic for game interactions and Socket.IO communication.
*   `server.js`: Backend server logic for managing rooms, game state, and Socket.IO events.
*   `package.json`: Project dependencies and scripts.