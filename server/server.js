import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const games = new Map();

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('joinGame', (gameId) => {
        if (!games.has(gameId)) {
            games.set(gameId, [socket.id]);
        } else if (games.get(gameId).length < 2) {
            games.get(gameId).push(socket.id);
        } else {
            socket.emit('gameError', 'Game is full');
            return;
        }

        socket.join(gameId);
        socket.emit('gameJoined', gameId);
        io.to(gameId).emit('playerJoined', socket.id);  
    });
    socket.on('makeMove', (move) => {
        const gameId = [...socket.rooms].find(room => games.has(room));
        if (gameId) {
            socket.to(gameId).emit('opponentMove', move);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        for (const [gameId, players] of games.entries()) {
            const index = players.indexOf(socket.id);
            if (index !== -1) {
                players.splice(index, 1);
                if (players.length === 0) {
                    games.delete(gameId);
                } else {
                    io.to(gameId).emit('playerDisconnected', socket.id);
                }
            }
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
