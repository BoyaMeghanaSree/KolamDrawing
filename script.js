
const canvas = document.getElementById("kolamCanvas");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

// =====================================
// HTML ELEMENTS
// =====================================

const dotRows = $("dotRows");
const dotColumns = $("dotColumns");
const dotPattern = $("dotPattern");

const horizontalSpace = $("horizontalSpace");
const verticalSpace = $("verticalSpace");
const dotSize = $("dotSize");

const horizontalValue = $("horizontalValue");
const verticalValue = $("verticalValue");
const dotSizeValue = $("dotSizeValue");

const dotColor = $("dotColor");
const lineColor = $("lineColor");
const fillColor = $("fillColor");
const bgColor = $("bgColor");
const brushSize = $("brushSize");
const brushValue = $("brushValue");

const generateBtn = $("generateBtn");
const drawBtn = $("drawBtn");
const straightBtn = $("straightBtn");
const curveBtn = $("curveBtn");
const fillBtn = $("fillBtn");
const placeBtn = $("placeBtn");
const eraseBtn = $("eraseBtn");
const eraseDotBtn = $("eraseDotBtn");
const undoBtn = $("undoBtn");
const clearBtn = $("clearBtn");
const resetBtn = $("resetBtn");
const saveBtn = $("saveBtn");

const status = $("status");
const modeText = $("modeText");

// =====================================
// CANVAS SETTINGS
// =====================================

const SIZE = 800;
const CENTER = 400;

canvas.width = SIZE;
canvas.height = SIZE;

// Separate colour layer
const fillCanvas = document.createElement("canvas");
fillCanvas.width = SIZE;
fillCanvas.height = SIZE;

const fillCtx = fillCanvas.getContext("2d");

// =====================================
// VARIABLES
// =====================================

let rows = 5;
let columns = 5;

let horizontalSpacing = 60;
let verticalSpacing = 60;
let dotRadius = 6;

let dotPositions = [];

let strokes = [];
let history = [];

let mode = "draw";

let drawing = false;
let currentStroke = null;
let selectedStartDot = null;

let currentColor = "#222222";
let backgroundColor = "#ffffff";
let brush = 4;

// =====================================
// UNDO HISTORY
// =====================================

function saveHistory() {

    history.push({

        dots: dotPositions.map(p => ({...p})),

        strokes: strokes.map(s => ({
            color: s.color,
            size: s.size,
            erase: s.erase,
            points: s.points.map(p => ({...p}))
        })),

        fill: fillCtx.getImageData(0, 0, SIZE, SIZE)

    });

    if (history.length > 30) {
        history.shift();
    }

    updateUndoButton();
}

function updateUndoButton() {
    undoBtn.disabled = history.length === 0;
}

undoBtn.addEventListener("click", function() {

    if (history.length === 0) return;

    const previous = history.pop();

    dotPositions = previous.dots;
    strokes = previous.strokes;

    fillCtx.putImageData(previous.fill, 0, 0);

    drawCanvas();
    updateUndoButton();

    status.textContent = "Last action undone!";
});

// =====================================
// GENERATE DOT PATTERNS
// =====================================

function generateDotPositions() {

    dotPositions = [];

    const pattern = dotPattern.value;

    if (pattern === "custom") return;

    // Fit dot grid inside canvas
    const spaceX = Math.min(
        horizontalSpacing,
        columns > 1 ? 640 / (columns - 1) : horizontalSpacing
    );

    const spaceY = Math.min(
        verticalSpacing,
        rows > 1 ? 640 / (rows - 1) : verticalSpacing
    );

    const startY = CENTER - ((rows - 1) * spaceY) / 2;

    for (let r = 0; r < rows; r++) {

        let count = columns;

        if (pattern === "triangle") {
            count = Math.min(columns, r + 1);
        }

        else if (pattern === "inverted") {
            count = Math.min(columns, rows - r);
        }

        else if (pattern === "diamond") {

            const middle = (rows - 1) / 2;

            const distance = Math.abs(r - middle);

            count = Math.min(
                columns,
                Math.max(
                    1,
                    Math.round(
                        columns * (1 - distance / (middle + 1))
                    )
                )
            );
        }

        const offset =
            pattern === "staggered" && r % 2 === 1
                ? spaceX / 2
                : 0;

        const rowWidth = (count - 1) * spaceX + offset;

        const startX = CENTER - rowWidth / 2;

        for (let c = 0; c < count; c++) {

            let x = startX + c * spaceX;
            let y = startY + r * spaceY;

            if (pattern === "random") {
                x = 50 + Math.random() * 700;
                y = 50 + Math.random() * 700;
            }

            dotPositions.push({x, y});
        }
    }
}

