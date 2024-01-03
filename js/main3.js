


//VAR
size = 40; // using a grid of point, distance is the distance between the points  in x,y direction
N_row = 15; // number of rows
N_col = 7; // number of columns
radius = 5; // circle ray 





 
/**
 * knowing a path step ( or row index) , returns the next step of this path
 * constraints are not crossing the the neightbourgh pathes
 * @param {number} leftStep : step taken by the path on the left of the selected path ( remember we calculate steps from the left to the right )
 * @param {number} lastStep : the step / column index of the current row
 * @param {number} rightStep : the laststep done by the path on the right of the selected path ( not calulated yet , since we calculate from the left to the right)
 */
function NEXT(leftStep,lastStep,rightStep) {
    // VAR
    Nextstep = (lastStep < leftStep) ? 1 // left path shared a point with the selected path. left path went on the right . selected path should follow...
        : (leftStep == N_col -1)?0 // the case :  selected path is on the right border of the grid.Its left neighbour went on the right border of the grid. the selected path can only go straight up.
        : (lastStep == leftStep) ? Math.round(Math.random())
            : (lastStep == rightStep) ? - Math.round(Math.random())
                : Math.ceil(Math.random() * 3) - 2;
    
    return lastStep +  Nextstep ; 
}


/**
 * handle the NEXT function for all the pathes... 
 * @param {Array} LastSteps : all the pathes actual steps
 */
  function NEXTSTEPS(LastSteps) {
    NS = new Array();
    for (var i = 0; i < numberOfPathes; i++) {
        leftStep = (i == 0) ? i : NS[i - 1]; // remember, left path is already calculated.. 
        rightStep = (i == numberOfPathes - 1) ? N_col - 1 : LastSteps[i + 1]; // right path is not yet calculated...
        
        NS.push(NEXT(leftStep, LastSteps[i], rightStep));
        
    }
    return NS;
}

/* the algorithm...
 * 
 *  - here we define only 3 pathes for commodity... 
 *  - those 3 pathes will be stored in a 2D array called pathes.    
 *          * like pathes[row][path] = column
 *          * row is the grid row .. 
 *          * column is the grid column
 *          * path is the path index..
 *  - we initialize the first steps ( start steps, or row = 0 ) 
 *  - we then use the NEXT function to define the next steps ( or next rows ).. 
 */

//VAR
pathes = new Array();
NextSteps = new Array();



// this time we randomly initialize with n pathes... n from 1 to number of columns / 2 . We want at least 2 pathes
numberOfPathes = Math.ceil(Math.random() * (N_col / 2)); 
numberOfPathes = (numberOfPathes < 2) ? 2 : numberOfPathes;
for (var i = 0; i < numberOfPathes; i++) {
    NextSteps.push(Math.ceil(Math.random() * N_col) - 1);
}
// pathes should have steps from left to the right .. 
pathes.push(NextSteps.sort());

// STEPS...
for (var i = 0; i < N_row - 1; i++) {
    LastSteps = NextSteps;
    NextSteps = new Array();
    NextSteps = NEXTSTEPS(LastSteps);
    pathes.push(NextSteps);
}



/** creating some graphic shinanigans .. 
 *  we start to graphically size the grid we want to use , and stock some GRAPHIC coordinates.
 *  using the model structure of ''pathes''
 */



coordinates = new Array();

for (var i = 0; i < N_row; i++) {
    Aline = new Array();
    for (var j = 0; j < N_col; j++) {
        Aline.push({ x: (j + 1) * size, y: (i + 1) * size });
    }
    coordinates.push(Aline);
}


/*
 * printing that...
 */

// canvas managing
stage = new createjs.Stage("demoCanvas");

//computing point coords for the pathes
pathCoords = new Array();
for (var i = 0; i < pathes.length; i++) {
    oneStep = new Array();
    for (var j = 0; j < pathes[0].length; j++) {
        oneStep.push(coordinates[i][pathes[i][j]]);
        if (coordinates[i][pathes[i][j]] == undefined) console.log("coordinates["+i+"]",coordinates[i],"pathes["+i+"]["+j+"]",pathes[i][j]);
    }
    pathCoords.push(oneStep);
}

// => handling circles - keeping the 2D array profile for coherence
circles = new Array();
for (var i = 0; i < pathCoords.length; i++) {
    Aline = new Array();
    for (var j = 0; j < pathCoords[0].length; j++) {
        coords = pathCoords[i][j];
        circle = new createjs.Shape();
        circle.graphics.beginFill("black").drawCircle(coords.x,coords.y,radius);
        Aline.push(circle);
    }
    circles.push(Aline);
}

// adding the circles to the stage...
for (var i = 0; i < pathes.length; i++) {
    for (var j = 0; j < pathes[0].length; j++) {
        stage.addChild(circles[i][j]);
    }
}




// => handling the lines IN an array ...
colours = ["red", "green", "blue", "orange"]; // quickfix , putting some colors. since we have maxi 4 pathes.
lines = new Array();
// on the starter.
for (var i = 0; i < pathCoords[0].length; i++) {
    lines.push(new createjs.Shape());
    lines[i].graphics.beginStroke(colours[i]);
    lines[i].graphics.moveTo(pathCoords[0][i].x, pathCoords[0][i].y);
}   

// making the steps
for (var i = 1; i < pathCoords.length; i++) {
    for (var j = 0; j < pathCoords[0].length; j++) {
        lines[j].graphics.lineTo(pathCoords[i][j].x, pathCoords[i][j].y);
    }
}

// adding the lines to the stage
for (var i = 0; i < pathes.length; i++) {
    
        stage.addChild(lines[i]);

};


//redline = new createjs.Shape();
//greenline = new createjs.Shape();
//blueline = new createjs.Shape();
//redline.graphics.beginStroke("red");
//greenline.graphics.beginStroke("green");
//blueline.graphics.beginStroke("blue");
//redline.graphics.moveTo(pathCoords[0][0].x, pathCoords[0][0].y);
//greenline.graphics.moveTo(pathCoords[0][1].x, pathCoords[0][1].y);
//blueline.graphics.moveTo(pathCoords[0][2].x, pathCoords[0][2].y);

//for (var i = 1; i < pathCoords.length; i++) {
//    redline.graphics.lineTo(pathCoords[i][0].x, pathCoords[i][0].y);
//    greenline.graphics.lineTo(pathCoords[i][1].x, pathCoords[i][1].y);
//    blueline.graphics.lineTo(pathCoords[i][2].x, pathCoords[i][2].y);
//}

//stage.addChild(redline);
//stage.addChild(greenline);
//stage.addChild(blueline);

stage.update();
