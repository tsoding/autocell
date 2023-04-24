"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Board {
    constructor(width, height, cell = 0) {
        this.width = width;
        this.height = height;
        this.cells = Array(width * height).fill(cell);
    }
    get(x, y) {
        return this.cells[y * this.width + x];
    }
    set(x, y, cell) {
        return this.cells[y * this.width + x] = cell;
    }
}
function mod(a, b) {
    return (a % b + b) % b;
}
function countNbors(board, nbors, x0, y0) {
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
const Seeds = [
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
const GoL = [
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
const BB = [
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
function computeNextBoard(automaton, current, next) {
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
function render(ctx, automaton, board) {
    const CELL_WIDTH = ctx.canvas.width / board.width;
    const CELL_HEIGHT = ctx.canvas.height / board.height;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let y = 0; y < board.height; ++y) {
        for (let x = 0; x < board.width; ++x) {
            const rx = x * CELL_WIDTH;
            const ry = y * CELL_HEIGHT;
            ctx.fillStyle = automaton[board.get(x, y)].color;
            ctx.fillRect(rx, ry, CELL_WIDTH, CELL_HEIGHT);
        }
    }
}
function bytesAsHexString(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; ++i) {
        result += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    }
    return result;
}
function transcendentalApprehensionOfImage(image) {
    const board = new Board(image.width, image.height);
    let count = 0;
    const colorToState = {};
    for (let y = 0; y < image.height; ++y) {
        for (let x = 0; x < image.width; ++x) {
            const pixel = new Uint8Array(image.data.buffer, (y * image.width + x) * 4, 4);
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
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    const cute = yield stbi_load_from_url("img/Cute People Icon v2.png");
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
    const app = document.getElementById(canvasId);
    if (app === null) {
        throw new Error(`Could not find canvas ${canvasId}`);
    }
    app.width = 800;
    const ctx = app.getContext("2d");
    if (ctx === null) {
        throw new Error(`Could not initialize 2d context`);
    }
    const nextId = "next";
    const next = document.getElementById(nextId);
    if (next == null) {
        throw new Error(`Could not find button ${nextId}`);
    }
    const playId = "play";
    const play = document.getElementById(playId);
    if (play == null) {
        throw new Error(`Could not find button ${playId}`);
    }
    const BOARD_SIZE = 32;
    let currentAutomaton = cuteAutomaton;
    let currentBoard = cuteBoard; //new Board(BOARD_SIZE, BOARD_SIZE/2);
    let nextBoard = new Board(currentBoard.width, currentBoard.height);
    app.height = app.width * (currentBoard.height / currentBoard.width);
    app.addEventListener("click", (e) => {
        const CELL_WIDTH = app.width / currentBoard.width;
        const CELL_HEIGHT = app.height / currentBoard.height;
        const x = Math.floor(e.offsetX / CELL_WIDTH);
        const y = Math.floor(e.offsetY / CELL_HEIGHT);
        const state = document.getElementsByName("state");
        for (let i = 0; i < state.length; ++i) {
            if (state[i].checked) {
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
});
// TODO: autoplay
// TODO: drawing the cells
// TODO: autopopulate radio buttons based on the current automaton
//# sourceMappingURL=index.js.map