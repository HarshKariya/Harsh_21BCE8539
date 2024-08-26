document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("root");
    const socket = io(); 

    function createBoard() {
        for (let i = 0; i < 5; i++) {
            const row = document.createElement("div");
            row.classList.add("squareRow");
            for (let j = 0; j < 5; j++) {
                const square = document.createElement("div");
                square.classList.add("square");
                square.dataset.row = i;
                square.dataset.col = j;
                if ((i + j) % 2 === 0) {
                    square.classList.add("white");
                } else {
                    square.classList.add("black");
                }
                if (i === 0) {
                    if (j === 0) addPiece(square, "A-P1", "pawn");
                    if (j === 1) addPiece(square, "A-P2", "pawn");
                    if (j === 2) addPiece(square, "A-H1", "hero1");
                    if (j === 3) addPiece(square, "A-H2", "hero2");
                    if (j === 4) addPiece(square, "A-H3", "hero3");
                } else if (i === 4) {
                    if (j === 0) addPiece(square, "B-P1", "pawn");
                    if (j === 1) addPiece(square, "B-P2", "pawn");
                    if (j === 2) addPiece(square, "B-H1", "hero1");
                    if (j === 3) addPiece(square, "B-H2", "hero2");
                    if (j === 4) addPiece(square, "B-H3", "hero3");
                }
                square.addEventListener("click", () => handleSquareClick(square));
                row.appendChild(square);
            }
            board.appendChild(row);
        }
    }

    function addPiece(square, name, type) {
        const piece = document.createElement("div");
        piece.classList.add("piece", type);
        piece.textContent = name;
        piece.dataset.type = type;
        piece.dataset.row = square.dataset.row;
        piece.dataset.col = square.dataset.col;
        square.appendChild(piece);
    }

    let selectedPiece = null;

    function handleSquareClick(square) {
        if (!square) {
            console.error('Square is null or undefined');
            return;
        }

        const piece = square.querySelector(".piece");

        if (piece) {
            if (selectedPiece) {
                if (selectedPiece === piece) {
                    selectedPiece.classList.remove("selected");
                    selectedPiece = null;
                } else {
                    const isValidMove = validateMove(selectedPiece, square);
                    if (isValidMove) {
                        if (square.querySelector(".piece")) {
                            square.querySelector(".piece").remove(); 
                        }
                        movePiece(selectedPiece, square);
                        socket.emit('makeMove', {
                            from: { row: selectedPiece.dataset.row, col: selectedPiece.dataset.col },
                            to: { row: square.dataset.row, col: square.dataset.col }
                        });
                    } else {
                        alert("Invalid move!");
                    }
                }
            } else {
                selectedPiece = piece;
                selectedPiece.classList.add("selected");
            }
        } else if (selectedPiece) {
            const isValidMove = validateMove(selectedPiece, square);
            if (isValidMove) {
                if (square.querySelector(".piece")) {
                    square.querySelector(".piece").remove(); 
                }
                movePiece(selectedPiece, square);
                socket.emit('makeMove', {
                    from: { row: selectedPiece.dataset.row, col: selectedPiece.dataset.col },
                    to: { row: square.dataset.row, col: square.dataset.col }
                });
            } else {
                alert("Invalid move!");
            }
        }
    }

    function movePiece(piece, square) {
        square.appendChild(piece);
        piece.classList.remove("selected");
        piece.dataset.row = square.dataset.row;
        piece.dataset.col = square.dataset.col;
        selectedPiece = null;
    }

    function validateMove(piece, targetSquare) {
        const type = piece.dataset.type;
        const currentRow = parseInt(piece.dataset.row);
        const currentCol = parseInt(piece.dataset.col);
        const targetRow = parseInt(targetSquare.dataset.row);
        const targetCol = parseInt(targetSquare.dataset.col);
        const rowDiff = targetRow - currentRow;
        const colDiff = targetCol - currentCol;

        const targetPiece = targetSquare.querySelector(".piece");
        const isOpponentPiece = targetPiece && targetPiece.textContent.charAt(0) !== piece.textContent.charAt(0);

        switch (type) {
            case "pawn":
                return (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) && (!targetPiece || isOpponentPiece);

            case "hero1":
                return (
                    ((Math.abs(rowDiff) === 2 && colDiff === 0) || 
                     (rowDiff === 0 && Math.abs(colDiff) === 2) || 
                     (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2)) &&
                    (!targetPiece || isOpponentPiece)
                );

            case "hero2":
                return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) && (!targetPiece || isOpponentPiece);

            case "hero3":
                return (
                    ((Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || 
                     (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)) &&
                    (!targetPiece || isOpponentPiece)
                );

            default:
                return false;
        }
    }

    createBoard();

    socket.on('opponentMove', (move) => {
        const { from, to } = move;
        const fromSquare = document.querySelector(`[data-row="${from.row}"][data-col="${from.col}"]`);
        const toSquare = document.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);
        
        if (fromSquare && toSquare) {
            const piece = fromSquare.querySelector(".piece");
            if (piece) {
                movePiece(piece, toSquare);
            }
        }
    });
});
