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

function countNbors(board: Board, nbors: number[], x0: number, y0: number) {
    nbors.fill(0);
    for (let dy = -1; dy <= 1; ++dy) {
        for (let dx = -1; dx <= 1; ++dx) {
            if (dy != 0 || dx != 0) {
                const y = mod(y0 + dy, board.height);
                const x = mod(x0 + dx, board.width);
                nbors[board.get(x, y)]++;
            }
        }
    }
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
    const nbors = new Array(automaton.length).fill(0);
    for (let y = 0; y < current.height; ++y) {
        for (let x = 0; x < current.width; ++x) {
            countNbors(current, nbors, x, y);
            const state = automaton[current.get(x, y)];
            next.set(x, y, state.transitions[nbors.join("")]);
            if (next.get(x, y) === undefined) {
                next.set(x, y, state["default"]);
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

function transcendentalApprehensionOfImage(image: ImageData): [Board, Automaton] {
    const board = new Board(image.width, image.height);
    let count = 0;
    const colorToState: { [key: string]: number } = {};
    for (let y = 0; y < image.height; ++y) {
        for (let x = 0; x < image.width; ++x) {
            const pixel = new Uint8Array(image.data.buffer, (y*image.width + x)*4, 4);
            const color = bytesAsHexString(pixel);
            if (colorToState[color] === undefined) {
                colorToState[color] = count++;
            }

            board.set(x, y, colorToState[color]);
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

window.onload = async () => {
    const cute = await stbi_load_from_url("img/Cute People Icon v2.png");
    const [cuteBoard, cuteAutomaton] = transcendentalApprehensionOfImage(cute);

    console.log(cuteBoard);
    console.log(cuteAutomaton);

    const nbors = new Array(cuteAutomaton.length).fill(0);
    for (let y = 0; y < cuteBoard.height; ++y) {
        for (let x = 0; x < cuteBoard.width; ++x) {
            countNbors(cuteBoard, nbors, x, y);
            const state = cuteBoard.get(x, y);
            const nborsKey = nbors.join("");
            if (cuteAutomaton[state].transitions[nborsKey] === undefined) {
                cuteAutomaton[state].transitions[nborsKey] = state;
            }
        }
    }

    console.log(cuteAutomaton);

    const canvasId = "app";
    const app = document.getElementById(canvasId) as HTMLCanvasElement;
    if (app === null) {
        throw new Error(`Could not find canvas ${canvasId}`);
    }
    app.width = 800;
    const ctx = app.getContext("2d");
    if (ctx === null) {
        throw new Error(`Could not initialize 2d context`);
    }

    const nextId = "next";
    const next = document.getElementById(nextId) as HTMLButtonElement;
    if (next == null) {
        throw new Error(`Could not find button ${nextId}`);
    }

    const playId = "play";
    const play = document.getElementById(playId) as HTMLButtonElement;
    if (play == null) {
        throw new Error(`Could not find button ${playId}`);
    }

    const BOARD_SIZE = 32;
    let currentAutomaton = cuteAutomaton;
    let currentBoard: Board = cuteBoard;//new Board(BOARD_SIZE, BOARD_SIZE/2);
    let nextBoard: Board = new Board(currentBoard.width, currentBoard.height);

    app.height = app.width*(currentBoard.height/currentBoard.width);
    
    app.addEventListener("click", (e) => {
        const CELL_WIDTH = app.width/currentBoard.width;
        const CELL_HEIGHT = app.height/currentBoard.height;
        
        const x = Math.floor(e.offsetX/CELL_WIDTH);
        const y = Math.floor(e.offsetY/CELL_HEIGHT);

        const state = document.getElementsByName("state");
        for (let i = 0; i < state.length; ++i) {
            if ((state[i] as HTMLInputElement).checked) {
                currentBoard.set(x, y, i);
                render(ctx, currentAutomaton, currentBoard);
                return;
            }
        }
    });

    const nextState = () => {
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        render(ctx, currentAutomaton, currentBoard);
    };

    next.addEventListener("click", nextState);

    const playIteration = () => {
        nextState();
        setTimeout(playIteration, PLAY_PERIOD);
    };

    const PLAY_PERIOD = 250;
    play.addEventListener("click", () => {
        playIteration();
    });

    render(ctx, currentAutomaton, currentBoard);
};

// TODO: autoplay
// TODO: drawing the cells
// TODO: autopopulate radio buttons based on the current automaton
