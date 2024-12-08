const SCREEN_WIDTH = innerWidth > 800 ? 800 : innerWidth,
    SCREEN_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3

let gameState = "",
    engine = litecanvas({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        canvas: "#game canvas",
        autoscale: false,
    }),
    graphics = makeGraphics(engine);

let selectorDelay = 0;
const selectorDelayMax = 0.1;
let pieceDelay = 0;
const pieceDelayMax = 0.1;

let selector = {
    // Middle of columns are: 142, 225, 305, 388, 468, 550, 630
    x: [142, 225, 305, 388, 468, 550, 630],
    y: 55,
    angle: 0,
};

let selected = 0;

let falling = null;

function init() {
    bg = 0;
    blue = 6;
    red = 4;
    yellow = 5;
    radius = 30;
    posx = CENTERX;
    posy = CENTERY;
    boardh = 480;
    colh = boardh / 6;
    boardw = 570;
    colw = boardw / 7;
    // Set up the board
    game_board = [];
    for (let i = 0; i < 6; i++) {
        game_board.push([0, 0, 0, 0, 0, 0, 0]);
    }
    board_full = false;
    p1_wins = false;
    p2_wins = false;
    player = 1;
    p1_win_counter = 0;
    p2_win_counter = 0;
    volume(1);

    gameState = "playing";
}

function update(dt) {
    if (gameState !== "playing") {
        updateReplay(dt);
        return;
    }
    updateSelector(dt);
    updateFalling(dt);
}

function draw() {
    cls(bg); // clear the screen
    drawTitle();
    drawBoard();
    drawPieces();
    drawSelector();
    drawScore();

    if (gameState !== "playing") {
        push();
        alpha(0.75);
        cls(bg);
        alpha(1);
        textalign("center", "middle");
        textsize(96);

        let win = "";
        if (p1_wins) {
            win = "Player 1 Wins!";
        } else if (p2_wins) {
            win = "Player 2 Wins!";
        }
        if (gameState === "game-over") {
            text(CENTERX, CENTERY, "Draw!");
        } else if (gameState === "victory") {
            text(CENTERX, CENTERY, win);
        }
        pop();
    }

    textsize(16);
    // text(0, 0, "FPS: " + FPS);
}

function replay() {
    if (p1_wins) {
        player = 1;
    } else {
        player = 2;
    }
    // Set up the board
    game_board = [];
    for (let i = 0; i < 6; i++) {
        game_board.push([0, 0, 0, 0, 0, 0, 0]);
    }
    board_full = false;
    p1_wins = false;
    p2_wins = false;
    gameState = "playing";
}

function drawScore() {
    textalign("left", "top");
    text(10, 10, "P1: " + p1_win_counter, red);
    textalign("right", "top");
    text(790, 10, "P2: " + p2_win_counter, yellow);
}

function drawTitle() {
    textalign("center", "middle");
    // text(CENTERX, 10, "Connect Four Demo", 3);
    textsize(30);
    text(CENTERX - 50, 35, "Player ", 3);
    if (player === 1) {
        text(CENTERX + 5, 35, player, red);
    } else {
        text(CENTERX + 5, 35, player, yellow);
    }
    text(CENTERX + 60, 35, "'s turn", 3);
}

function drawPieces() {
    for (let row = 0; row < game_board.length; row++) {
        for (let col = 0; col < game_board[row].length; col++) {
            let x = colw * col + colw / 2 + 111; // Adjusted for alignment
            let y = colh * row + colh / 2 + 90; // Adjusted for alignment
            if (game_board[row][col] === 0) {
                // Draw an empty spot
                circfill(x, y, radius, bg);
            } else if (game_board[row][col] === 1) {
                // Draw player 1's piece
                circfill(x, y, radius, red);
            } else if (game_board[row][col] === 2) {
                // Draw player 2's piece
                circfill(x, y, radius, yellow);
            }
        }
    }
}

function drawBoard() {
    // draw the board borders
    rectfill(110, 90, boardw, boardh, blue, 20);
    // Draw the board feet
    rectfill(30, 571, 200, 20, blue, radius);
    rectfill(boardw - 5, 571, 200, 20, blue, radius);
    /*
    // Draw the vertical cols
    rectfill(colw + 30, 90, colw, boardh, blue);
    rectfill(colw * 2 + 30, 90, colw, boardh, blue);
    rectfill(colw * 3 + 30, 90, colw, boardh, blue);
    rectfill(colw * 4 + 30, 90, colw, boardh, blue);
    rectfill(colw * 5 + 30, 90, colw, boardh, blue);
    rectfill(colw * 6 + 30, 90, colw, boardh, blue);
    // Draw the horizontal cols
    rect(colw + 30, 90 + colh, boardw, colw, blue);
    rect(colw + 30, 90 + colh * 2, boardw, colw, blue);
    rect(colw + 30, 90 + colh * 3, boardw, colw, blue);
    rect(colw + 30, 90 + colh * 4, boardw, colw, blue);
    */
}

function drawSelector() {
    const sprite = graphics.selector;
    const radians = deg2rad(selector.angle);
    push();
    translate(selector.x[selected], selector.y);
    rotate(HALF_PI + radians);
    image(-sprite.width / 2, -sprite.height / 2, sprite);
    pop();
}

function updateReplay(dt) {
    if (iskeydown("r")) {
        sfx([
            1.1, 0.05, 157, 0.03, 0.04, 0.04, 4, 4.9, 78, -13, 0, 0, 0.07, 0, 0,
            0, 0, 0.91, 0.02, 0.33, 0,
        ]);
        replay();
    }
}

