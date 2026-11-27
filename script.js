
const canvas = document.getElementById("kolamCanvas");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

// Controls
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
const bgColor = $("bgColor");
const brushSize = $("brushSize");
const brushValue = $("brushValue");

const generateBtn = $("generateBtn");
const drawBtn = $("drawBtn");
const placeBtn = $("placeBtn");
const eraseBtn = $("eraseBtn");
const eraseDotBtn = $("eraseDotBtn");
const undoBtn = $("undoBtn");
const clearBtn = $("clearBtn");
const resetBtn = $("resetBtn");
const saveBtn = $("saveBtn");

const status = $("status");
const modeText = $("modeText");

// Canvas settings
const canvasSize = 800;
const canvasCenter = 400;

// Dot settings
let rows = 5;
let columns = 5;
let horizontalSpacing = 60;
let verticalSpacing = 60;
let dotRadius = 6;

let dotPositions = [];

// Drawing settings
let mode = "draw";
let drawing = false;
let currentStroke = null;
let strokes = [];

let currentColor = "#222222";
let backgroundColor = "#ffffff";
let brush = 4;

// Undo history
let history = [];

function saveHistory() {
    history.push({
        dots: dotPositions.map(p => ({ ...p })),
        strokes: strokes.map(s => ({
            color: s.color,
            size: s.size,
            erase: s.erase,
            points: s.points.map(p => ({ ...p }))
        }))
    });

    if (history.length > 100) {
        history.shift();
    }

    updateUndoButton();
}

function updateUndoButton() {
    undoBtn.disabled = history.length === 0;
}

// Get dot positions for selected arrangement
function generateDotPositions() {

    dotPositions = [];

    const pattern = dotPattern.value;

    const totalHeight = (rows - 1) * verticalSpacing;
    const startY = canvasCenter - totalHeight / 2;

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
                Math.max(1, Math.ceil(columns *
                    (1 - distance / (middle + 1))))
            );
        }

        const staggerOffset =
            pattern === "staggered" && r % 2 === 1
                ? horizontalSpacing / 2
                : 0;

        const rowWidth =
            (count - 1) * horizontalSpacing + staggerOffset;

        const startX = canvasCenter - rowWidth / 2;

        for (let c = 0; c < count; c++) {

            let x = startX + c * horizontalSpacing;
            let y = startY + r * verticalSpacing;

            if (pattern === "random") {
                x = 35 + Math.random() * 730;
                y = 35 + Math.random() * 730;
            }

            dotPositions.push({ x, y });
        }
    }
}

// Draw the dots
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

// Draw all strokes
function drawStrokes() {

    strokes.forEach(stroke => {

        if (stroke.points.length === 0) return;

        ctx.save();

        if (stroke.erase) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "#000000";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
        }

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

        // Render a tap as a dot
        if (stroke.points.length === 1) {
            ctx.beginPath();
            ctx.arc(
                stroke.points[0].x,
                stroke.points[0].y,
                stroke.size / 2,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = stroke.color;
            ctx.fill();
        }

        ctx.restore();
    });
}

// Redraw complete canvas
function drawCanvas() {

    ctx.fillStyle = backgroundColor;

    ctx.fillRect(0, 0, canvasSize, canvasSize);

    drawStrokes();
    drawDots();
}

// Generate button
generateBtn.addEventListener("click", function() {

    const newRows = Number(dotRows.value);
    const newColumns = Number(dotColumns.value);

    if (
        !Number.isInteger(newRows) ||
        !Number.isInteger(newColumns) ||
        newRows < 1 || newRows > 30 ||
        newColumns < 1 || newColumns > 30
    ) {
        status.textContent =
            "Rows and columns must be between 1 and 30.";
        return;
    }

    if (newRows * newColumns > 500) {
        status.textContent =
            "Please choose a maximum of 500 dots.";
        return;
    }

    rows = newRows;
    columns = newColumns;

    horizontalSpacing = Number(horizontalSpace.value);
    verticalSpacing = Number(verticalSpace.value);
    dotRadius = Number(dotSize.value);

    history = [];
    strokes = [];

    if (dotPattern.value === "custom") {
        dotPositions = [];
    } else {
        generateDotPositions();
    }

    drawCanvas();

    status.textContent =
        dotPositions.length + " dots generated successfully!";

    updateUndoButton();
});

