"use strict";
const BOARD_ROWS = 64;
const BOARD_COLS = BOARD_ROWS;
let TARGET_FPS = 30;
let FRAME_DURATION;
function createBoard() {
    const board = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
        board.push(new Array(BOARD_COLS).fill(0));
    }
    return board;
}
function mod(a, b) {
    return (a % b + b) % b;
}
function countNbors(board, nbors, r0, c0) {
    nbors.fill(0);
    for (let dr = -1; dr <= 1; ++dr) {
        for (let dc = -1; dc <= 1; ++dc) {
            if (dr != 0 || dc != 0) {
                const r = mod(r0 + dr, BOARD_ROWS);
                const c = mod(c0 + dc, BOARD_COLS);
                nbors[board[r][c]]++;
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
    const DEAD = 0;
    const ALIVE = 1;
    const nbors = new Array(automaton.length).fill(0);
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            countNbors(current, nbors, r, c);
            const state = automaton[current[r][c]];
            next[r][c] = state.transitions[nbors.join("")];
            if (next[r][c] === undefined)
                next[r][c] = state["default"];
        }
    }
}
function render(ctx, automaton, board) {
    const CELL_WIDTH = ctx.canvas.width / BOARD_COLS;
    const CELL_HEIGHT = ctx.canvas.height / BOARD_ROWS;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            const x = c * CELL_WIDTH;
            const y = r * CELL_HEIGHT;
            ctx.fillStyle = automaton[board[r][c]].color;
            ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        }
    }
}
window.onload = () => {
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
    const playId = "play";
    const resetId = "reset";
    const nextId = "next";
    const fpsRangeId = "fpsRange";
    const fpsRangeLabelId = "fpsRangeLabel";
    const play = document.getElementById(playId);
    const fpsRange = document.getElementById(fpsRangeId);
    const next = document.getElementById(nextId);
    const reset = document.getElementById(resetId);
    const fpsRangeLabel = document.getElementById(fpsRangeLabelId);
    if (next == null) {
        throw new Error(`Could not find button ${nextId}`);
    }
    let currentAutomaton = BB;
    let currentBoard = createBoard();
    let nextBoard = createBoard();
    let isMouseDown = false;
    let isPaused = true;
    let lastUpdatedTimestamp = Date.now();
    setFps(TARGET_FPS);
    const handleDraw = (e) => {
        pause();
        const CELL_WIDTH = app.width / BOARD_COLS;
        const CELL_HEIGHT = app.height / BOARD_ROWS;
        const col = Math.floor(e.offsetX / CELL_WIDTH);
        const row = Math.floor(e.offsetY / CELL_HEIGHT);
        const state = document.getElementsByName("state");
        for (let i = 0; i < state.length; ++i) {
            if (state[i].checked) {
                currentBoard[row][col] = i;
                render(ctx, currentAutomaton, currentBoard);
                return;
            }
        }
    };
    app.addEventListener("mousedown", function (e) {
        console.log(e.button);
        if (e.button === 0) {
            isMouseDown = true;
        }
    });
    app.addEventListener("mouseup", function () {
        isMouseDown = false;
    });
    app.addEventListener("mousemove", (e) => {
        if (isMouseDown) {
            handleDraw(e);
        }
    });
    play.addEventListener("click", () => {
        isPaused = false;
        run();
    });
    reset.addEventListener("click", () => {
        currentBoard = createBoard();
        render(ctx, currentAutomaton, currentBoard);
    });
    fpsRange.addEventListener("input", (e) => {
        setFps(Number(e.target.value));
    });
    next.addEventListener("click", () => {
        if (!isPaused) {
            isPaused = true;
        }
        computeAndDrawBoard();
    });
    function setFps(value) {
        TARGET_FPS = value;
        fpsRange.value = String(value);
        fpsRangeLabel.innerText = String(`${value} FPS`);
        FRAME_DURATION = 1000 / TARGET_FPS;
    }
    function pause() {
        isPaused = true;
    }
    function computeAndDrawBoard() {
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        render(ctx, currentAutomaton, currentBoard);
    }
    function run() {
        let currentTime = Date.now();
        let elapsedTime = currentTime - lastUpdatedTimestamp;
        if (!isPaused && elapsedTime >= FRAME_DURATION) {
            computeAndDrawBoard();
            lastUpdatedTimestamp = currentTime;
        }
        requestAnimationFrame(run);
    }
    computeAndDrawBoard();
};
// TODO: autoplay
// TODO: drawing the cells
// TODO: autopopulate radio buttons based on the current automaton
