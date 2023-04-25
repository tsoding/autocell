type Cell = number;

class Board {
    public width: number;
    public height: number;
    public cells: Cell[];

    constructor(width: number, height: number, cell: number = 0) {
        this.width = width;
        this.height = height;
        this.cells = Array(width*height).fill(cell);
    }

    get(x: number, y: number): Cell {
        return this.cells[y*this.width + x];
    }

    set(x: number, y: number, cell: Cell) {
        return this.cells[y*this.width + x] = cell;
    }
}

function mod(a: number, b: number): number {
    return (a%b + b)%b
}

type Nbors = string;

function countNbors(board: Board, states: number, x0: number, y0: number): Nbors {
    const nbors = Array(states).fill(0);
    for (let dy = -1; dy <= 1; ++dy) {
        for (let dx = -1; dx <= 1; ++dx) {
            if (dy != 0 || dx != 0) {
                const y = mod(y0 + dy, board.height);
                const x = mod(x0 + dx, board.width);
                nbors[board.get(x, y)]++;
            }
        }
    }
    return nbors.join("");
}

interface State {
    "color": string;
    "default": number;
    "transitions": {
        [key: string]: number;
    }
}

type Automaton = State[];

const Seeds: Automaton = [
    {
        "transitions": {
            "62": 1,
        },
        "default": 0,
        "color": "#202020",
    },
    {
        "transitions": {},
        "default": 0,
        "color": "#FF5050",
    },
];

const GoL: Automaton = [
    {
        "transitions": {
            "53": 1,
        },
        "default": 0,
        "color": "#202020",
    },
    {
        "transitions": {
            "62": 1,
            "53": 1,
        },
        "default": 0,
        "color": "#FF5050",
    },
];

const BB: Automaton = [
    // 0 - Dead
    {
        "transitions": {
            "026": 1,
            "125": 1,
            "224": 1,
            "323": 1,
            "422": 1,
            "521": 1,
            "620": 1,
        },
        "default": 0,
        "color": "#202020",
    },
    // 1 - Live
    {
        "transitions": {},
        "default": 2,
        "color": "#FF5050",
    },
    // 2 - Dying
    {
        "transitions": {},
        "default": 0,
        "color": "#50FF50",
    }
];

function computeNextBoard(automaton: Automaton, current: Board, next: Board) {
    console.assert(current.width == next.width);
    console.assert(current.height == next.height);
    for (let y = 0; y < current.height; ++y) {
        for (let x = 0; x < current.width; ++x) {
            const nbors = countNbors(current, automaton.length, x, y);
            const state = automaton[current.get(x, y)];
            next.set(x, y, state.transitions[nbors]);
            if (next.get(x, y) === undefined) {
                next.set(x, y, state.default);
            }
        }
    }
}

function render(ctx: CanvasRenderingContext2D, automaton: Automaton, board: Board) {
    const CELL_WIDTH = ctx.canvas.width/board.width;
    const CELL_HEIGHT = ctx.canvas.height/board.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let y = 0; y < board.height; ++y) {
        for (let x = 0; x < board.width; ++x) {
            const rx = x*CELL_WIDTH;
            const ry = y*CELL_HEIGHT;
            ctx.fillStyle = automaton[board.get(x, y)].color;
            ctx.fillRect(rx, ry, CELL_WIDTH, CELL_HEIGHT);
        }
    }
}

function bytesAsHexString(bytes: Uint8Array): string {
    let result = "";
    for (let i = 0; i < bytes.length; ++i) {
        result += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    }
    return result;
}

