


// canvas managing
stage = new createjs.Stage("demoCanvas");


/** create my point references .. 
 * 
 *  here we create a regular point grid in a 2D  array called points. 
 *  eg first point ( TOP LEFT ) would be points[0][0]
 */


//VAR
distance = 40; // using a grid of point, distance is the distance between the points  in x,y direction
N_row = 15; // number of rows
N_col = 7; // number of columns

points = new Array();

for (var i = 0; i < N_row; i++) {
    Aline = new Array();
    for (var j = 0; j < N_col; j++) {
        circle = new createjs.Shape();
        //console.log((j + 1) * distance, (i + 1) * distance);
        circle.graphics.beginFill("black").drawCircle((j+1)  * distance, (i+1)  * distance, 5);
        Aline.push(circle);
    }
    points.push(Aline);
}


for (var i = 0; i < N_row; i++) {
    for (var j = 0; j < N_col; j++) {
        console.log(points[i][j].x, points[i][j].y);
        stage.addChild(points[i][j]);
    }
}

stage.update();

 