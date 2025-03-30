"use strict";

var svg = document.getElementById("pcb");
//* PCB Circuit Parameters *//
var gridSpacing = 10;
var lineWidth = 5;

var width = Math.floor(window.innerWidth / gridSpacing);
var height = Math.floor(document.body.scrollHeight / gridSpacing) * 1.5;
svg.setAttribute('width', window.innerWidth);
svg.setAttribute('height', height * gridSpacing);

var gridState = [];
var obstacleMap = [];

for (var x = 0; x < width; x++) {
    gridState.push(Array(height).fill(false));
    obstacleMap.push(Array(height).fill(false));
}

var borderPads = [];

/**
 * Mark obstacles on the grid
 * and create connection points around them.
 */
function markObstacles() {
    const obstacles = document.querySelectorAll('.pcb-obstacle');
    obstacles.forEach(obstacle => {
        const rect = obstacle.getBoundingClientRect();
        const startX = Math.floor(rect.left / gridSpacing);
        const startY = Math.floor(rect.top / gridSpacing);
        const endX = Math.floor(rect.right / gridSpacing);
        const endY = Math.floor(rect.bottom / gridSpacing);
        //** Marks the obstacle area **//
        for (let x = Math.max(0, startX - 5); x <= Math.min(width-1, endX + 5); x++) {
            for (let y = Math.max(0, startY - 5); y <= Math.min(height-1, endY + 5); y++) {
                obstacleMap[x][y] = true;
                gridState[x][y] = true;
            }
        }
        
        const borderPoints = [];
        //** Top border (direction: up) **//
        for (let x = Math.max(0, startX); x <= Math.min(width-1, endX-1); x++) {
            if (startY - 1 >= 0) borderPoints.push({x: x, y: startY - 1, dir: 'up'});
        }
        //** Bottom border (direction: down) **//
        for (let x = Math.max(0, startX); x <= Math.min(width-1, endX-1); x++) {
            if (endY < height) borderPoints.push({x: x, y: endY, dir: 'down'});
        }
        //** Left border (direction: left) **//
        for (let y = Math.max(0, startY); y <= Math.min(height-1, endY-1); y++) {
            if (startX - 1 >= 0) borderPoints.push({x: startX - 1, y: y, dir: 'left'});
        }
        //** Right border (direction: right) **//
        for (let y = Math.max(0, startY); y <= Math.min(height-1, endY-1); y++) {
            if (endX < width) borderPoints.push({x: endX, y: y, dir: 'right'});
        }
        
        borderPoints.forEach(point => {
            renderPad(point.x, point.y);
            borderPads.push(point);
        });
    });
}

/**
 * Connects border pads to the nearest normal pad
 * by searching in the direction of the pad.
 * It will search up to a maximum distance.
 */
function connectBorderPads() {
    borderPads.forEach(pad => {
        let x = pad.x;
        let y = pad.y;
        let found = false;
        let distance = 1;
        //** Maximum distance to search for a normal pad **//
        let maxDistance = 20; 
        while (!found && distance < maxDistance) {
            let checkX = x;
            let checkY = y;
            //** Check in the appropriate direction **//
            switch(pad.dir) {
                case 'left':
                    checkX = x - distance;
                    break;
                case 'right':
                    checkX = x + distance;
                    break;
                case 'up':
                    checkY = y - distance;
                    break;
                case 'down':
                    checkY = y + distance;
                    break;
            }
            if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height && 
                gridState[checkX][checkY] && !obstacleMap[checkX][checkY]) {
                renderLine(x, y, checkX, checkY);
                found = true;
            }
            distance++;
        }
    });
}

/** 
 * Renders a line between two points
 * and marks the points as occupied.
 */
