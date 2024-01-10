
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
            /** max straight step that a path can do .*/
            pathSegment : 4,
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
            sts.algo.firstStep();
            sts.algo.main();
            sts.draw.all();
        },

        /** 
         *  initialize the pathes  and create the first steps
         */
        firstStep : function () {
           //VAR
            numberOfPathes = sts.datas.config.numberOfPathes;
            pathes = sts.datas.pathes;
            grid = sts.datas.config.grid;

            // randomize it between [2,grid colum/2] if = 0
            if (numberOfPathes == 0) {

                numberOfPathes = Math.ceil(Math.random() * (grid.cols / 2 - 2)) + 2; 
                // .. and we store it 
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
                sts.datas.nodes.rowIndex = i;
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
                //VAR
                check = sts.models.check();
                  
                check.steps.left = (i == 0) ? 0 : NS[i - 1]; 
                check.steps.last = LastSteps[i];
                check.steps.right = (i == numberOfPathes - 1) ? grid.cols - 1 : LastSteps[i + 1]; 
                
                // path storage
                NS.push(sts.algo.NEXT(check));

            }
            return NS;
        },

        /**
         * knowing a path step ( or row index) , returns the next step to do for this  path
         * @param {sts.model.check} check : used to target blocked path
         * @returns the next step

         */
        NEXT: function (check) {
            /**
             * this time we have more than one constraint. 
             * in order to calculate a path direction , we need an object usable by n constraints and that could be used to calculate the direction
             * this is object ''check '' , play that role , gathering infos on the direction from n constraints, and then being used to calculate the direction.
             * 
             * still in this algorithm, the ''Xcross'' constraint prevail on the ''straight'' constraint . a few case raises where all the pathes are blocked. 
             * we roll back then only on the ''Xcross'' constraint , which mainly consist on being sure that our pass does not cross each other,
             * and more importantly that they do not go outside the grid...
             * 
             * 
             * 
             */

            //constraint : pathes should not cross each other 
            check = sts.algo.XCROSS(check);

            //constraint : crooking - path should no go n steps straight 
            check = sts.algo.CROOKING(check);

            //calculate the direction
            direction = sts.algo.DIRECTION(check);
           

            //finally return the next step...
            return check.steps.last + direction;
        },

        /**
         * Verify the X cross constraints...
         * @param {sts.model.check} check : used to target blocked path
         * @returns the modified check...
         */
        XCROSS: function (check) {
            //VAR
            grid = sts.datas.config.grid;

            /** here we exploded the last algo logic , in order to know which path we cannot take  
             *  this time we have the straight path constraint too, so we cannot calculate directly a direction to take...
             */
            if (check.steps.last < check.steps.left) { // THE xcrossing case..
                check.direction.left = false;
                check.direction.straight = false;
            }
            else if (check.steps.last == 0) { // getting outside the left side of the grid 
                check.direction.left = false
            }
            else if (check.steps.left == grid.cols - 1) { // Getting outside the right side of the grid
                check.direction.left = false;
                check.direction.right = false;
            }
            else if (check.steps.last == check.steps.left) { // can only go straight or right ?
                check.direction.left = false;
            }
            else if (check.steps.last == check.steps.right) { // can only go straight or left ?
                check.direction.right = false;
            }

            return check;
        },

        /**
         * making path no so straight
         * @param {sts.model.check} check : used to target blocked path
         * @returns the modified check...
         */
        CROOKING: function (check) {
            //VAR
            nodes = sts.datas.nodes.data; // grid points or possible steps on the grid
            rowIndex = sts.datas.nodes.rowIndex; // on which row we are working.
            SegmentLength = sts.datas.config.pathSegment; // max step on a path
            currentNode = nodes[rowIndex][check.steps.last]; // on which point - step we are 

            if (currentNode.left > SegmentLength - 1) { // we have max steps straight on the left direction..
                check.direction.left = false;
            }
            if (currentNode.straight > SegmentLength - 1) { // we have max steps straight on the straight direction..
                check.direction.straight = false;
            }
            if (currentNode.right > SegmentLength - 1) { // we have max steps straight on the right direction..
                check.direction.right = false;
            }

            return check;
        },

        /**
         * which direction then ? 
         * @param {sts.model.check} check : used to target blocked path
         * @returns the direction
         */
        DIRECTION: function (check) {
            // how many steps are blocked..
            if (check.direction.left == false)
                check.n++;
            if (check.direction.straight == false)
                check.n++;
            if (check.direction.right == false)
                check.n++;


            /** calculating next direction ... */
            // we always take left - straight - right in this order to assign the random value.
            direction = 0;
            if (check.n == 1) { // 1 path is restricted - 2 choices 
                rnd = Math.round(Math.random());
                if (check.direction.left == false) { // possibility : (STRAIGHT RIGHT)
                    direction = (rnd == 0) ? 0 : 1;
                }
                else { // 2 possibilities
                    if (check.direction.straight == false) { // possibility : (LEFT RIGHT)
                        direction = (rnd == 0) ? -1 : 1;
                    }
                    else { // possibility : (LEFT STRAIGHT)
                        direction = (rnd == 0) ? -1 : 0;
                    }
                }

            }
            else if (check.n == 2) { // 2 pathes are restricted - unique choice

                if (check.direction.left == true) direction = -1;
                if (check.direction.straight == true) direction = 0;
                if (check.direction.right == true) direction = 1;

            }
            else { // 3 pathes are restricted , or no pathes are restricted. we drop the constraint straight path and take the previous algo.

                direction = (check.steps.last < check.steps.left) ? 1 // left path shared a point with the selected path. left path went on the right . selected path should follow...
                    : (check.steps.left == grid.cols - 1) ? 0 // the case :  selected path is on the right border of the grid.Its left neighbour went on the right border of the grid. the selected path can only go straight up.
                        : (check.steps.last == check.steps.left) ? Math.round(Math.random())
                            : (check.steps.last == check.steps.right) ? - Math.round(Math.random())
                                : Math.ceil(Math.random() * 3) - 2;
            }




            /** stocking the next direction information */
            if (direction == -1)
                nodes[rowIndex + 1][check.steps.last + direction].left = currentNode.left + 1;
            if (direction == 0)
                nodes[rowIndex + 1][check.steps.last + direction].straight = currentNode.straight + 1;
            if (direction == 1)
                nodes[rowIndex + 1][check.steps.last + direction].right = currentNode.right + 1;

            // finally returning the direction.
            return direction;

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
            sts.init.coordinates();
            sts.init.nodes();
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

        /** initialize the grid , with path step basic information */
        nodes() {
            //VAR
            grid = sts.datas.config.grid
            nodes = new Array();
            node = sts.models.node;
            for (var i = 0; i < grid.rows; i++) {
                Aline = new Array();
                for (var j = 0; j < grid.cols; j++) {
                    Aline.push(node());
                }
                nodes.push(Aline);
            }

            sts.datas.nodes.data = nodes;
            
        }
    };

    sts.init.all(cfg);
    /** finally return the object */
    return sts;
}

// aaand.. FIre !
S = slaythespirePath();
