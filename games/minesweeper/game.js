const SCREEN_WIDTH = innerWidth > 800 ? 800 : innerWidth;
const SCREEN_HEIGHT = SCREEN_WIDTH * 0.75;

const COLOR = {
    BLACK: 0,
    SLATE: 1,
    GREY: 2,
    BEIGE: 3,
    RED: 4,
    MUSTARD: 5,
    BLUE: 6,
    TEAL: 7,
    GREEN: 8,
    LIME: 9,
    BROWN: 10,
    GOLD: 11
};

const SYMBOL = {
    MINE: '💣',
    FLAG: '🚩',
    CLOCK: '⏰',
};

const ROWS = 10;
const COLS = 10;
const DIFF = 10;
const TILE_SIZE = 34;

const MODE = 'PLAY'; // DEBUG | PLAY

class Tile {
    _mine;
    _hover;
    _flagged;
    _revealed;
    _adjacent;

    constructor({ mine = false, hover = false, flagged = false, revealed = false, adjacent = 0 } = {}) {
        this._mine = mine;
        this._hover = hover;
        this._flagged = flagged;
        this._revealed = revealed;
        this._adjacent = adjacent;
    }

    activateMine() {
        this._mine = true;
    }

    setHover() {
        this._hover = true;
    }

    unsetHover() {
        this._hover = false;
    }

    deactivateMine() {
        this._mine = false;
    }

    setRevealed() {
        this._revealed = true;
    }

    toggleFlag() {
        this._flagged = !this._flagged;
    }
}

class Coordinate {
    _x;
    _y;

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    set(x, y) {
        this._x = x;
        this._y = y;
    }

    equals(coordinate) {
        return this._x === coordinate._x && this._y === coordinate._y;
    }
}

class Board {
    static _directions = [
        [-1, 0],  // up
        [1, 0],   // down
        [0, -1],  // left
        [0, 1],   // right
        [-1, -1], // top-left
        [-1, 1],  // top-right
        [1, -1],  // bottom-left
        [1, 1]    // bottom-right
    ];

    _layout;
    _mines;

    constructor({ rows, cols, diff }) {
        this._layout = [];
        this._mines = new Set();

        // create board
        for (let r = 0; r < rows; r++) {
            this._layout[r] = [];
            for (let c = 0; c < cols; c++) {
                this._layout[r][c] = new Tile();
            }
        }

        // place mines
        while (this._mines.size < diff) {
            const randomIndex = Math.floor(rand() * rows * cols);
            const row = Math.floor(randomIndex / cols);
            const col = randomIndex % cols;

            if (!this.at({ x: row, y: col }).mine) {
                this.at({ x: row, y: col }).activateMine();
                this._mines.add(new Coordinate(row, col));
            }
        }

        // calculate adjacencies 
        for (const mine of this._mines) {
            for (const [dx, dy] of Board._directions) {
                const newRow = mine._x + dx;
                const newCol = mine._y + dy;

                const tile = this.at({ x: newRow, y: newCol });

                if (
                    newRow >= 0 && newRow < this._layout.length &&
                    newCol >= 0 && newCol < this._layout[0].length &&
                    tile
                ) {
                    tile._adjacent += 1;
                }
            }
        }
    }

    reveal({ row, col }) {
        const result = new Set();

        const revealTile = (r, c) => {
            if (r < 0 || c < 0 || r >= this._layout.length || c >= this._layout[0].length) {
                return;
            }

            const tile = this.at({ x: r, y: c });

            // If tile is already revealed, stop
            if (tile?._revealed || tile?._mine || tile?._flagged) {
                return;
            }

            // Otherwise, mark the tile as revealed
            tile?.setRevealed();
            result.add(new Coordinate(r, c));

            if (tile?._adjacent === 0) {
                // Recursively reveal adjacent tiles if the current tile has no adjacent mines
                for (const [dx, dy] of Board._directions) {
                    const newRow = r + dx;
                    const newCol = c + dy;

                    // Ensure the tile is within bounds
                    if (newRow >= 0 && newCol >= 0 && newRow < this._layout.length && newCol < this._layout[0].length) {
                        revealTile(newRow, newCol);
                    }
                }
            }
        };

        revealTile(row, col);

        return result;
    }

    revealAll() {
        for (const { row, col, tile } of board) {
            if (!tile._revealed) {
                tile.setRevealed();
            }
        }
    }

    at({ x, y }) {
        return this._layout?.at(x)?.at(y);
    }

    *[Symbol.iterator]() {
        for (let row = 0; row < this._layout.length; row++) {
            for (let col = 0; col < this._layout[row].length; col++) {
                yield { row: row, col: col, tile: this._layout[row][col] };
            }
        }
    }
}

const interactionTimer = new InteractionTimer();
const gameTimer = new InteractionTimer();

const engine = litecanvas({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    canvas: "#game canvas",
    autoscale: false,
});

const board = new Board({ rows: ROWS, cols: COLS, diff: DIFF });
const boardOffset = (WIDTH - board._layout[0].length * TILE_SIZE) / 2;

let state = 'game:play';
let flagCounter = DIFF;

