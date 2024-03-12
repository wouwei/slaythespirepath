
/**
 * this is a factory !
 * @param {sts.datas.config} cfg : the config, see the default config  in data section
 */
function slaythespirePath(cfg) {
    /** shortcut - object building */
    sts = {};

    /** describing some data models here */
    sts.models = {
        /** point definition */
        point: function (x = 0, y = 0) {
            return { x: x, y : y };
        },

        /** a node definition (storing path straight line infos) */
        node: function (left = 1, straight = 1, right = 1) {
            return { left: left, straight: straight, right: right };
        },

        /** object used in the algorithm to know in which direction the path can go */
        check: function () {
            return {
                /** current steps */
                steps: {
                    /** calculated steps from the path left to the current path */
                    left: 0,
                    /** current path step */
                    last: 0,
                    /** current step from path right to the current path */
                    right : 0,
                },
                /** direction the path can use for the next step*/
                direction: {
                    left: true,
                    straight: true,
                    right: true
                },
                /** number of blocked directions */
                n: 0
            };
        }

    };

    /** datas */
    sts.datas = {
        /** general default config */
        config: {
            /** grid definition */
            grid: {
                /** size of a cell  */
                size: 40,
                /** number of rows  */
                rows: 15,
                /** number of columns */
                cols: 7,
                /** circle/point radius */
                radius: 5
            },
            /** number of pathes to draw. If equal zero it will random it */
            numberOfPathes: 0,
            /** number of time two pathes will cross each other ...*/
            numberOfXRoads: 2,
            /** distance between two xroads in grid row term **/
            gap: 2,
            /** number of steps at the beginning and the end of the path where an xroad cannot pop. */
            gridPadding : 1,
        },

        /** pathes storage 2D array ; pathes[grid.row][PathNumber]=grid.col */
        pathes: new Array(),

        /** storing on each grid point/step pathes length..  */
        nodes: {
            /** the node data */
            data: new Array(),
            /** on which index we are - in the algorithm*/
            rowIndex : 0
        },

        /** canvas (drawing) it should be handled better, but i focus on the algo, not implementing the drawing of it... */
        easelJS: {
            /** easeljs interface -- this is in raw, it should be in the config...  */
            stage: new createjs.Stage("demoCanvas"),

            /** graphical grid point coordinates */
            coordinates: new Array(),

            /** graphical path point coordinates */
            pathcoordinates: new Array(),

            /** the circles  */
            circles: new Array(),

            /** the lines */
            lines: new Array(),

            /** colours for the pathes : limiting to five  */
            colours: ["red", "green", "blue", "purple", "orange"],
        }
        

    };

    /** algorithm here */
    sts.algo = {

        /** 
         *  execute all the step of the algorithm 
         */
        all: function () {
            //VAR
            grid = sts.datas.config.grid;
            numberOfXRoads = sts.datas.config.numberOfXRoads;
            numberOfPathes = sts.datas.config.numberOfPathes;
            numberOfSteps = grid.rows;
            gap = sts.datas.config.gap; 
            gridPadding = sts.datas.config.gridPadding;
            CorridorSize = grid.cols / numberOfPathes;
            DefaultRightLimit = 0;

            // xroads....
            Xroads = sts.algo.CreateXroads(numberOfXRoads, numberOfPathes, numberOfSteps, gap, gridPadding);
            
            // pathes
            for (var i = 0; i < numberOfPathes; i++) {
                //VAR
                FirstPath = (i == 0) ? true : false;
                LastPath = (i == numberOfPathes - 1) ? true : false;
                LeftPath = (i == 0) ? new Array(grid.rows) : sts.datas.pathes[i - 1];
                PreviousXroad = (i == 0) ? new Array() : Xroads[i - 1];

                // creating a ''corridor'' limiting where the path will be randomly created . 
                corridor = sts.algo.CreatePathCorridor(CorridorSize, LeftPath, PreviousXroad, DefaultRightLimit, grid.cols - 1, FirstPath, LastPath);
                
                DefaultRightLimit = corridor.DefaultRightLimit;

                // creating and saving pathes 
                path = sts.algo.CreatePath(corridor.LeftLimit, corridor.RightLimit, Xroads[i]);
                sts.datas.pathes.push(path);
            }

            // sanity check 
            sts.algo.sanitycheck(sts.datas.pathes);

            // checking... and END OF ALGO...
            console.log("pathes steps grid row indexes "); 
            sts.datas.pathes.forEach(a => console.warn(JSON.stringify(a)));
            
            // in order to ''draw'' the pathes i need to change the pathes array structure .
            oldPathes = sts.datas.pathes;
            newPathes = new Array();

            for (var i = 0; i < grid.rows; i++) {
                newpath = new Array();
                for (var j = 0; j < numberOfPathes; j++) {
                    newpath.push(oldPathes[j][i]);
                }
                newPathes.push(newpath);
            }

            sts.datas.pathes = newPathes;

            // drawing ( out of the algo ) .
            sts.draw.all();
        },

        /**
         * create xroads between path with some constraints
         * @param {Number} numberOfXRoads , number of xroad between 2 pathes
         * @param {Number} numberOfPathes , number of desired pathes
         * @param {Number} numberOfSteps , number of steps or length of each path .
         * @param {Number} gap , gap between the xroads
         * @param {Number} gridPadding , number of steps at the start and end of the path where the xroad cannot ''spawn''
         * @return all the xroads between the pathes .
         */
        CreateXroads: function (numberOfXRoads, numberOfPathes, numberOfSteps, gap, gridPadding) {
            //VAR
            xroads = new Array();

            /**
             * the calculated xroads are base on the left right neighbour of the path.
             * - as we calculate xroads from the left path to right path, the last path has no right neighbour.
             * here we ignore the last path on the left 
             */
            for (var i = 0; i < numberOfPathes-1; i++) {
                xroad = new Array();
                // if it is the first path, we fake a ''previous '' xroads which respect the gap constraint.
                previousXroad = (i > 0) ? xroads[i - 1] : Array(numberOfXRoads).fill(-gap-1); 

                for (var j = 0; j < numberOfXRoads; j++) 
                    xroad.push(sts.algo.XroadGapHandling(xroad, previousXroad, gap, gridPadding, numberOfSteps));
                
                xroads.push(xroad);
            }

            //finally add fake indexes for the last path 
            xroad = new Array(numberOfXRoads).fill(-gap - 1);
            xroads.push(xroad);
            return xroads;
        },

        /**
         * calculate the next xroad index, with the gap constraint
         * @param {any} xroad, xroad being calculated
         * @param {any} previousXroad, the previous path xroad
         * @param {any} gap , gap or steps between xroads.
         * @param {Number} gridPadding , number of steps at the start and end of the path where the xroad cannot ''spawn''
         * @param {Number} numberOfSteps , number of steps or length of each path .
         * @return {Number} a compatible xroad index...
         */
        XroadGapHandling: function (xroad, previousXroad, gap, gridPadding, numberOfSteps) {
            reroll = false;
            
            // the xroad should not be ON the start neither at the end of the pathes . 
            cross = Math.floor(Math.random() * (numberOfSteps - gridPadding * 2)) + gridPadding;

            // the xroads on the selected path should respect the gap
            for (var k = 0; k < xroad.length; k++) {
                if (Math.abs(xroad[k] - cross) < gap)
                    reroll = true;
            }

            // the being calculated xroad on the selected path should respect the gap with the xroads of the previous path.
            for (var k = 0; k < previousXroad.length; k++) {
                if (Math.abs(previousXroad[k] - cross) < gap)
                    reroll = true;
            }

            // if the previous constraint are not respected , we reroll the cross calculation.
            cross = (reroll) ? sts.algo.XroadGapHandling(xroad, previousXroad, gap, gridPadding, numberOfSteps) : cross;

            return cross;

        },

        /**
         * create a ''corridor'' for the path, where it will be randomly calculated
         * @param {Number} CorridorSize : left calculated path
         * @param {Array} LeftPath : left calculated path
         * @param {Array} previousXroad : previous path Xroad
         * @param {Number} DefaultRightLimit : previous path default right limit.
         * @param {Number} DefaultRightLimit : previous path default right limit.
         * @param {Number} GridRightLimit : limit of the grid on the right. Path should be in grid bounds...
         * @param {boolean} FirstPath : are we on the first path ?
         * @param {boolean} FirstPath : are we on the last path ?
         */
        CreatePathCorridor: function (CorridorSize, LeftPath, PreviousXroad, DefaultRightLimit,GridRightLimit, FirstPath = false,LastPath=false) {
            
            corridor = {
                LeftLimit : new Array(),
                RightLimit : new Array(),
                DefaultRightLimit : -1
            }

            //1st Path
            if (FirstPath) {
                corridor.LeftLimit = new Array(LeftPath.length).fill(0);
                corridor.DefaultRightLimit = (CorridorSize - Math.floor(CorridorSize) == 0) ? CorridorSize : Math.floor(CorridorSize) + 1;
                corridor.RightLimit = new Array(LeftPath.length).fill(corridor.DefaultRightLimit);
            }

            //the other Pathes
            else {
                //=> 1/ left limits :
                // when we random calculate the path, the random should INCLUDE the leftlimit values...
                // the corridor should not cross the left path , except when there is an xroad
                corridor.LeftLimit = new Array();
                for (var i = 0; i < LeftPath.length; i++) {
                    topush = (PreviousXroad.includes(i)) ? LeftPath[i] : LeftPath[i] + 1;
                    corridor.LeftLimit.push(topush);
                };


                // => 2/ Default right limit
                if (LastPath) //are we on the last path ? 
                    corridor.DefaultRightLimit = GridRightLimit;
                else 
                    corridor.DefaultRightLimit = DefaultRightLimit + Math.floor(CorridorSize);

                // => 3/ right limit
                corridor.RightLimit = Array(LeftPath.length).fill(corridor.DefaultRightLimit);



                
                // now since we force some xroad, the right limit ''change '' when we approach the xroad...
                // on both xroad side ... 
                
                // end to beginning
                for (var i = corridor.RightLimit.length - 2; i > -1; i--) {
                    
                    // first case , are we on an xroad ?
                    if (PreviousXroad.includes(i)) {
                        corridor.RightLimit[i] = corridor.LeftLimit[i];
                    }
                    //second case is the next rightlimit not the default limit ? we approach the default limit step by step.
                    else if (corridor.RightLimit[i + 1] != corridor.DefaultRightLimit) {
                        corridor.RightLimit[i] = corridor.RightLimit[i + 1] + 1;
                    }
                };

                

                //beginning to end .
                isAfterXroad = false;
                for (var i = 1; i < corridor.RightLimit.length; i++) {
                    
                    // first case, are we on an xroad ?
                    if (PreviousXroad.includes(i))
                        isAfterXroad = true;
                    // are we after the xroad ?
                    else if (isAfterXroad == true) {
                        //second case is the next rightlimit not the already computed limit ? we approach the default limit step by step.
                        if (corridor.RightLimit[i - 1] < corridor.RightLimit[i])
                            corridor.RightLimit[i] = corridor.RightLimit[i - 1] + 1;
                        else
                            isAfterXroad = false;
                    }

                    
                }
            }
            return corridor;
        },

        /**
         * create a path , knowing its limits
         * @param {any} LeftLimit , limit on the left
         * @param {any} RightLimit , limit on the right 
         * @param {any} xroad, xroad constraint with the path to the right
         * @returns a calculated path
         */
        CreatePath: function (LeftLimit, RightLimit, xroad) {
            //VAR
            path = new Array();

            //first step
            extend = RightLimit[0] - LeftLimit[0];
            path.push(Math.floor(Math.random() * (extend + 1)) + LeftLimit[0]);


            
            //the rest
            for (var i = 1; i < LeftLimit.length; i++) {
                //xroad constraint ....
                // - when the next step is an xroad, path cannot go to the left( else the path to the right automatically cross the road before the defined xroad)
                // - when the now step is the xroad, the path cannot go to the right ( else the path to the right recross the road after the defined xroad ) .

                if (xroad.includes(i))
                    LeftLimit[i] = path[i - 1];
                if (xroad.includes(i - 1))
                    RightLimit[i] = (RightLimit[i] - path[i - 1] < 0) ? RightLimit[i] : path[i - 1]; // respecting corridor enveloppe
                path.push(sts.algo.nextStep(LeftLimit[i], path[i - 1], RightLimit[i]));
            }
            return path;
        },

        /**
         * calculate the next step, with left/right 
         * @param {number} left : next step left limit
         * @param {number} prev : previous step
         * @param {number} right : next step right limit
         * @returns the next step
         */
        nextStep: function (left, prev, right) {
            // direction can be left(-1) straight(0) and right(1)
            // this algorithm is correct if we assume that we diagonnaly move. Eg if we assume we do only one step on the left, not 4 5 or 6 steps on the left.. 

            if (left == right) // next step is left or right..
                { direction = 0; prev = left; }
            else if (prev < left) // direction is 1
                direction = 1;
            else if (prev == left)  // direction is 0 1
                direction = Math.floor(Math.random() * 2);
            else if (prev > right) // direction is -1
                direction = -1;
            else if (prev == right) // direction is -1 0
                direction = Math.floor(Math.random() * 2) - 1;
            else // direction is -1 0 1
                direction = Math.floor(Math.random() * 3) - 1;

            return prev + direction;
        },

        
         /**
          * check if the pathes are '' as intended ''
          * @param {array[][]} pathes : the pathes ...
          */
        sanitycheck: function (pathes) {

            // big gap on the path .
            for (var i = 0; i < pathes.length; i++) {
                for (var j = 0; j < pathes[0].length-1; j++) {
                    if (Math.abs(pathes[i][j] - pathes[i][j + 1] > 1))
                        console.warn("Path " + (i + 1) + " between steps " + j + " and " + (j + 1) + " have a gap of " + (Math.abs(pathes[i][j] - pathes[i][j + 1])));
                }
            }

            // two pathes following the same way for a certain time . 
            SharingSteps = 0;
            startSharing = -1;
            for (var i = 0; i < pathes.length - 1; i++) {
                for (var j = 0; j < pathes[0].length; j++) {

                    // sharing a way ?
                    if (pathes[i][j] - pathes[i + 1][j] == 0) {
                        SharingSteps++;
                        // start of sharing ???
                        if (startSharing == -1)
                            startSharing = j;
                    }
                    // not sharing a way ? 
                    else {
                        // end of sharing ?
                        if (startSharing != -1) {
                            // checking if it is only an xroad ... 
                            if (j - startSharing == 1) {
                                // we do nothing...
                            }
                            else {
                                console.warn("pathes " + (i + 1) + " and " + (i + 2) + " shared " + SharingSteps + " steps from step " + startSharing + " to " + (j-1));
                            }

                            // resetting counters 
                            startSharing = -1;
                            SharingSteps = 0;
                        }
                    }
                        
                };
                // can be from somewhere to the end of the path , the sharing .... 
                if (startSharing != -1) {
                    console.warn("pathes " + (i + 1) + " and " + (i + 2) + " shared " + SharingSteps + " steps from step " + startSharing + " to " + pathes[0].length-1);
                }
                startSharing = -1;
                SharingSteps = 0;

            }
            
        },
    };

    /** drawing using easelJS */
    sts.draw = {
        /** 
         *  execute all the functions related to the drawing.
         *  
         */
        all: function () {
            sts.draw.pathCoordinates();
            sts.draw.cirleCreate();
            sts.draw.pathCreate();
            sts.draw.stageAll();
        },

        /**
         * compute the graphical coordinates of the path points.
         */
        pathCoordinates: function () {
            //VAR
            pathes = sts.datas.pathes;
            coordinates = sts.datas.easelJS.coordinates;
            pathCoords = sts.datas.easelJS.pathcoordinates;

            

            //computing point coords for the pathes
            for (var i = 0; i < pathes.length; i++) {
                oneStep = new Array();
                for (var j = 0; j < pathes[0].length; j++) {
                    oneStep.push(coordinates[i][pathes[i][j]]); //  coordinates[grid.row][<pathes[grid.row][MyPathNumber]>==<grid.col>]
                }
                pathCoords.push(oneStep);
            }
        },

        /**
         *  create the circles..
         */
        cirleCreate: function () {
            //VAR
            pathCoords = sts.datas.easelJS.pathcoordinates;
            radius = sts.datas.config.grid.radius;
            
            circles = new Array();

            for (var i = 0; i < pathCoords.length; i++) {
                Aline = new Array();
                for (var j = 0; j < pathCoords[0].length; j++) {
                    coords = pathCoords[i][j];
                    circle = new createjs.Shape();
                    circle.graphics.beginFill("black").drawCircle(coords.x, coords.y, radius);
                    Aline.push(circle);
                }
                circles.push(Aline);
            }

            sts.datas.easelJS.circles = circles;
        },

        /** 
         *  creating the pathes 
         */
        pathCreate: function () {
            //VAR
            colours = sts.datas.easelJS.colours;
            pathCoords = sts.datas.easelJS.pathcoordinates;
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

            //saving it 
            sts.datas.easelJS.lines = lines;
        },

        /** 
         *   stage all the created geometries, and drawing them
         */
        stageAll: function () {
            //VAR 
            stage = sts.datas.easelJS.stage;

            // adding the circles to the stage...
            for (var i = 0; i < pathes.length; i++) {
                for (var j = 0; j < pathes[0].length; j++) {
                    stage.addChild(circles[i][j]);
                }
            }

            // adding the lines to the stage
            for (var i = 0; i < pathes.length; i++) {
                stage.addChild(lines[i]);
            };

            // drawing it ..
            stage.update();
        }
    }

    /** some unnecessary cryptic js tools xD */
    sts.toolbox = {

        /**
           * this function compare two  objects, feed one object with the other .
           * it goes on the nth level of the objects...
           * Eg : a default config, which will be filled by the user config 
           * the user config might not have all the values of the default config .... 
           * @param {object} model : the default object  (eg default config)
           * @param {object} tofill : the filling object (eg user config)
           */
        objectEqualize: function (model, tofill) {
            Object.keys(model).forEach(
                key => tofill[key] =
                    (tofill[key] == undefined)
                        ? model[key]
                        : (tofill[key].constructor.name == "Object") ? st.tools.objectEqualize(model[key], tofill[key]) : tofill[key]);
            return tofill;
        }
    };

    /** initialisation/ main program here */
    sts.init = {

        /**
         * initialize everything here 
         * @param {sts.datas.config} config ; see the default config in datas section.
         */
        all: function (config) {
            sts.init.configUpdate(config);
            if (sts.init.checklimits()) 
                return;
            sts.init.coordinates();
            sts.init.checklimits();
            sts.init.numberOfPathes();

            // algos...
            sts.algo.all();
        },

        /**
         *  update the default config if necessary
         * @param {sts.data.config} config
         */
        configUpdate(config) {
            //VAR
            oE = sts.toolbox.objectEqualize;
            
            // handling the configuration... if something has changed..
            if (config != undefined )
                sts.datas.config = oE(sts.datas.config, config);
        },

        /**
         * check if the parameters are compatible with the algorithm ....
         */
        checklimits: function () {
            //VAR
            cfg = sts.datas.config;
            
            // 1/xroad issues  : 
            // all the xroad are separated by a gap . 
            // if we say that : 
            // => each road has a lenght of 15 steps ( or a grid size of 15 rows ) 
            // => the grid padding is 1 :  no xroads can be on the first and the last step of the path
            // => meaning the steps taken into consideration to put the xroads is 15-1-1 = 13 steps...
            // => each road have 3 xroads with a neighbourgh path.
            // => in the algo , we first caculate the xroads with the left path, then with the right path .
            // => the gap or '' distance'' between xroads is 2 
            // => we can have this case with the left path: [1][2][X][4][5][6][7][X][9][10][XX][13]
            // => then we are blocked with the right path : [Y][2][X][4][Y][6][7][X][9][10][XX][13] <= missing one Y
            steps = cfg.grid.rows - cfg.gridPadding * 2;
            xroadCovering = cfg.numberOfXRoads * cfg.gap * 2 + cfg.gap * 2;// gap between xroads + gap at the end and begenning of the path...
            if (steps - xroadCovering < 0) { 
                console.warn("too many xroad per paths ("+cfg.numberOfXRoads+"), or gap ("+cfg.gap+") too important , or not enought steps ("+cfg.grid.rows+") per pathes, or grid padding ("+cfg.gridPadding+") too long...");
                console.log("steps = number of grid rows - grid padding *2");
                console.log("xroad covering = number of xroads * gap*2 + gap *2");
                console.log(" if steps - xroad covering < 0 , then algorithm might fail");
                console.log("//steps = number of steps ( or row index) where the xroad can be ");
                console.log("//grid padding = number of steps at the begenning and the end of the path ( or the grid ) where xroad cannot ''pop'' ");
                console.log("// xroadcovering = maximum steps blocked on a path by the xroads of its left neighbourgh. those blocked steps cannot be used to calculate xroads with its right neighbour");
                console.warn("EG : gris rows = 15 , grid padding = 1, number of xroads = 3, gap = 2");
                console.warn("step is then 13");
                console.warn("xroad covering is then 16");
                console.warn("13 < 16 , bad configuration");
                return true;
            }

            return false;
        },

        /**
         * calculate grid point coordinates in pixels 
         */
        coordinates() {
            //VAR
            grid = sts.datas.config.grid;
            point = sts.models.point;
            coords = sts.datas.easelJS.coordinates;

            // easelJS grid coordinates. ( in pixel ) 
            for (var i = 0; i < grid.rows; i++) {
                arow = new Array();
                for (var j = 0; j < grid.cols; j++) {
                    arow.push(point((j + 1) * grid.size, (i + 1) * grid.size));
                }
                coords.push(arow);
            }
        },

        /**
         * check the number of pathes
         * */
        numberOfPathes() {
            // if number of pathes have been configured  - or in default cfg being equal to 0, the we calculate it, cf below.

            //VAR
            numberOfPathes = sts.datas.config.numberOfPathes;
            grid = sts.datas.config.grid;

            // randomize it between [2,grid colum/2] if = 0
            if (numberOfPathes == 0) {
                numberOfPathes = Math.ceil(Math.random() * (grid.cols / 2 - 2)) + 2;
                // .. and we store it 
                sts.datas.config.numberOfPathes = numberOfPathes;

            };
        }
     };

    sts.init.all(cfg);
    /** finally return the object */
    return sts;
}

// aaand.. FIre !
S = slaythespirePath();
