document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const boardElement = document.getElementById('board');
    const messageElement = document.getElementById('message');
    const resetBtn = document.getElementById('reset');
    const roomIdInput = document.getElementById('roomIdInput');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomInfoElement = document.getElementById('roomInfo');

    let currentRoomId = null;
    let playerSymbol = null; // 'X' or 'O'
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = false;
    let isMyTurn = false;

    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // --- UI Event Listeners ---
    createRoomBtn.addEventListener('click', () => {
        const desiredRoomId = roomIdInput.value.trim();
        socket.emit('createRoom', desiredRoomId);
        messageElement.textContent = desiredRoomId ? `Attempting to create room ${desiredRoomId}...` : 'Creating random room...';
    });

    joinRoomBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            socket.emit('joinRoom', roomId);
            messageElement.textContent = `Attempting to join room ${roomId}...`;
        } else {
            messageElement.textContent = 'Please enter a Room ID.';
        }
    });

    resetBtn.addEventListener('click', () => {
        if (currentRoomId) {
            socket.emit('resetGame', currentRoomId);
        }
    });

    boardElement.addEventListener('click', (event) => {
        const cell = event.target;
        if (!cell.classList.contains('cell') || !gameActive || !isMyTurn || cell.textContent !== '') {
            return;
        }
        const index = parseInt(cell.dataset.index);
        socket.emit('makeMove', { roomId: currentRoomId, index });
    });

    // --- Socket.IO Event Handlers ---
    socket.on('roomCreated', (roomId) => {
        currentRoomId = roomId;
        roomInfoElement.textContent = `Room ID: ${roomId} (Share this with your opponent)`;
        messageElement.textContent = 'Waiting for opponent...';
        boardElement.style.display = 'none';
        resetBtn.style.display = 'none';
    });

    socket.on('roomJoined', (data) => {
        currentRoomId = data.roomId;
        playerSymbol = data.playerSymbol;
        gameBoard = data.gameState.gameBoard;
        currentPlayer = data.gameState.currentPlayer;
        gameActive = data.gameState.gameActive;

        roomInfoElement.textContent = `Joined Room ID: ${currentRoomId}. You are Player ${playerSymbol}`;
        boardElement.style.display = 'grid';
        resetBtn.style.display = 'block';
        updateBoard();
        updateMessage();
    });

    socket.on('roomFull', () => {
        messageElement.textContent = 'Room is full! Please try another room.';
    });

    socket.on('playerDisconnected', (msg) => {
        messageElement.textContent = msg;
        gameActive = false;
        boardElement.style.display = 'none'; // Hide board if opponent disconnects
        resetBtn.style.display = 'none';
        roomInfoElement.textContent = `Room ID: ${currentRoomId}`;
        clearConfetti();
    });

    socket.on('gameStateUpdate', (gameState) => {
        gameBoard = gameState.gameBoard;
        currentPlayer = gameState.currentPlayer;
        gameActive = gameState.gameActive;
        updateBoard();
        updateMessage();
        clearConfetti();
    });

    socket.on('win', (data) => {
        gameBoard = data.gameState ? data.gameState.gameBoard : gameBoard; // Use gameState if provided
        gameActive = false;
        updateBoard();
        const winnerMessage = data.winner === playerSymbol ? `🎉 You win! 🎉` : `😭 Player ${data.winner} wins! 😭`;
        messageElement.textContent = winnerMessage;
        messageElement.classList.add('message-win');
        if (data.winningCells) {
            data.winningCells.forEach((idx, index) => {
                setTimeout(() => {
                    document.querySelector(`[data-index="${idx}"]`).classList.add('winning');
                }, index * 150);
            });
        }
        createConfetti();
    });

    socket.on('draw', () => {
        gameActive = false;
        messageElement.textContent = "It's a draw!";
        clearConfetti();
    });

    socket.on('invalidMove', (msg) => {
        messageElement.textContent = `Invalid move: ${msg}`;
        // Optionally revert UI if needed, though server should be authoritative
    });

    socket.on('message', (msg) => {
        // For general server messages
        console.log('Server message:', msg);
        // messageElement.textContent = msg; // Uncomment if you want to display all server messages
    });

    // --- Helper Functions ---
    function updateBoard() {
        boardElement.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = gameBoard[index];
            cell.classList.remove('X', 'O', 'taken', 'winning', 'placed');
            if (gameBoard[index] !== '') {
                cell.classList.add('taken', gameBoard[index]);
            }
        });
    }

    function updateMessage() {
        messageElement.classList.remove('message-win');
        if (!gameActive) {
            // Message already set by win/draw events
            return;
        }
        isMyTurn = (currentPlayer === playerSymbol);
        if (isMyTurn) {
            messageElement.textContent = `Your turn (${playerSymbol})`;
        } else {
            messageElement.textContent = `Opponent's turn (${currentPlayer})`;
        }
    }

    function createConfetti() {
        const colors = ['#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
        const numConfetti = 100;
        for (let i = 0; i < numConfetti; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = Math.random() * -20 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = Math.random() * 15 + 5 + 'px';
                confetti.style.height = confetti.style.width;
                confetti.style.animationDuration = Math.random() * 2 + 3 + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), parseFloat(confetti.style.animationDuration) * 1000);
            }, i * 20);
        }
    }

    function clearConfetti() {
        document.querySelectorAll('.confetti').forEach(conf => conf.remove());
    }
});