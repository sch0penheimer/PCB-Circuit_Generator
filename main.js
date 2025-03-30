"use strict";

var svg = document.getElementById("pcb");
var gridSpacing = 6;
var lineWidth = 3;
var lineColor = "rgb(123, 169, 115)"

//** Use viewport dimensions **//
var width = Math.floor(window.innerWidth / gridSpacing);
var height = Math.floor(window.innerHeight / gridSpacing);

var gridState = [];
for (var x = 0; x < width; x++) {
    gridState.push(Array(height).fill(false));
}

var renderLine = function(x1, y1, x2, y2) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", (x1 + 0.5) * gridSpacing);
    line.setAttribute("y1", (y1 + 0.5) * gridSpacing);
    line.setAttribute("x2", (x2 + 0.5) * gridSpacing);
    line.setAttribute("y2", (y2 + 0.5) * gridSpacing);
    line.setAttribute("stroke", lineColor);
    line.setAttribute("stroke-width", lineWidth);
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
}

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

var shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

var isEmpty = function(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height && !gridState[x][y];
}

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

//** Handle window resize **//
window.addEventListener('resize', function() {
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    
    width = Math.floor(window.innerWidth / gridSpacing);
    height = Math.floor(window.innerHeight / gridSpacing);
    
    gridState = [];
    for (var x = 0; x < width; x++) {
        gridState.push(Array(height).fill(false));
    }
    
    //** Regenerate the PCB lines **//
    generateCircuit();
});

function generateCircuit() {
    gridState[0][0] = true;
    doLine(0, 0, 2, 2);
    doLine(2, 2, 4, 0);
    doLine(4, 0, 6, 2);
    doLine(6, 2, 8, 0);
    
    for (let i = 0; i < 20; i++) {
        //** Find a random occupied point to branch from **//
        let startX, startY;
        do {
            startX = Math.floor(Math.random() * width);
            startY = Math.floor(Math.random() * height);
        } while (!gridState[startX][startY]);
        
        const angle = Math.random() * Math.PI * 2;
        const endX = startX + Math.round(Math.sin(angle)) * 2;
        const endY = startY + Math.round(Math.cos(angle)) * 2;
        
        if (isEmpty(endX, endY)) {
            doLine(startX, startY, endX, endY);
        }
    }
}

//** Initialize **//
generateCircuit();