function updateSelector(dt) {
    // Update the delay timer
    if (selectorDelay > 0) {
        selectorDelay -= dt;
    }

    // Move selector left
    if (iskeydown("ArrowLeft") && selectorDelay <= 0) {
        if (selected > 0) {
            selected--;
            sfx([
                1.5, 0.05, 24, 0.01, 0.02, 0.01, 1, 3.9, -33, 0, 0, 0, 0, 0,
                355, 0, 0, 0.65, 0, 0, 0,
            ]);
            selectorDelay = selectorDelayMax; // Reset the delay timer
        }
    }
    // Move selector right
    if (iskeydown("ArrowRight") && selectorDelay <= 0) {
        if (selected <= 5) {
            selected++;
            sfx([
                1.5, 0.05, 24, 0.01, 0.02, 0.01, 1, 3.9, -33, 0, 0, 0, 0, 0,
                355, 0, 0, 0.65, 0, 0, 0,
            ]);
            selectorDelay = selectorDelayMax; // Reset the delay timer
        }
    }
    if (iskeydown("ArrowDown") && selectorDelay <= 0) {
        selectorDelay = selectorDelayMax + 1; // Reset the delay timer
        sfx([
            2, 0.05, 226, 0, 0.08, 0.13, 0, 3.1, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.02,
            0.76, 0.04, 0, 105,
        ]);
        dropPiece();
    }
}

function dropPiece() {
    let found = false;
    for (let i = 5; i >= 0; i--) {
        if (game_board[i][selected] === 0) {
            found = true;
            falling = {
                row: -1,
                col: selected,
                targetRow: i,
                player: player,
            };
            break;
        }
    }
    if (found) {
        player = player === 1 ? 2 : 1;
    }
}

function updateFalling(dt) {
    if (falling === null) return;

    // Update the delay timer
    if (pieceDelay > 0) {
        pieceDelay -= dt;
        return;
    }

    // Move the piece down
    if (falling.row < falling.targetRow) {
        if (falling.row >= 0) {
            game_board[falling.row][falling.col] = 0;
        }
        falling.row++;
        game_board[falling.row][falling.col] = falling.player;
        pieceDelay = pieceDelayMax; // Reset the delay timer
    } else {
        checkWinner(falling.player);
        falling = null;
    }
}

function checkWinner(player) {
    // check columns
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 3; j++) {
            if (
                game_board[j][i] === player &&
                game_board[j + 1][i] === player &&
                game_board[j + 2][i] === player &&
                game_board[j + 3][i] === player
            ) {
                if (falling.player === 1) {
                    p1_win_counter++;
                    p1_wins = true;
                } else {
                    p2_win_counter++;
                    p2_wins = true;
                }
                sfx([
                    1.3, 0, 130.81, 0.32, 0.35, 0.5, 3, 5.2, 0, 1, 50, 0, 0.14,
                    0, 0, 0, 0, 0.37, 0.04, 0.24, 0,
                ]);
                gameState = "victory";
                return;
            }
        }
    }

    // check rows
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
            if (
                game_board[i][j] === player &&
                game_board[i][j + 1] === player &&
                game_board[i][j + 2] === player &&
                game_board[i][j + 3] === player
            ) {
                if (falling.player === 1) {
                    p1_win_counter++;
                    p1_wins = true;
                } else {
                    p2_win_counter++;
                    p2_wins = true;
                }
                sfx([
                    1.3, 0, 130.81, 0.32, 0.35, 0.5, 3, 5.2, 0, 1, 50, 0, 0.14,
                    0, 0, 0, 0, 0.37, 0.04, 0.24, 0,
                ]);
                gameState = "victory";
                return;
            }
        }
    }

    // check diagonals (bottom-left to top-right)
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (
                game_board[row][col] === player &&
                game_board[row - 1][col + 1] === player &&
                game_board[row - 2][col + 2] === player &&
                game_board[row - 3][col + 3] === player
            ) {
                if (falling.player === 1) {
                    p1_wins = true;
                    p1_win_counter++;
                } else {
                    p2_win_counter++;
                    p2_wins = true;
                }
                sfx([
                    1.3, 0, 130.81, 0.32, 0.35, 0.5, 3, 5.2, 0, 1, 50, 0, 0.14,
                    0, 0, 0, 0, 0.37, 0.04, 0.24, 0,
                ]);
                gameState = "victory";
                return;
            }
        }
    }

    // check diagonals (top-left to bottom-right)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (
                game_board[row][col] === player &&
                game_board[row + 1][col + 1] === player &&
                game_board[row + 2][col + 2] === player &&
                game_board[row + 3][col + 3] === player
            ) {
                if (falling.player === 1) {
                    p1_wins = true;
                    p1_win_counter++;
                } else {
                    p2_win_counter++;
                    p2_wins = true;
                }
                sfx([
                    1.3, 0, 130.81, 0.32, 0.35, 0.5, 3, 5.2, 0, 1, 50, 0, 0.14,
                    0, 0, 0, 0, 0.37, 0.04, 0.24, 0,
                ]);
                gameState = "victory";
                return;
            }
        }
    }

    // check for a full board
    if (isBoardFull()) {
        p1_win_counter++;
        p2_win_counter++;
        sfx([
            2, 0, 262.63, 0.1, 0.12, 0.3, 0, 2.4, -0.1, 0, 0, 0, 0.24, 0, 0,
            0.1, 0.05, 0.98, 0.07, 0.17, 0,
        ]);
        gameState = "game-over";
        return;
    }
}

function isBoardFull() {
    // returns true if the board is full, checks the top row
    for (let col = 0; col < 7; col++) {
        if (game_board[0][col] === 0) {
            return false;
        }
    }
    return true;
}