// Manual dot placement
function addDot(position) {

    saveHistory();

    dotPositions.push(position);

    drawCanvas();

    status.textContent = "New dot placed!";
}

// Erase nearest dot
function removeDot(position) {

    let nearestIndex = -1;
    let nearestDistance = 25;

    dotPositions.forEach((dot, index) => {

        const distance = Math.hypot(
            dot.x - position.x,
            dot.y - position.y
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });

    if (nearestIndex !== -1) {

        saveHistory();

        dotPositions.splice(nearestIndex, 1);

        drawCanvas();

        status.textContent = "Dot removed.";
    }
}

// Get mouse or touch position
function getPosition(event) {

    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) *
            canvas.width / rect.width,

        y: (event.clientY - rect.top) *
            canvas.height / rect.height
    };
}

// Pointer down
canvas.addEventListener("pointerdown", function(event) {

    event.preventDefault();

    const position = getPosition(event);

    if (mode === "place") {
        addDot(position);
        return;
    }

    if (mode === "eraseDot") {
        removeDot(position);
        return;
    }

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

// Pointer move
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

// Change drawing mode
function setMode(newMode) {

    drawing = false;
    currentStroke = null;
    mode = newMode;

    [drawBtn, placeBtn, eraseBtn, eraseDotBtn]
        .forEach(button => button.classList.remove("active"));

    if (mode === "draw") {
        drawBtn.classList.add("active");
        modeText.textContent = "Draw your kolam freely.";
        canvas.style.cursor = "crosshair";
    }

    else if (mode === "place") {
        placeBtn.classList.add("active");
        modeText.textContent = "Click anywhere to place dots.";
        canvas.style.cursor = "copy";
    }

    else if (mode === "erase") {
        eraseBtn.classList.add("active");
        modeText.textContent = "Erase unwanted drawing lines.";
        canvas.style.cursor = "crosshair";
    }

    else if (mode === "eraseDot") {
        eraseDotBtn.classList.add("active");
        modeText.textContent = "Click near a dot to remove it.";
        canvas.style.cursor = "not-allowed";
    }
}

drawBtn.addEventListener("click", () => setMode("draw"));
placeBtn.addEventListener("click", () => setMode("place"));
eraseBtn.addEventListener("click", () => setMode("erase"));
eraseDotBtn.addEventListener("click", () => setMode("eraseDot"));

// Undo
undoBtn.addEventListener("click", function() {

    if (history.length === 0) return;

    const previous = history.pop();

    dotPositions = previous.dots;
    strokes = previous.strokes;

    drawCanvas();

    updateUndoButton();

    status.textContent = "Last action undone.";
});

// Clear drawing but keep dots
clearBtn.addEventListener("click", function() {

    if (strokes.length === 0) return;

    saveHistory();

    strokes = [];

    drawCanvas();

    status.textContent = "Drawing cleared. Dots are preserved.";
});

// Background colour
bgColor.addEventListener("input", function() {

    backgroundColor = bgColor.value;

    drawCanvas();
});

// Line colour
lineColor.addEventListener("input", function() {
    currentColor = lineColor.value;
});

// Brush size
brushSize.addEventListener("input", function() {

    brush = Number(brushSize.value);

    brushValue.textContent = brush;
});

// Horizontal spacing
horizontalSpace.addEventListener("input", function() {
    horizontalValue.textContent = horizontalSpace.value;
});

// Vertical spacing
verticalSpace.addEventListener("input", function() {
    verticalValue.textContent = verticalSpace.value;
});

// Dot size
dotSize.addEventListener("input", function() {
    dotSizeValue.textContent = dotSize.value;
});

// Reset everything
resetBtn.addEventListener("click", function() {

    rows = 5;
    columns = 5;

    horizontalSpacing = 60;
    verticalSpacing = 60;
    dotRadius = 6;

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
    bgColor.value = "#ffffff";
    brushSize.value = 4;

    currentColor = "#222222";
    backgroundColor = "#ffffff";
    brush = 4;

    strokes = [];
    history = [];

    generateDotPositions();

    setMode("draw");

    drawCanvas();

    updateUndoButton();

    status.textContent = "Everything reset!";
});

// Download kolam
saveBtn.addEventListener("click", function() {

    drawCanvas();

    const link = document.createElement("a");

    link.download = "My-Kolam.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

    status.textContent = "Kolam downloaded successfully!";
});

// Initial setup
generateDotPositions();
drawCanvas();
setMode("draw");
updateUndoButton();
