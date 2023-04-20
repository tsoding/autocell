"use strict";
const BOARD_ROWS = 32;
const BOARD_COLS = BOARD_ROWS;
function createBoard() {
    const board = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
        board.push(new Array(BOARD_COLS).fill(0));
    }
    return board;
}
const stateColors = ["#202020", "#FF5050", "#50FF50", "#5050FF"];
const canvasId = "app";
const app = document.getElementById(canvasId);
if (app === null) {
    throw new Error(`Could not find canvas ${canvasId}`);
}
app.width = 800;
app.height = 800;
const ctx = app.getContext("2d");
if (ctx === null) {
    throw new Error(`Could not initialize 2d context`);
}
const nextId = "next";
const next = document.getElementById(nextId);
if (next == null) {
    throw new Error(`Could not find button ${nextId}`);
}
const CELL_WIDTH = app.width / BOARD_COLS;
const CELL_HEIGHT = app.height / BOARD_ROWS;
let currentBoard = createBoard();
let nextBoard = createBoard();
// ***
// *.*
// ***
function countNbors(board, nbors, r0, c0) {
    nbors.fill(0);
    for (let dr = -1; dr <= 1; ++dr) {
        for (let dc = -1; dc <= 1; ++dc) {
            if (dr != 0 || dc != 0) {
                const r = r0 + dr;
                const c = c0 + dc;
                if (0 <= r && r < BOARD_ROWS) {
                    if (0 <= c && c < BOARD_COLS) {
                        nbors[board[r][c]]++;
                    }
                }
            }
        }
    }
}
const GoL = [
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
];
function computeNextBoardGoL(states, current, next) {
    const DEAD = 0;
    const ALIVE = 1;
    const nbors = new Array(states).fill(0);
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            countNbors(current, nbors, r, c);
            next[r][c] = GoL[current[r][c]][nbors[DEAD]][nbors[ALIVE]];
            //////////////////////////////
            // switch (current[r][c]) {
            //     case DEAD:
            //         if (nbors[ALIVE] == 3) {
            //             next[r][c] = ALIVE;
            //         } else {
            //             next[r][c] = DEAD;
            //         }
            //         break;
            //     case ALIVE:
            //         if (nbors[ALIVE] == 2 || nbors[ALIVE] == 3) {
            //             next[r][c] = ALIVE;
            //         } else {
            //             next[r][c] = DEAD;
            //         }
            //         break;
            // }
        }
    }
}
function render(ctx, board) {
    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 0, app.width, app.height);
    ctx.fillStyle = "#FF5050";
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            const x = c * CELL_WIDTH;
            const y = r * CELL_HEIGHT;
            ctx.fillStyle = stateColors[board[r][c]];
            ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        }
    }
}
app.addEventListener("click", (e) => {
    const col = Math.floor(e.offsetX / CELL_WIDTH);
    const row = Math.floor(e.offsetY / CELL_HEIGHT);
    const state = document.getElementsByName("state");
    for (let i = 0; i < state.length; ++i) {
        if (state[i].checked) {
            currentBoard[row][col] = i;
            render(ctx, currentBoard);
            return;
        }
    }
});
next.addEventListener("click", () => {
    computeNextBoardGoL(2, currentBoard, nextBoard);
    [currentBoard, nextBoard] = [nextBoard, currentBoard];
    render(ctx, currentBoard);
});
render(ctx, currentBoard);
