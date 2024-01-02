


//VAR
size = 40; // using a grid of point, distance is the distance between the points  in x,y direction
N_row = 15; // number of rows
N_col = 7; // number of columns
radius = 5; // circle ray 




/**  the next function
 *   we create a function which will return the next step of a path
 *   
 */

 
function NEXT(lastStep) {
    // VAR
    Nextstep=0;

    // #########################################################################
    // ## the below code it the longer and explained version of the algorithm##
    // #########################################################################
    // we are on the left side of the grid
    if (lastStep == 0) {
        // we do a random : in js random is between 0 and 1 
        rnd = Math.random();
        // we then round the number . If <0.5 it will be 0 . If >=0.5 it will be 1
        rnd = Math.round(rnd);
        // Happily we can say : 0 , it means we go ''straight'', 1 , we take a step on the right. And oooo, we can just add it to the actuel step value !
        Nextstep = lastStep + rnd;

    }
    // we are on the right side of the grid 
    else if (lastStep == N_col - 1) {
        // that's the shorter version of above code ...
        // 0 it means we go ''straight'' , 1 we take a step on the left . But this time we substract.
        Nextstep = lastStep - Math.round(Math.random());
    }
    // we are in the middle...
    else {
        // -> we take a random number between 0 and 3 
        // -> we substract ''2'' so we have a number between -1 and 1, which happily feet well 
        Nextstep = lastStep + Math.ceil(Math.random() * 3) - 2;
    }

    // #############################
    // ## the compressed algorithm##
    // #############################
    Nextstep = (lastStep == 0) ? Math.round(Math.random()) : (lastStep == N_col - 1) ? - Math.round(Math.random()) : Math.ceil(Math.random() * 3) - 2;
    return lastStep +  Nextstep ; 
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




// the starting position we take 3 pathes here ... 
NextSteps = [Math.ceil(Math.random() * N_col) - 1, Math.ceil(Math.random() * N_col) - 1, Math.ceil(Math.random() * N_col) - 1]
pathes.push(NextSteps);

// STEPS...
for (var i = 0; i < N_row - 1; i++) {
    LastSteps = NextSteps;
    NextSteps = new Array();
    NextSteps = [NEXT(LastSteps[0]), NEXT(LastSteps[1]), NEXT(LastSteps[2])];
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
    }
    pathCoords.push(oneStep);
}

// handling circles - keeping the 2D array profile for coherence
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

for (var i = 0; i < pathes.length; i++) {
    for (var j = 0; j < pathes[0].length; j++) {
        stage.addChild(circles[i][j]);
    }
}

//handling lines as we have 3 lines.... quite easy 
redline = new createjs.Shape();
greenline = new createjs.Shape();
blueline = new createjs.Shape();
redline.graphics.beginStroke("red");
greenline.graphics.beginStroke("green");
blueline.graphics.beginStroke("blue");
redline.graphics.moveTo(pathCoords[0][0].x, pathCoords[0][0].y);
greenline.graphics.moveTo(pathCoords[0][1].x, pathCoords[0][1].y);
blueline.graphics.moveTo(pathCoords[0][2].x, pathCoords[0][2].y);

for (var i = 1; i < pathCoords.length; i++) {
    redline.graphics.lineTo(pathCoords[i][0].x, pathCoords[i][0].y);
    greenline.graphics.lineTo(pathCoords[i][1].x, pathCoords[i][1].y);
    blueline.graphics.lineTo(pathCoords[i][2].x, pathCoords[i][2].y);
}

stage.addChild(redline);
stage.addChild(greenline);
stage.addChild(blueline);

stage.update();
