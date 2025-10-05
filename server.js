const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

const rooms = {}; // Stores game rooms: { roomId: { players: [], gameBoard: [], currentPlayer: 'X', gameActive: false } }

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWin(board, player) {
    return winConditions.some(condition => {
        return condition.every(index => board[index] === player);
    });
}

function checkDraw(board) {
    return board.every(cell => cell !== '');
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createRoom', (desiredRoomId) => {
        let roomId = desiredRoomId ? desiredRoomId.toUpperCase() : null;

        if (roomId && rooms[roomId]) {
            socket.emit('message', `Room ID "${roomId}" already exists. Please choose another or join it.`);
            return;
        }

        if (!roomId || rooms[roomId]) { // If no desired ID or it's taken, generate a random one
            do {
                roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            } while (rooms[roomId]); // Ensure generated ID is unique
        }
        
        rooms[roomId] = {
            players: [{ id: socket.id, symbol: 'X' }],
            gameBoard: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true
        };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        socket.emit('roomJoined', { roomId, playerSymbol: 'X', gameState: rooms[roomId] });
        console.log(`Room ${roomId} created by ${socket.id}`);
    });

    socket.on('joinRoom', (roomId) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('message', 'Room not found!');
            return;
        }
        if (room.players.length >= 2) {
            socket.emit('roomFull');
            socket.emit('message', 'Room is full!');
            return;
        }

        const playerSymbol = room.players.length === 0 ? 'X' : 'O';
        room.players.push({ id: socket.id, symbol: playerSymbol });
        socket.join(roomId);
        socket.emit('roomJoined', { roomId, playerSymbol, gameState: room });
        io.to(roomId).emit('message', `${socket.id} joined the room. Game starting!`);
        io.to(roomId).emit('gameStateUpdate', room); // Send initial state to both players
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('makeMove', ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room || !room.gameActive || room.players.length < 2) {
            socket.emit('invalidMove', 'Game not active or room not ready.');
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.symbol !== room.currentPlayer) {
            socket.emit('invalidMove', 'It\'s not your turn or you are not a player in this room.');
            return;
        }

        if (room.gameBoard[index] !== '') {
            socket.emit('invalidMove', 'Cell already taken.');
            return;
        }

        room.gameBoard[index] = room.currentPlayer;

        const winningCells = checkWin(room.gameBoard, room.currentPlayer);
        if (winningCells) {
            room.gameActive = false;
            io.to(roomId).emit('win', { winner: room.currentPlayer, winningCells });
            console.log(`Player ${room.currentPlayer} wins in room ${roomId}`);
        } else if (checkDraw(room.gameBoard)) {
            room.gameActive = false;
            io.to(roomId).emit('draw');
            console.log(`Room ${roomId} is a draw`);
        } else {
            room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';
            io.to(roomId).emit('gameStateUpdate', room);
        }
    });

    socket.on('resetGame', (roomId) => {
        const room = rooms[roomId];
        if (room) {
            room.gameBoard = ['', '', '', '', '', '', '', '', ''];
            room.currentPlayer = 'X';
            room.gameActive = true;
            io.to(roomId).emit('gameStateUpdate', room);
            io.to(roomId).emit('message', 'Game has been reset!');
            console.log(`Room ${roomId} reset`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} deleted as all players disconnected.`);
                } else {
                    io.to(roomId).emit('playerDisconnected', 'Your opponent has disconnected. Waiting for a new player...');
                    room.gameActive = false; // Pause game until new player joins
                    console.log(`Player disconnected from room ${roomId}. Room now has ${room.players.length} players.`);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});