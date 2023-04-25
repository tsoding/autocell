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
function countNbors(board, states, x0, y0) {
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
function transcendentalApprehensionOfImage(image, rx, ry, rw, rh) {
    const board = new Board(rw, rh);
    let count = 0;
    const colorToState = {};
    for (let y = ry; y < ry + rh; ++y) {
        for (let x = rx; x < rx + rw; ++x) {
            const pixel = new Uint8Array(image.data.buffer, (y * image.width + x) * 4, 4);
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
function getElementByIdOrError(id) {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Could not find element ${id}`);
    }
    return element;
}
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    const cute = yield stbi_load_from_url("img/Cute People Icon v2.png");
    const [cuteBoard, cuteAutomaton] = transcendentalApprehensionOfImage(cute, 0, 0, cute.width, cute.height);
    console.log(cuteBoard);
    console.log(cuteAutomaton);
    for (let y = 0; y < cuteBoard.height; ++y) {
        for (let x = 0; x < cuteBoard.width; ++x) {
            const nbors = countNbors(cuteBoard, cuteAutomaton.length, x, y);
            const state = cuteBoard.get(x, y);
            for (let i = 0; i < cuteAutomaton.length; ++i) {
                if (cuteAutomaton[i].transitions[nbors] === undefined) {
                    cuteAutomaton[i].transitions[nbors] = state;
                }
            }
        }
    }
    console.log(cuteAutomaton);
    const palette = getElementByIdOrError("palette");
    palette.width = 150;
    const paletteCtx = palette.getContext("2d");
    if (paletteCtx === null) {
        throw new Error(`Could not initialize 2d context`);
    }
    let currentState = 1;
    let hoveredState = null;
    const PALETTE_COLS = 6;
    const PALETTE_SIZE = palette.width / PALETTE_COLS;
    const redrawPalette = () => {
        paletteCtx.clearRect(0, 0, palette.width, palette.height);
        for (let i = 0; i < cuteAutomaton.length; ++i) {
            const y = Math.floor(i / PALETTE_COLS);
            const x = i % PALETTE_COLS;
            paletteCtx.fillStyle = cuteAutomaton[i].color;
            paletteCtx.fillRect(x * PALETTE_SIZE, y * PALETTE_SIZE, PALETTE_SIZE, PALETTE_SIZE);
            const thicc = 3;
            if (i == currentState) {
                paletteCtx.strokeStyle = "white";
                paletteCtx.lineWidth = thicc;
                paletteCtx.strokeRect(x * PALETTE_SIZE + thicc / 2, y * PALETTE_SIZE + thicc / 2, PALETTE_SIZE - thicc, PALETTE_SIZE - thicc);
            }
            else if (i == hoveredState) {
                paletteCtx.strokeStyle = "gray";
                paletteCtx.lineWidth = thicc;
                paletteCtx.strokeRect(x * PALETTE_SIZE + thicc / 2, y * PALETTE_SIZE + thicc / 2, PALETTE_SIZE - thicc, PALETTE_SIZE - thicc);
            }
        }
    };
    palette.addEventListener("mousemove", (e) => {
        const x = Math.floor(e.offsetX / PALETTE_SIZE);
        const y = Math.floor(e.offsetY / PALETTE_SIZE);
        const state = y * PALETTE_COLS + x;
        if (state < cuteAutomaton.length) {
            hoveredState = state;
        }
        else {
            hoveredState = null;
        }
        redrawPalette();
    });
    palette.addEventListener("click", (e) => {
        const x = Math.floor(e.offsetX / PALETTE_SIZE);
        const y = Math.floor(e.offsetY / PALETTE_SIZE);
        const state = y * PALETTE_COLS + x;
        if (state < cuteAutomaton.length) {
            currentState = state;
            redrawPalette();
        }
    });
    redrawPalette();
    const app = getElementByIdOrError("app");
    app.width = 800;
    const ctx = app.getContext("2d");
    if (ctx === null) {
        throw new Error(`Could not initialize 2d context`);
    }
    const next = getElementByIdOrError("next");
    const play = getElementByIdOrError("play");
    let currentAutomaton = cuteAutomaton;
    let currentBoard = cuteBoard;
    let nextBoard = new Board(currentBoard.width, currentBoard.height);
    app.height = app.width * (currentBoard.height / currentBoard.width);
    app.addEventListener("mousemove", (e) => {
        if (e.buttons & 1) {
            const CELL_WIDTH = app.width / currentBoard.width;
            const CELL_HEIGHT = app.height / currentBoard.height;
            const x = Math.floor(e.offsetX / CELL_WIDTH);
            const y = Math.floor(e.offsetY / CELL_HEIGHT);
            currentBoard.set(x, y, currentState);
            render(ctx, currentAutomaton, currentBoard);
        }
    });
    app.addEventListener("mousedown", (e) => {
        const CELL_WIDTH = app.width / currentBoard.width;
        const CELL_HEIGHT = app.height / currentBoard.height;
        const x = Math.floor(e.offsetX / CELL_WIDTH);
        const y = Math.floor(e.offsetY / CELL_HEIGHT);
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
    let playInterval = null; //setInterval(nextState, PLAY_PERIOD);
    play.addEventListener("click", () => {
        if (playInterval === null) {
            playInterval = setInterval(nextState, PLAY_PERIOD);
            play.innerText = "Pause";
        }
        else {
            clearInterval(playInterval);
            playInterval = null;
            play.innerText = "Play";
        }
    });
    render(ctx, currentAutomaton, currentBoard);
});
//# sourceMappingURL=index.js.map