var renderLine = function(x1, y1, x2, y2) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", (x1 + 0.5) * gridSpacing);
    line.setAttribute("y1", (y1 + 0.5) * gridSpacing);
    line.setAttribute("x2", (x2 + 0.5) * gridSpacing);
    line.setAttribute("y2", (y2 + 0.5) * gridSpacing);
    line.setAttribute("stroke", "#4a4");
    line.setAttribute("stroke-width", lineWidth);
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
}

/**
 * Renders the normal and obstacle PCB
 * pads (Grey Connection Dots)
 */
var renderPad = function(x, y) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", (x + 0.5) * gridSpacing);
    circle.setAttribute("cy", (y + 0.5) * gridSpacing);
    circle.setAttribute("r", 3);
    circle.setAttribute("stroke", "#aaa");
    circle.setAttribute("stroke-width", 2);
    circle.setAttribute("fill", "none");
    svg.appendChild(circle);
}

/**
 * Shuffle function for
 * array shuffling
 */
var shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Check if the point is within bounds, not occupied
 * and not in an obstacle
 */
var isEmpty = function(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height && 
           !gridState[x][y] && !obstacleMap[x][y];
}

/**
 * Renders the connection lines
 * between PCB pads
 */
var doLine = function(x0, y0, x1, y1) {
    var midX = Math.round((x0 + x1) / 2);
    var midY = Math.round((y0 + y1) / 2);
    if (!isEmpty(x1, y1) || !isEmpty(midX, midY)) return true;
    gridState[x1][y1] = true;
    gridState[midX][midY] = true;
    renderLine(x0, y0, x1, y1);
    var deadEnd = true;
    var angle = Math.atan2(x1 - x0, y1 - y0);
    
    shuffle([0, Math.PI / 4, -Math.PI / 4]).forEach(function(da) {
        var x2 = x1 + Math.round(Math.sin(angle + da)) * 2;
        var y2 = y1 + Math.round(Math.cos(angle + da)) * 2;
        if (Math.random() > 0.3) return (deadEnd &= doLine(x1, y1, x2, y2));
    });
    
    if (deadEnd) renderPad(x1, y1);
}

//** Window resize handling **//
window.addEventListener('resize', function() {
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    
    width = Math.floor(document.body.scrollWidth / gridSpacing) * 2;
    height = Math.floor(document.body.scrollHeight / gridSpacing) * 2;
    svg.setAttribute('width', width * gridSpacing);
    svg.setAttribute('height', height * gridSpacing);
    
    gridState = [];
    obstacleMap = [];
    for (var x = 0; x < width; x++) {
        gridState.push(Array(height).fill(false));
        obstacleMap.push(Array(height).fill(false));
    }

    generateCircuit();
});

/**
 * Main calling function to generate the whole
 * PCB circuit 
 */
function generateCircuit() {
    borderPads = [];
    //** Mark Obstacle Divs first **//
    markObstacles();
    
    const startPoints = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
        [Math.floor(width/2), Math.floor(height/2)]
    ];
    
    startPoints.forEach(point => {
        const [x, y] = point;
        gridState[x][y] = true;
        //** Generate lines in multiple directions from each start point **//
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const endX = x + Math.round(Math.sin(angle)) * 2;
            const endY = y + Math.round(Math.cos(angle)) * 2;
            
            if (isEmpty(endX, endY)) {
                doLine(x, y, endX, endY);
            }
        }
    });
    //** More random branches **//
    for (let i = 0; i < 50; i++) {
        let startX, startY;
        do {
            startX = Math.floor(Math.random() * width);
            startY = Math.floor(Math.random() * height);
        } while (!gridState[startX][startY] || obstacleMap[startX][startY]);
        
        const angle = Math.random() * Math.PI * 2;
        const endX = startX + Math.round(Math.sin(angle)) * 2;
        const endY = startY + Math.round(Math.cos(angle)) * 2;
        
        if (isEmpty(endX, endY)) {
            doLine(startX, startY, endX, endY);
        }
    }

    connectBorderPads();
}

//** Initialize **//
generateCircuit();