const BOARD_ROWS = 64;
const BOARD_COLS = BOARD_ROWS;

let TARGET_FPS = 30;
let FRAME_DURATION:number;

type Cell = number;
type Board = Cell[][];

function createBoard(): Board {
    const board: Board = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
        board.push(new Array<Cell>(BOARD_COLS).fill(0));
    }
    return board;
}

function mod(a: number, b: number): number {
    return (a%b + b)%b
}

function countNbors(board: Board, nbors: number[], r0: number, c0: number) {
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
    const DEAD = 0;
    const ALIVE = 1;
    const nbors = new Array(automaton.length).fill(0);
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            countNbors(current, nbors, r, c);
            const state = automaton[current[r][c]];
            next[r][c] = state.transitions[nbors.join("")];
            if (next[r][c] === undefined) next[r][c] = state["default"];
        }
    }
}

function render(ctx: CanvasRenderingContext2D, automaton: Automaton, board: Board) {
    const CELL_WIDTH = ctx.canvas.width/BOARD_COLS;
    const CELL_HEIGHT = ctx.canvas.height/BOARD_ROWS;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let r = 0; r < BOARD_ROWS; ++r) {
        for (let c = 0; c < BOARD_COLS; ++c) {
            const x = c*CELL_WIDTH;
            const y = r*CELL_HEIGHT;
            ctx.fillStyle = automaton[board[r][c]].color;
            ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        }
    }
}


window.onload = () => {
    const canvasId = "app";
    const app = document.getElementById(canvasId) as HTMLCanvasElement;
    if (app === null) {
        throw new Error(`Could not find canvas ${canvasId}`);
    }
    app.width = 800;
    app.height = 800;
    const ctx = app.getContext("2d") as CanvasRenderingContext2D;
    if (ctx === null) {
        throw new Error(`Could not initialize 2d context`);
    }

    const playId = "play";
    const resetId = "reset";
    const nextId = "next";
    const fpsRangeId = "fpsRange";
    const fpsRangeLabelId = "fpsRangeLabel";

    const play = document.getElementById(playId) as HTMLButtonElement;
    const fpsRange = document.getElementById(fpsRangeId) as HTMLInputElement;
    const next = document.getElementById(nextId) as HTMLButtonElement;
    const reset = document.getElementById(resetId) as HTMLButtonElement;
    const fpsRangeLabel = document.getElementById(fpsRangeLabelId) as HTMLInputElement;

    if (play == null) {
        throw new Error(`Could not find button ${playId}`);
    }

    let currentAutomaton = BB;
    let currentBoard: Board = createBoard();
    let nextBoard: Board = createBoard();
    let isMouseDown = false;
    let isPaused = true;
    let lastUpdatedTimestamp = Date.now();

    setFps(TARGET_FPS);

    const handleDraw =(e:MouseEvent) => {
        pause();
        const CELL_WIDTH = app.width/BOARD_COLS;
        const CELL_HEIGHT = app.height/BOARD_ROWS;
        
        const col = Math.floor(e.offsetX/CELL_WIDTH);
        const row = Math.floor(e.offsetY/CELL_HEIGHT);

        const state = document.getElementsByName("state");
        for (let i = 0; i < state.length; ++i) {
            if ((state[i] as HTMLInputElement).checked) {
                currentBoard[row][col] = i;
                render(ctx, currentAutomaton, currentBoard);

                return;
            }
        }
    };

    app.addEventListener("mousedown", function(e){
        //  0 -  Left mouse click
        if(e.button === 0){
            isMouseDown = true;
        }
    });
    app.addEventListener("mouseup", function(){
        isMouseDown = false;
    });
    app.addEventListener("mousemove", (e) => {
        if(isMouseDown){
            handleDraw(e)
        }
    });
    play.addEventListener("click", () => {
        isPaused = false;
        run()
    });
    reset.addEventListener("click", () => {
        currentBoard = createBoard();
        render(ctx, currentAutomaton, currentBoard);
    });
    fpsRange.addEventListener("input", (e) => {
        setFps(Number((e.target as HTMLInputElement).value))
    })
    next.addEventListener("click", () => {
        if(!isPaused){
            isPaused = true;
        }
        computeAndDrawBoard()
    });

    function setFps(value:number){
        TARGET_FPS = value;
        fpsRange.value = String(value);
        fpsRangeLabel.innerText = String(`${value} FPS`);
        FRAME_DURATION = 1000 / TARGET_FPS;
    }
    function pause(){
        isPaused = true;
    }
    function computeAndDrawBoard() {
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        computeNextBoard(currentAutomaton, currentBoard, nextBoard);
        [currentBoard, nextBoard] = [nextBoard, currentBoard];
        render(ctx, currentAutomaton, currentBoard);
    }

    function run(){
        let currentTime = Date.now()
        let elapsedTime = currentTime - lastUpdatedTimestamp;
        if( !isPaused  && elapsedTime >= FRAME_DURATION ){
            computeAndDrawBoard()
            lastUpdatedTimestamp = currentTime;
        }
        requestAnimationFrame(run);
    }

    computeAndDrawBoard();

};

// TODO: autoplay
// TODO: drawing the cells
// TODO: autopopulate radio buttons based on the current automaton