// Generate button
generateBtn.addEventListener("click", function() {

    const newRows = Number(dotRows.value);
    const newColumns = Number(dotColumns.value);

    if (
        !Number.isInteger(newRows) ||
        !Number.isInteger(newColumns) ||
        newRows < 1 || newRows > 30 ||
        newColumns < 1 || newColumns > 30 ||
        newRows * newColumns > 500
    ) {

        status.textContent =
            "Enter valid rows and columns. Maximum 500 dots.";

        return;
    }

    rows = newRows;
    columns = newColumns;

    horizontalSpacing = Number(horizontalSpace.value);
    verticalSpacing = Number(verticalSpace.value);
    dotRadius = Number(dotSize.value);

    strokes = [];
    history = [];

    fillCtx.clearRect(0, 0, SIZE, SIZE);

    generateDotPositions();

    drawCanvas();
    updateUndoButton();

    status.textContent =
        dotPositions.length + " dots generated successfully!";
});

// =====================================
// DRAW DOTS
// =====================================

function drawDots() {

    ctx.fillStyle = dotColor.value;

    dotPositions.forEach(dot => {

        ctx.beginPath();

        ctx.arc(
            dot.x,
            dot.y,
            dotRadius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

// =====================================
// DRAW STROKES
// =====================================

function drawStrokes() {

    strokes.forEach(stroke => {

        if (stroke.points.length === 0) return;

        ctx.save();

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        ctx.moveTo(
            stroke.points[0].x,
            stroke.points[0].y
        );

        stroke.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });

        ctx.stroke();

        ctx.restore();
    });
}

// =====================================
// REDRAW COMPLETE CANVAS
// =====================================

function drawCanvas() {

    ctx.fillStyle = backgroundColor;

    ctx.fillRect(0, 0, SIZE, SIZE);

    // Draw filled colours
    ctx.drawImage(fillCanvas, 0, 0);

    // Draw lines
    drawStrokes();

    // Draw dots
    drawDots();
}

// =====================================
// BUCKET FILL TOOL
// =====================================

function bucketFill(x, y, selectedColor) {

    drawCanvas();

    const image = ctx.getImageData(
        0, 0, SIZE, SIZE
    );

    const data = image.data;

    const startX = Math.floor(x);
    const startY = Math.floor(y);

    if (
        startX < 0 || startX >= SIZE ||
        startY < 0 || startY >= SIZE
    ) {
        return false;
    }

    const startPixel = startY * SIZE + startX;
    const startIndex = startPixel * 4;

    const target = [
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2],
        data[startIndex + 3]
    ];

    const rgb = selectedColor.match(/[a-f\d]{2}/gi).map(
        value => parseInt(value, 16)
    );

    // Avoid filling the same colour
    if (
        target[0] === rgb[0] &&
        target[1] === rgb[1] &&
        target[2] === rgb[2]
    ) {
        return false;
    }

    const tolerance = 35;

    const visited = new Uint8Array(SIZE * SIZE);
    const queue = new Int32Array(SIZE * SIZE);

    let head = 0;
    let tail = 0;

    visited[startPixel] = 1;
    queue[tail++] = startPixel;

    const fillImage = fillCtx.getImageData(
        0, 0, SIZE, SIZE
    );

    const fillData = fillImage.data;

    function enqueue(pixel) {

        if (!visited[pixel]) {

            visited[pixel] = 1;

            queue[tail++] = pixel;
        }
    }

    while (head < tail) {

        const pixel = queue[head++];

        const px = pixel % SIZE;
        const py = Math.floor(pixel / SIZE);

        const index = pixel * 4;

        const matches =
            Math.abs(data[index] - target[0]) <= tolerance &&
            Math.abs(data[index + 1] - target[1]) <= tolerance &&
            Math.abs(data[index + 2] - target[2]) <= tolerance &&
            data[index + 3] === target[3];

        if (!matches) continue;

        // Add selected colour
        fillData[index] = rgb[0];
        fillData[index + 1] = rgb[1];
        fillData[index + 2] = rgb[2];
        fillData[index + 3] = 255;

        // Check neighbouring pixels
        if (px > 0) enqueue(pixel - 1);

        if (px < SIZE - 1) enqueue(pixel + 1);

        if (py > 0) enqueue(pixel - SIZE);

        if (py < SIZE - 1) enqueue(pixel + SIZE);
    }

    // No pixels were filled
    if (tail === 0) return false;

    fillCtx.putImageData(fillImage, 0, 0);

    drawCanvas();

    return true;
}

// =====================================
// FIND NEAREST DOT
// =====================================

function findNearestDot(position) {

    let nearest = null;
    let minDistance = 25;

    dotPositions.forEach(dot => {

        const distance = Math.hypot(
            dot.x - position.x,
            dot.y - position.y
        );

        if (distance < minDistance) {

            minDistance = distance;
            nearest = dot;
        }
    });

    return nearest;
}

// =====================================
// STRAIGHT AND CURVED LINES
// =====================================

function createConnectedLine(start, end, curved) {

    const points = [];
    const segments = 50;

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const controlX =
        (start.x + end.x) / 2 - dy * 0.25;

    const controlY =
        (start.y + end.y) / 2 + dx * 0.25;

    for (let i = 0; i <= segments; i++) {

        const t = i / segments;

        let x, y;

        if (curved) {

            // Quadratic Bezier curve
            x =
                (1-t)*(1-t)*start.x +
                2*(1-t)*t*controlX +
                t*t*end.x;

            y =
                (1-t)*(1-t)*start.y +
                2*(1-t)*t*controlY +
                t*t*end.y;

        } else {

            // Straight line
            x = start.x + t * dx;
            y = start.y + t * dy;
        }

        points.push({x, y});
    }

    return points;
}

// =====================================
// GET MOUSE / TOUCH POSITION
// =====================================

function getPosition(event) {

    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) *
            canvas.width / rect.width,

        y: (event.clientY - rect.top) *
            canvas.height / rect.height
    };
}