function transcendentalApprehensionOfImage(image: ImageData, rx: number, ry: number, rw: number, rh: number): [Board, Automaton] {
    const board = new Board(rw, rh);
    let count = 0;
    const colorToState: { [key: string]: number } = {};
    for (let y = ry; y < ry + rh; ++y) {
        for (let x = rx; x < rx + rw; ++x) {
            const pixel = new Uint8Array(image.data.buffer, (y*image.width + x)*4, 4);
            const color = bytesAsHexString(pixel);
            if (colorToState[color] === undefined) {
                colorToState[color] = count++;
            }

            board.set(x - rx, y - ry, colorToState[color]);
        }
    }

    const automaton = Object.keys(colorToState).map((color) => {
        return {
            "color": `#${color}`,
            "default": 0,
            "transitions": {},
        };
    });

    return [board, automaton];
}

function getElementByIdOrError<T>(id: string): T {
    const element = document.getElementById(id) as T;
    if (element === null) {
        throw new Error(`Could not find element ${id}`);
    }
    return element;
}

function meltdown(board: Board, automaton: Automaton) {
    for (let y = 0; y < board.height; ++y) {
        for (let x = 0; x < board.width; ++x) {
            const nbors = countNbors(board, automaton.length, x, y);
            const state = board.get(x, y);
            for (let i = 0; i < automaton.length; ++i) {
                if (automaton[i].transitions[nbors] === undefined) {
                    automaton[i].transitions[nbors] = state;
                }
            }
        }
    }
}

function cycleRules(board: Board, automaton: Automaton) {
    const nborStates: { [key: string]: Set<number> } = {};
    for (let y = 0; y < board.height; ++y) {
        for (let x = 0; x < board.width; ++x) {
            const nbors = countNbors(board, automaton.length, x, y);
            if (nborStates[nbors] === undefined) {
                nborStates[nbors] = new Set<number>();
            }
            nborStates[nbors].add(board.get(x, y));
        }
    }

    for (let nbor of Object.keys(nborStates)) {
        const states = Array.from(nborStates[nbor]);
        for (let i = 0; i < states.length; ++i) {
            const state1 = states[i];
            const state2 = states[(i+1)%states.length];
            automaton[state1].transitions[nbor] = state2;
        }
    }
}

function allNborsFreqs(state: number, xs: number[] = [], result: [string, number][] = []): [string, number][] {
    const s = xs.reduce((a, b) => a + b, 0);
    if (state <= 0) {
        if (s === 8) {
            result.push([xs.join(""), xs.indexOf(Math.max(...xs))]);
        }
        return result;
    }
    for (let x = 0; x <= 8 - s; ++x) {
        xs.push(x);
        allNborsFreqs(state - 1, xs, result);
        xs.pop();
    }
    return result;
}

function freqRules(automaton: Automaton) {
    const nborsFreqs = allNborsFreqs(automaton.length);

    for (let i = 0; i < automaton.length; ++i) {
        for (let [nbor, freq] of nborsFreqs) {
            automaton[i].transitions[nbor] = freq;
        }
    }
}

