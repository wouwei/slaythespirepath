
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

            

        },

        /** pathes storage 2D array ; pathes[grid.row][PathNumber]=grid.col */
        pathes: new Array(),

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
            sts.algo.firstStep();
            sts.algo.main();
            sts.draw.all();
        },

        /** 
         *  initialize the pathes  and create the first steps
         */
        firstStep : function () {
           //VAR
            numberOfPathes = sts.datas.config.numberOfPathes; // !! not a reference but a copy of the value... ( because it is a number )
            pathes = sts.datas.pathes;
            grid = sts.datas.config.grid;

            // randomize it between [2,grid colum/2] if = 0
            if (numberOfPathes == 0) {

                //#region some explanation ...

                /**
                 * why -2 then +2 ?
                 * rand gives always a result from 0 to 1 ..
                 * eg : number of columns = 10
                 * 10/2 = 5 . but we dont want to rand [0,5]
                 * 5-2 = 3 . rand [0,3]
                 * then +2 = rand [0+2,3+2] = [2,5]
                 */

                 //#endregion some explanation ...
                numberOfPathes = Math.ceil(Math.random() * (grid.cols / 2 - 2)) + 2; 
                // .. and we store it ..  numberofpathes is a copy, not a reference...
                sts.datas.config.numberOfPathes = numberOfPathes;
                
            };

            // first steps .. 
            firstSteps = new Array();

            for (var i = 0; i < numberOfPathes; i++) {
                firstSteps.push(Math.ceil(Math.random() * grid.cols) - 1);
            };

            // pathes should have steps from left to the right .. 
            pathes.push(firstSteps.sort());
        },

        /**
         * heart of the algorithm
         */
        main: function () {
            //VAR
            pathes = sts.datas.pathes;
            grid = sts.datas.config.grid;

            for (var i = 0; i < grid.rows - 1; i++) {
                // #########################################################################
                // ## the below code it the longer and explained version of the algorithm##
                // #########################################################################
                LastSteps = pathes[pathes.length - 1]; // we take the latest steps for all the pathes 
                NextSteps = sts.algo.NEXTSTEPS(LastSteps) // we calculate the next steps based on the latest step 
                // => pathes.push(NextSteps); // we store it ... 

                // #############################
                // ## the compressed algorithm##
                // #############################
                pathes.push(sts.algo.NEXTSTEPS(pathes[pathes.length - 1]));
                
            };
            
        },

        /**
         * handle the next steps for all the pathes... 
         * @param {Array} LastSteps : all the pathes last steps
         * @returns the next steps .
         */
        NEXTSTEPS(LastSteps) {
            //VAR
            NS = new Array();
            grid = sts.datas.config.grid;
            numberOfPathes = sts.datas.config.numberOfPathes;

            // path by path , from left to right....
            for (var i = 0; i < numberOfPathes; i++) {
                leftStep = (i == 0) ? 0 : NS[i - 1]; // remember, left path is already calculated.. 
                rightStep = (i == numberOfPathes - 1) ? grid.cols - 1 : LastSteps[i + 1]; // right path is not yet calculated...

                NS.push(sts.algo.NEXT(leftStep, LastSteps[i], rightStep));

            }
            return NS;
        },

        /**
         * knowing a path step ( or row index) , returns the next step of this path
         * constraints are not crossing the the neightbourgh pathes
         * @param {number} leftStep : step taken by the path on the left of the selected path ( remember we calculate steps from the left to the right )
         * @param {number} lastStep : the step / column index of the current row
         * @param {number} rightStep : the laststep done by the path on the right of the selected path ( not calulated yet , since we calculate from the left to the right)
         */
        NEXT : function (leftStep, lastStep, rightStep) {
            //VAR
            grid = sts.datas.config.grid;

            // #########################################################################
            // ## the below code it the longer and explained version of the algorithm##
            // #########################################################################

            // in the ''naive'' algo we were limiting the path steps between the left and right side of the grid.. here , we limit the path between its path neighbours.
            // check out the NEXSTEPS function , but regarding the neighbour pathes
            // if the path we work on is the last one on the left, the leftstep is the left grid value (0 in that case ) 
            // if the path we work on is the last one on the right, the rightstep is the right grid value ( 6 by default - 7 columns ).
            // nexstep is the direction the leftstep should take : left (-1) straight(0) right(1)
            Nextstep = (lastStep == leftStep) ? Math.round(Math.random())
                : (lastStep == rightStep) ? - Math.round(Math.random())
                    : Math.ceil(Math.random() * 3) - 2;

            /** in this scenario . two cases are missing */

            // => left path shared a point with the selected path.left path went on the right.selected path should follow...
            // eg leftstep = 3 (already calculated step) , laststep = 2 .. Nextstep must lead to 3
            Nextstep = (lastStep < leftStep) ? 1 : Nextstep;

            // => selected path is on the right side of the grid. left path goes on the right side of the grid. selected path should stay on the right side of the grid...
            Nextstep = (leftStep == grid.cols - 1) ? 0: Nextstep;

            // #############################
            // ## the compressed algorithm##
            // #############################
            Nextstep = (lastStep < leftStep) ? 1 // left path shared a point with the selected path. left path went on the right . selected path should follow...
                : (leftStep == grid.cols - 1) ? 0 // the case :  selected path is on the right border of the grid.Its left neighbour went on the right border of the grid. the selected path can only go straight up.
                    : (lastStep == leftStep) ? Math.round(Math.random())
                        : (lastStep == rightStep) ? - Math.round(Math.random())
                            : Math.ceil(Math.random() * 3) - 2;

        return lastStep + Nextstep;
    }


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
            console.log(circles);
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
            sts.init.coordinates();
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
         * calculate grid point coordinates in pixels 
         */
        coordinates() {
            //VAR
            grid = sts.datas.config.grid;
            point = sts.models.point;
            coords = sts.datas.easelJS.coordinates;

            for (var i = 0; i < grid.rows; i++) {
                arow = new Array();
                for (var j = 0; j < grid.cols; j++) {
                    arow.push(point((j + 1) * grid.size, (i + 1) * grid.size));
                }
                coords.push(arow);
            }
        },
        
    };

    sts.init.all(cfg);
    /** finally return the object */
    return sts;
}

// aaand.. FIre !
S = slaythespirePath();