// =====================================
// PLACE DOTS
// =====================================

function addDot(position) {

    saveHistory();

    dotPositions.push(position);

    drawCanvas();

    status.textContent = "New dot placed!";
}

// =====================================
// ERASE INDIVIDUAL DOTS
// =====================================

function removeDot(position) {

    let nearestIndex = -1;
    let minDistance = 25;

    dotPositions.forEach((dot, index) => {

        const distance = Math.hypot(
            dot.x - position.x,
            dot.y - position.y
        );

        if (distance < minDistance) {

            minDistance = distance;
            nearestIndex = index;
        }
    });

    if (nearestIndex !== -1) {

        saveHistory();

        dotPositions.splice(nearestIndex, 1);

        drawCanvas();

        status.textContent = "Dot removed!";
    }
}

// =====================================
// POINTER DOWN EVENT
// =====================================

canvas.addEventListener("pointerdown", function(event) {

    event.preventDefault();

    const position = getPosition(event);

    // Place dots
    if (mode === "place") {

        addDot(position);

        return;
    }

    // Erase dots
    if (mode === "eraseDot") {

        removeDot(position);

        return;
    }

    // Fill colour
    if (mode === "fill") {

        saveHistory();

        const success = bucketFill(
            position.x,
            position.y,
            fillColor.value
        );

        if (!success) {

            history.pop();
            updateUndoButton();

            status.textContent =
                "No enclosed area found. Try another location.";

        } else {

            status.textContent = "Area filled successfully!";
        }

        return;
    }

    // Connect two dots
    if (mode === "straight" || mode === "curve") {

        const clickedDot = findNearestDot(position);

        if (!clickedDot) {

            status.textContent = "Click near a dot.";

            return;
        }

        if (!selectedStartDot) {

            selectedStartDot = clickedDot;

            status.textContent =
                "First dot selected. Choose the second dot.";

            return;
        }

        if (
            selectedStartDot.x === clickedDot.x &&
            selectedStartDot.y === clickedDot.y
        ) {

            status.textContent =
                "Select a different second dot.";

            return;
        }

        saveHistory();

        const points = createConnectedLine(
            selectedStartDot,
            clickedDot,
            mode === "curve"
        );

        strokes.push({

            color: currentColor,
            size: brush,
            erase: false,
            points: points

        });

        selectedStartDot = null;

        drawCanvas();

        status.textContent =
            "Line connected successfully!";

        return;
    }

    // Freehand and eraser
    drawing = true;

    canvas.setPointerCapture(event.pointerId);

    saveHistory();

    currentStroke = {

        color: mode === "erase"
            ? backgroundColor
            : currentColor,

        size: mode === "erase"
            ? brush * 4
            : brush,

        erase: mode === "erase",

        points: [position]
    };

    strokes.push(currentStroke);

    drawCanvas();
});

// =====================================
// POINTER MOVE
// =====================================

