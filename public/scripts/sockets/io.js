module.exports = (io) => {
    const games = new Map(); 

    io.on('connection', (socket) => {
        console.log('New socket connection');
        
        let currentGameId = null;
        socket.on('joinGame', (data) => {
            currentGameId = data.code;
            socket.join(currentGameId);

            if (!games.has(currentGameId)) {
                games.set(currentGameId, [socket.id]); 
                console.log(`Game ${currentGameId} created, player joined: ${socket.id}`);
            } else {
                const players = games.get(currentGameId);
                if (players.length < 2) {
                    players.push(socket.id);
                    games.set(currentGameId, players); 
                    console.log(`Player joined game ${currentGameId}: ${socket.id}`);
                    io.to(currentGameId).emit('startGame');
                } else {
                    socket.emit('gameError', 'Game is already full');
                }
            }
        });

        socket.on('move', (move) => {
            if (currentGameId) {
                console.log('Move detected in game:', currentGameId);
                socket.to(currentGameId).emit('newMove', move);
            }
        });

        // Handle player disconnect
        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);

            if (currentGameId) {
                const players = games.get(currentGameId);
                if (players) {
                    const playerIndex = players.indexOf(socket.id);
                    if (playerIndex !== -1) {
                        players.splice(playerIndex, 1); 

                        if (players.length === 0) {
                            games.delete(currentGameId); 
                            console.log(`Game ${currentGameId} deleted.`);
                        } else {
                            io.to(currentGameId).emit('gameOverDisconnect'); 
                        }
                    }
                }
            }
        });
    });
};