const emitter = new EventEmitter();
emitter.on('tap:pending', (data) => {
    const tile = board.at({ x: data.row, y: data.col });

    if (tile._revealed || tile._hover || tile._flagged) {
        return;
    }

    // sfx([1,0,261.6256,.04,.2,.34,1,.3,0,0,0,0,.2,0,0,0,0,.83,.19,.08,0], rand(), 0.5);

    tile.setHover();
});
emitter.on('tap:flag', (data) => {
    const tile = board.at({ x: data.row, y: data.col });

    if (tile._revealed) {
        return;
    }

    tile.unsetHover();
    tile.toggleFlag();

    if (tile._flagged) {
        flagCounter -= 1;
    }
    else {
        flagCounter += 1;
    }

    console.log(tile);
});
emitter.on('tap:reveal', (data) => {
    const tile = board.at({ x: data.row, y: data.col });

    if (tile._flagged) {
        return;
    }

    if (tile._adjacent === 0) {
        board.reveal({ row: data.row, col: data.col });
    }

    tile.unsetHover();
    tile.setRevealed();

    if (tile._mine) {
        emitter.emit('game:end', 'game:loss');

        return;
    }

    let hidden = [];

    for (const { row, col, tile } of board) {
        if (!tile._revealed) {
            hidden.push(tile);
        }
    }

    const won = hidden.every((tile) => tile._mine);
    state = won ? 'game:won' : 'game:play';

    if (won) {
        emitter.emit('game:end', 'game:won');
    }

    console.log(tile);
});
emitter.on('tap:cancel', (data) => {
    const tile = board.at({ x: data.row, y: data.col });
    tile.unsetHover();

    console.log(tile);
});
emitter.on('game:end', (data) => {
    state = data;

    if (state === 'game:loss') {
        sfx([.6,.05,80,.02,.18,.51,3,2,-6,0,0,0,0,1.3,0,.4,0,.49,.28,0,-2957]);
    }
    else if (state === 'game:won') {
        sfx([1.5,.05,690,.03,.22,.44,0,2.2,0,0,0,0,.05,0,0,.2,.12,.83,.2,.13,0]);
    }

    gameTimer.pause();
    board.revealAll();
    emitter.clear();

    console.log(board);
});

function init() {
    volume(1);
    gameTimer.start();

    console.log(board);
}

function draw() {
    cls(COLOR.BLACK);

    gameTimer.end();

    const flagCounterText = `${SYMBOL.FLAG}: ${flagCounter}`;
    const flagCounterWidth = textmetrics(flagCounterText).width;

    const gameTimerText = `${SYMBOL.CLOCK}: ${InteractionTimer.format(gameTimer._duration)}`;

    text(0, TILE_SIZE, gameTimerText, COLOR.BEIGE);
    text(WIDTH - flagCounterWidth, TILE_SIZE, flagCounterText, COLOR.BEIGE);
    textalign('center');

    switch (state) {
        case 'game:loss':
            text(WIDTH / 2, HEIGHT - TILE_SIZE, 'Game Lost!');
            break;

        case 'game:won':
            text(WIDTH / 2, HEIGHT - TILE_SIZE, 'Game Won!');
            break;

        default:
            break;
    }

    for (const { row, col, tile } of board) {
        const x = col * TILE_SIZE + boardOffset;
        const y = row * TILE_SIZE + TILE_SIZE * 2;

        const color =
            tile._adjacent === 1 ? COLOR.TEAL :
                tile._adjacent === 2 ? COLOR.GREEN :
                    tile._adjacent === 3 ? COLOR.RED :
                        tile._adjacent === 4 ? COLOR.BLUE :
                            tile._adjacent === 5 ? COLOR.BROWN :
                                tile._adjacent === 6 ? COLOR.SLATE :
                                    tile._adjacent === 7 ? COLOR.BLACK :
                                        tile._adjacent === 8 ? COLOR.GREY :
                                            COLOR.BEIGE;

        if (MODE === 'PLAY') {
            // cell
            rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.GREY);

            if (tile._hover) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.BEIGE);
            }

            if (tile._revealed) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.SLATE);
            }

            if (!tile._mine && tile._flagged && (state === 'game:loss' || state === 'game:won')) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.BROWN);
            }

            // text
            const message =
                tile._flagged ? SYMBOL.FLAG :
                    tile._mine ? SYMBOL.MINE :
                        tile._adjacent > 0 ? tile._adjacent :
                            ' ';

            if (tile._revealed || tile._flagged) {
                text(x + TILE_SIZE / 2, y + 2, message, color);
            }
        }
        else {
            // cell
            rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.GREY);

            if (tile._mine) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.RED);
            }

            if (tile._revealed) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.SLATE);
            }

            if (tile._flagged) {
                rectfill(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR.BROWN);
            }

            // text
            text(x + TILE_SIZE / 2, y + 2, tile._adjacent, color);
        }
    }
}

function tapVerify(x, y) {
    const row = Math.floor((y - TILE_SIZE * 2) / TILE_SIZE);
    const col = Math.floor((x - boardOffset) / TILE_SIZE);

    if (row < 0 || row >= board._layout.length ||
        col < 0 || col >= board._layout[0].length) {
        console.log("Tap outside the board.");

        return null;
    }

    return { row, col };
}

function tap(x, y, tapId) {
    const position = tapVerify(x, y);
    if (!position) {
        return;
    }

    const { row, col } = position;

    emitter.emit('tap:pending', { row, col });
    interactionTimer.start();
}

function untap(x, y, tapId) {
    const position = tapVerify(x, y);
    if (!position) {
        return;
    }

    const { row, col } = position;

    interactionTimer.end();

    if (interactionTimer.isHold()) {
        emitter.emit('tap:flag', { row, col });
    } else {
        emitter.emit('tap:reveal', { row, col });
    }
}

const pervious = new Coordinate(0, 0);

function tapping(x, y, tapId) {
    const position = tapVerify(x, y);
    if (!position) {
        return;
    }

    const { row, col } = position;

    interactionTimer.end();

    if (!pervious.equals(new Coordinate(row, col))) {
        emitter.emit('tap:cancel', { row, col });
        pervious.set(row, col);
    }
}