canvas.addEventListener("pointermove", function(event) {

    if (!drawing || !currentStroke) return;

    event.preventDefault();

    const position = getPosition(event);

    currentStroke.points.push(position);

    drawCanvas();
});

// Stop drawing
function stopDrawing() {

    drawing = false;

    currentStroke = null;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

// =====================================
// SELECT DRAWING MODE
// =====================================

function setMode(newMode) {

    drawing = false;
    currentStroke = null;
    selectedStartDot = null;

    mode = newMode;

    const buttons = [
        drawBtn,
        straightBtn,
        curveBtn,
        fillBtn,
        placeBtn,
        eraseBtn,
        eraseDotBtn
    ];

    buttons.forEach(button => {
        button.classList.remove("active");
    });

    const settings = {

        draw: [
            drawBtn,
            "Draw freely using your mouse or finger."
        ],

        straight: [
            straightBtn,
            "Select two dots to connect with a straight line."
        ],

        curve: [
            curveBtn,
            "Select two dots to connect with a curved line."
        ],

        fill: [
            fillBtn,
            "Click inside an enclosed area to fill it."
        ],

        place: [
            placeBtn,
            "Click anywhere to add a new dot."
        ],

        erase: [
            eraseBtn,
            "Erase unwanted drawing lines."
        ],

        eraseDot: [
            eraseDotBtn,
            "Click near a dot to remove it."
        ]
    };

    settings[mode][0].classList.add("active");

    modeText.textContent = settings[mode][1];
}

// Tool listeners
drawBtn.addEventListener("click", () => setMode("draw"));
straightBtn.addEventListener("click", () => setMode("straight"));
curveBtn.addEventListener("click", () => setMode("curve"));
fillBtn.addEventListener("click", () => setMode("fill"));
placeBtn.addEventListener("click", () => setMode("place"));
eraseBtn.addEventListener("click", () => setMode("erase"));
eraseDotBtn.addEventListener("click", () => setMode("eraseDot"));

// =====================================
// CLEAR DRAWING
// =====================================

clearBtn.addEventListener("click", function() {

    saveHistory();

    strokes = [];

    fillCtx.clearRect(0, 0, SIZE, SIZE);

    drawCanvas();

    status.textContent =
        "Drawing and colours cleared. Dots preserved.";
});

// =====================================
// COLOUR SETTINGS
// =====================================

lineColor.addEventListener("input", function() {

    currentColor = lineColor.value;
});

bgColor.addEventListener("input", function() {

    backgroundColor = bgColor.value;

    drawCanvas();
});

// =====================================
// BRUSH SIZE
// =====================================

brushSize.addEventListener("input", function() {

    brush = Number(brushSize.value);

    brushValue.textContent = brush;
});

// =====================================
// DOT SETTINGS
// =====================================

horizontalSpace.addEventListener("input", function() {

    horizontalValue.textContent = horizontalSpace.value;
});

verticalSpace.addEventListener("input", function() {

    verticalValue.textContent = verticalSpace.value;
});

dotSize.addEventListener("input", function() {

    dotSizeValue.textContent = dotSize.value;
});

// =====================================
// RESET EVERYTHING
// =====================================

resetBtn.addEventListener("click", function() {

    dotRows.value = 5;
    dotColumns.value = 5;

    horizontalSpace.value = 60;
    verticalSpace.value = 60;
    dotSize.value = 6;

    horizontalValue.textContent = 60;
    verticalValue.textContent = 60;
    dotSizeValue.textContent = 6;

    dotPattern.value = "square";

    dotColor.value = "#222222";
    lineColor.value = "#222222";
    fillColor.value = "#ff4081";
    bgColor.value = "#ffffff";

    brushSize.value = 4;
    brushValue.textContent = 4;

    rows = 5;
    columns = 5;

    horizontalSpacing = 60;
    verticalSpacing = 60;
    dotRadius = 6;

    currentColor = "#222222";
    backgroundColor = "#ffffff";
    brush = 4;

    strokes = [];
    history = [];

    fillCtx.clearRect(0, 0, SIZE, SIZE);

    generateDotPositions();

    setMode("draw");

    drawCanvas();

    updateUndoButton();

    status.textContent = "Everything reset successfully!";
});

// =====================================
// DOWNLOAD KOLAM
// =====================================

saveBtn.addEventListener("click", function() {

    drawCanvas();

    const link = document.createElement("a");

    link.download = "My-Kolam.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

    status.textContent = "Your Kolam was downloaded!";
});

// =====================================
// INITIALIZE WEBSITE
// =====================================

generateDotPositions();

drawCanvas();

setMode("draw");

updateUndoButton();