window.onload = async () => {
    const imgPath = "img/Cute People Icon v2.png";
    // const imgPath = "img/Kappa.png";
    // const imgPath = "img/tsodinPog.png";
    const cute = await stbi_load_from_url(imgPath);
    const [cuteBoard, cuteAutomaton] = transcendentalApprehensionOfImage(cute, 0, 0, cute.width, cute.height);

    meltdown(cuteBoard, cuteAutomaton);
    // cycleRules(cuteBoard, cuteAutomaton);
    // freqRules(cuteAutomaton);

    const palette = getElementByIdOrError<HTMLCanvasElement>("palette");
    palette.width = 150;
    const paletteCtx = palette.getContext("2d");
    if (paletteCtx === null) {
        throw new Error(`Could not initialize 2d context`);
    }

    let currentState = 1;
    let hoveredState: number | null = null;
    const PALETTE_COLS = 6;
    const PALETTE_SIZE = palette.width/PALETTE_COLS;

    palette.height = Math.ceil(cuteAutomaton.length/PALETTE_COLS)*PALETTE_SIZE;

    const redrawPalette = () => {
        paletteCtx.clearRect(0, 0, palette.width, palette.height);
        for (let i = 0; i < cuteAutomaton.length; ++i) {
            const y = Math.floor(i/PALETTE_COLS);
            const x = i%PALETTE_COLS;
            paletteCtx.fillStyle = cuteAutomaton[i].color;
            paletteCtx.fillRect(x*PALETTE_SIZE, y*PALETTE_SIZE, PALETTE_SIZE, PALETTE_SIZE);
            const thicc = 3;
            if (i == currentState) {
                paletteCtx.strokeStyle = "white";
                paletteCtx.lineWidth = thicc;
                paletteCtx.strokeRect(x*PALETTE_SIZE + thicc/2, y*PALETTE_SIZE + thicc/2, PALETTE_SIZE - thicc, PALETTE_SIZE - thicc);
            } else if (i == hoveredState) {
                paletteCtx.strokeStyle = "gray";
                paletteCtx.lineWidth = thicc;
                paletteCtx.strokeRect(x*PALETTE_SIZE + thicc/2, y*PALETTE_SIZE + thicc/2, PALETTE_SIZE - thicc, PALETTE_SIZE - thicc);
            }
        }
    };

    palette.addEventListener("mousemove", (e) => {
        const x = Math.floor(e.offsetX/PALETTE_SIZE);
        const y = Math.floor(e.offsetY/PALETTE_SIZE);
        const state = y*PALETTE_COLS + x;

        if (state < cuteAutomaton.length) {
            hoveredState = state;
        } else {
            hoveredState = null;
        }
        redrawPalette();
    });

    palette.addEventListener("click", (e) => {
        const x = Math.floor(e.offsetX/PALETTE_SIZE);
        const y = Math.floor(e.offsetY/PALETTE_SIZE);
        const state = y*PALETTE_COLS + x;
        
        if (state < cuteAutomaton.length) {
            currentState = state;
            redrawPalette();
        }
    });

    redrawPalette();

    const app = getElementByIdOrError<HTMLCanvasElement>("app");
    app.width = 800;
    const ctx = app.getContext("2d");
    if (ctx === null) {
        throw new Error(`Could not initialize 2d context`);
    }

    const next = getElementByIdOrError<HTMLButtonElement>("next");
    const play = getElementByIdOrError<HTMLButtonElement>("play");

    let currentAutomaton = cuteAutomaton;
    let currentBoard: Board = cuteBoard;
    let nextBoard: Board = new Board(currentBoard.width, currentBoard.height);

    app.height = app.width*(currentBoard.height/currentBoard.width);

    app.addEventListener("mousemove", (e) => {
        if (e.buttons&1) {
            const CELL_WIDTH = app.width/currentBoard.width;
            const CELL_HEIGHT = app.height/currentBoard.height;

            const x = Math.floor(e.offsetX/CELL_WIDTH);
            const y = Math.floor(e.offsetY/CELL_HEIGHT);

            currentBoard.set(x, y, currentState);
            render(ctx, currentAutomaton, currentBoard);
        }
    });

    app.addEventListener("mousedown", (e) => {
        const CELL_WIDTH = app.width/currentBoard.width;
        const CELL_HEIGHT = app.height/currentBoard.height;

        const x = Math.floor(e.offsetX/CELL_WIDTH);
        const y = Math.floor(e.offsetY/CELL_HEIGHT);

        currentBoard.set(x, y, currentState);
        render(ctx, currentAutomaton, currentBoard);
    });

    const nextState = () => {
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        render(ctx, currentAutomaton, currentBoard);
    };

    next.addEventListener("click", nextState);

    const PLAY_PERIOD = 100;
    let playInterval: number | null = null;//setInterval(nextState, PLAY_PERIOD);

    play.addEventListener("click", () => {
        if (playInterval === null) {
            playInterval = setInterval(nextState, PLAY_PERIOD);
        } else {
            clearInterval(playInterval);
            playInterval = null;
        }
        play.innerText = playInterval === null ? "Play" : "Pause";
    });
    play.innerText = playInterval === null ? "Play" : "Pause";

    render(ctx, currentAutomaton, currentBoard);
};
