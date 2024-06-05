/*
This script is for plans to upgrade the lumberjack job on the Gramados server.
The final goal is to have a region with several values that will allow some trees grow. When a tree grows, it will change the region variables causing the player needing to prepare the area for fancyer and more expensive trees to grow.
*/


//var quality = 1;
var quality = Math.random() * 2;

// Init the item with custom texture
function init(event) {
    // Get the item
    var item = event.item;
    item.setDurabilityValue(10);
    item.setDurabilityShow(false);
    item.setCustomName("§6§lRandom Tree Spawner");

    return true;
}

function tick(event) {
    //get the player
    var player = event.player;
    //randoim quality
    quality = Math.random() * 2;
    //player.message("Quality: " + quality);
    return true;
}

// Script for scripted block that spawns a tree above it when interacted with
function interact(event) {
    buildTree(event);
    return true;
}

// Function to check if a point is inside a box
function isInside(x, y, z, x1, y1, z1, x2, y2, z2) {
    var inside = false;
    if ((x >= x1 && x <= x2) || (x <= x1 && x >= x2)) {
        if ((y >= y1 && y <= y2) || (y <= y1 && y >= y2)) {
            if ((z >= z1 && z <= z2) || (z <= z1 && z >= z2)) {
                inside = true;
            }
        }
    }
    return inside;
}

// Funtion to build a tree above the scripted block
function buildTree(event) {
    // var block_location = event.block.getPos();
    // For scripted item, get the position of the block the player used the item on
    var block_location = event.target.getPos();
    var world = event.player.getWorld();
    //block_location is type IPos
    var x = block_location.getX();
    var y = block_location.getY();
    var z = block_location.getZ();
    
    var placeholder = "minecraft:sponge:0";
    var log = "minecraft:log:0";
    var leaves = "minecraft:leaves:0";
    //var tree = treetypeSequoia(log, leaves, placeholder, quality);

    //get a random integer between 0 1 or 2
    var tree_type = Math.floor(Math.random() * 3);
    switch (tree_type) {
        case 0:
            // generate a tall oak tree
            log = "minecraft:log:0";
            leaves = "minecraft:leaves:0";
            var tree = treetypeTallOak(log, leaves, placeholder, quality);
            break;
        case 1:
            // generate a pine tree
            log = "forestry:logs.5:0";
            leaves = "minecraft:leaves:1";
            var tree = treetypePine(log, leaves, placeholder, quality);
            break;
        case 2:
            // generate a sequoia tree
            log = "forestry:logs.1:3";
            leaves = "minecraft:leaves:1";
            var tree = treetypeSequoia(log, leaves, placeholder, quality);
            break;
    }

    //offset teh tree for the center to be above the block
    var offset_x = Math.floor(tree[1][0] / 2);
    var offset_z = Math.floor(tree[1][2] / 2);


    // build the array in the world
    build3DArray(tree[0], x - offset_x, y + 1, z - offset_z, world);
    //build3DArray(tree, x, y + 1, z, world);

    return true;
}


// algorithm to generate a tree of type tall oak. return a 3D array with the tree blocks
function treetypeTallOak(log, leaves, placeholder, quality) {
    //if quality under 1, set to 1
    var quality_size = quality;
    if (quality_size < 1) {
        quality_size = 1;
    }
    //quality is a number from 0 to 1. 0 is a small tree, 1 is a big tree
    //log is the block type for the log
    //leaves is the block type for the leaves
    //the tree will be a 3D array with the blocks [5][50][5]
    var tree_size = [5, Math.floor(quality_size*60), 5]
    var tree = new Array(tree_size[0]);
    for (var x = 0; x < tree_size[0]; x++) {
        tree[x] = new Array(tree_size[1]);
        for (var y = 0; y < tree_size[1]; y++) {
            tree[x][y] = new Array(tree_size[2]);
            for (var z = 0; z < tree_size[2]; z++) {
                tree[x][y][z] = null;
            }
        }
    }

    // Segmentise into layers, on a 20 basis.
    /*
        Quality of 1: 50 tall
        Quality of 0: 16 tall
    */
    /*
        Each layer is minimum 1 block tall.
        each layer is in 20ths of the tree height
        0 - 16: log - DONE
        0 - 3: root layer - DONE
        7 - 10: lower random leaves
        10 - 11: lower leaves
        11 - 16: main leaf body
        (12 - 15): leaf body random
        16 - 17: upper leaves thick
        17 - 18: upper leaves thin
        18 - 20: upper random leaves
    */

    // Tree Height: minimum 16, maximum 50
    var tree_height = Math.floor(16 + 34 * quality);

    /// LOG OF THE TREE ///

    /*
    The log is 1 block in the center of the tree
    */

    var log_height = Math.floor(tree_height * 0.8);
    for (var y = 0; y < log_height; y++) {
        tree[2][y][2] = log;
    }

    // ROOTS OF THE TREE //

    /*
    The roots are a cross around the log, random height, minimum 1 block
    */
    var root_height = Math.floor(tree_height * 0.15);
    // for each of the 4 roots, get a random height between 1 to root_height
    for (var i = 0; i < 4; i++) {
        var root = Math.floor(1 + Math.random() * root_height);

        // switch on the 4 roots: root 1 is the north root, root 2 is the east root, root 3 is the south root, root 4 is the west root
        switch (i) {
            case 0:
                // north root
                for (var y = 0; y < root; y++) {
                    tree[2][y][1] = log;
                }
                break;
            case 1:
                // east root
                for (var y = 0; y < root; y++) {
                    tree[3][y][2] = log;
                }
                break;
            case 2:
                // south root
                for (var y = 0; y < root; y++) {
                    tree[2][y][3] = log;
                }
                break;
            case 3:
                // west root
                for (var y = 0; y < root; y++) {
                    tree[1][y][2] = log;
                }
                break;
        }
    }

    // LOWER RANDOM LEAVES OF THE TREE //

    var lower_leaves_random = getBounds(7, 10, tree_height, 20);
    for (var i = lower_leaves_random[0]; i < lower_leaves_random[1]; i++) {
        if (Math.random() < 0.5) {
            tree[1][i][2] = leaves;
        }
        if (Math.random() < 0.5) {
            tree[3][i][2] = leaves;
        }
        if (Math.random() < 0.5) {
            tree[2][i][1] = leaves;
        }
        if (Math.random() < 0.5) {
            tree[2][i][3] = leaves;
        }
    }

    // LOWER LEAVES OF THE TREE //

    var lower_leaves = getBounds(10, 11, tree_height, 20);
    for (var i = lower_leaves[0]; i < lower_leaves[1]; i++) {
        //place 4 blocks on each side of the log
        tree[1][i][2] = leaves;
        tree[3][i][2] = leaves;
        tree[2][i][1] = leaves;
        tree[2][i][3] = leaves;
    }

    // MAIN LEAF BODY OF THE TREE //

    var main_leaf_body = getBounds(11, 16, tree_height, 20);

    //from top of log to leaf_heigh under it, fill with a 3*3 leaves
    for (var y = main_leaf_body[0]; y < main_leaf_body[1]; y++) {
        for (var x = 1; x < 4; x++) {
            for (var z = 1; z < 4; z++) {
                if (tree[x][y][z] != log) {
                    tree[x][y][z] = leaves;
                }
            }
        }
    }

    // LEAF BODY RANDOM OF THE TREE //

    var leaf_body_random = [main_leaf_body[0] + 1, main_leaf_body[1] - 2];
    
    fillZone([0, leaf_body_random[0], 1], [0, leaf_body_random[1], 3], leaves, 0.6, tree);
    fillZone([1, leaf_body_random[0], 0], [3, leaf_body_random[1], 0], leaves, 0.6, tree);
    fillZone([1, leaf_body_random[0], 4], [3, leaf_body_random[1], 4], leaves, 0.6, tree);
    fillZone([4, leaf_body_random[0], 1], [4, leaf_body_random[1], 3], leaves, 0.6, tree);

    // UPPER LEAVES THICK OF THE TREE //

    var upper_leaves_thick = getBounds(16, 17, tree_height, 20);
    //log("Upper leaves thick: " + upper_leaves_thick[0] + " to " + upper_leaves_thick[1]);
    for (var i = upper_leaves_thick[0]; i < upper_leaves_thick[1]; i++) {
        tree[1][i][2] = leaves;
        tree[3][i][2] = leaves;
        tree[2][i][1] = leaves;
        tree[2][i][3] = leaves;
        tree[2][i][2] = leaves;
    }

    // UPPER LEAVES THIN OF THE TREE //

    var upper_leaves_thin = getBounds(17, 18, tree_height, 20);
    for (var i = upper_leaves_thin[0]; i < upper_leaves_thin[1]; i++) {
        tree[2][i][2] = leaves;
    }

    // UPPER RANDOM LEAVES OF THE TREE //

    var upper_leaves_random = getBounds(18, 20, tree_height, 20);
    // get a random height within the bounds
    var margin = upper_leaves_random[1] - upper_leaves_random[0];
    var random_height = Math.floor(upper_leaves_random[0] + Math.random() * margin);
    // fill the top of the tree with leaves
    for (var i = upper_leaves_random[0]; i < random_height; i++) {
        tree[2][i][2] = leaves;
    }

    return [tree, tree_size];
}

// algorithm to generate a tree of type pine. return a 3D array with the tree blocks
function treetypePine(log, leaves, placeholder, quality) {
    //log("Generating a pine tree with log " + log + " and leaves " + leaves + " with quality " + quality);
    //if quality under 1, set to 1
    var quality_size = quality;
    if (quality_size < 1) {
        quality_size = 1;
    }
    // Segmentise into layers, on a 10 basis.
    /*
        Quality of 1: 30 tall log (33 tall tree)
        Quality of 0: 10 tall log (13 tall tree)
    */

    // generate log height
    var log_height = Math.floor(10 + 20 * quality);
    // generate an x log
    var log_array = createLogX(log_height, 6, 12, log, placeholder);

    //update log_height to height of log_array
    log_height = log_array[0].length;

    // Create a leaf cap: 3x3 cross, of 2 tall
    //log("Creating leaf cap with leaves " + leaves);
    var cap = createX(3, leaves);
    //display2DArray(cap);
    cap = increase_2D_to_3D(cap, 2);
    //display3DArray(cap);

    var cap2 = createX(1, leaves);
    //display2DArray(cap2);
    cap2 = increase_2D_to_3D(cap2, 2);

    //display3DArray(cap2);

    //get center
    var center = Math.floor(log_array.length / 2);

    var cap = concatenate3DArrays(cap, cap2, 1, 2, 1);

    var tree = concatenate3DArrays(log_array, cap, center - 1, log_height - 1, center - 1, false);
    var increase_scale = 5 * quality;
    if (increase_scale < 10) {
        increase_scale = 10;
    }
    tree = increase3DArray(tree, increase_scale, 10, increase_scale);

    var tree_size = [tree.length, tree[0].length, tree[0][0].length];

    /*// Create many branches on the tree.
    // branches have quality, the lower the smaller. Make the quality proportionnal to the Y position of the branch on the main log, the taller the smaller (0 at the top, 2 at the bottom)
    // For each side, create a branch. Then, random between 3 to 4 blocks higher, create the next branch. Repeat until the top of the tree is reached.

    
    
    // start by the top of the log
    var y = log_height - 3;
    // get the quality of the first branch
    var proportion = 1 - (y - branch_y[0]) / (branch_y[1] - branch_y[0]);*/

    var last_branch_y = [0,0,0,0]; // index 0: north, 1: east, 2: south, 3: west

    // get y min and max for the branches
    var branch_y = 3;

    // Look for the cross of the log, and create a branch
    for (var y = branch_y; y < tree[0].length; y++) {
        for (var x = 0; x < tree.length; x++) {
            for (var z = 0; z < tree[0][0].length; z++) {
                if (tree[x][y][z] == log) {
                    var connected = 0;
                    if (withinArray(x - 1, y, z, tree) && tree[x - 1][y][z] == log) {
                        connected++;
                    }
                    if (withinArray(x + 1, y, z, tree) && tree[x + 1][y][z] == log) {
                        connected++;
                    }
                    if (withinArray(x, y, z - 1, tree) && tree[x][y][z - 1] == log) {
                        connected++;
                    }
                    if (withinArray(x, y, z + 1, tree) && tree[x][y][z + 1] == log) {
                        connected++;
                    }
                    if (connected == 4 || connected == 0) {
                        // generate 4 random booleans
                        var randoms = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
                        // for each random, create a branch
                        for (var i = 0; i < 4; i++) {
                            if (randoms[i]) {
                                //placeholder
                                //tree[x][y][z] = placeholder;
                                var branch_x = x;
                                var branch_z = z;
                                while (tree[branch_x][y][branch_z] == log) {
                                    switch (i) {
                                        case 0:
                                            branch_z--;
                                            break;
                                        case 1:
                                            branch_x++;
                                            break;
                                        case 2:
                                            branch_z++;
                                            break;
                                        case 3:
                                            branch_x--;
                                            break;
                                    }
                                }

                                if (tree[branch_x][y][branch_z] == null) {
                                    if (y - last_branch_y[i] > 3) {
                                        last_branch_y[i] = y;

                                        // create a quality for the branch

                                        var proportion = (quality / (log_height - branch_y)) * (log_height - y);
                                        // create the branch
                                        var branch = createPineBranch(log, leaves, placeholder, proportion);
                                        // rotate the branch according to the side
                                        switch (i) {
                                            // default is east
                                            case 0:
                                                branch = rotate3DArray(branch, true);
                                                break;
                                            case 2:
                                                branch = rotate3DArray(branch, false);
                                                break;
                                            case 3:
                                                branch = rotate3DArray(rotate3DArray(branch, false), false);
                                                break;
                                        }

                                        y--;

                                        // concatenate the branch to the tree
                                        switch (i) {
                                            case 0:
                                                branch_z = branch_z - branch[0][0].length + 1;
                                                branch_x = branch_x - Math.floor(branch.length / 2);
                                                tree = concatenate3DArrays(tree, branch, branch_x, y, branch_z, false);
                                                break;
                                            case 1:
                                                branch_z = branch_z - Math.floor(branch[0][0].length / 2);
                                                tree = concatenate3DArrays(tree, branch, branch_x, y, branch_z, false);
                                                break;
                                            case 2:
                                                branch_x = branch_x - Math.floor(branch.length / 2);
                                                tree = concatenate3DArrays(tree, branch, branch_x, y, branch_z, false);
                                                break;
                                            case 3:
                                                branch_x = branch_x - branch.length + 1;
                                                branch_z = branch_z - Math.floor(branch[0][0].length / 2);
                                                tree = concatenate3DArrays(tree, branch, branch_x, y, branch_z, false);
                                                break;
                                        }
                                    } else {
                                        //50% place leaves
                                        if (Math.random() < 0.5) {
                                            tree[branch_x][y][branch_z] = leaves;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // scan the tree, and for every leves surrounded by 3 or more none-air blocks, place a leaf block
    for (var x = 0; x < tree.length; x++) {
        for (var y = 0; y < tree[0].length; y++) {
            for (var z = 0; z < tree[0][0].length; z++) {
                if (tree[x][y][z] == null) {
                    var connected = 0;
                    if (withinArray(x - 1, y, z, tree) && tree[x - 1][y][z] != null) {
                        connected++;
                    }
                    if (withinArray(x + 1, y, z, tree) && tree[x + 1][y][z] != null) {
                        connected++;
                    }
                    if (withinArray(x, y, z - 1, tree) && tree[x][y][z - 1] != null) {
                        connected++;
                    }
                    if (withinArray(x, y, z + 1, tree) && tree[x][y][z + 1] != null) {
                        connected++;
                    }
                    if (connected >= 3) {
                        tree[x][y][z] = leaves;
                    }
                }
            }
        }
    }

    return [tree, tree_size];
}

// algorithm to generate a sequoia tree. return a 3D array with the tree blocks
function treetypeSequoia(log, leaves, placeholder, quality) {
    //multiply quality by 20 to get log height
    var log_height = Math.floor(20 * quality) + 10;
    //create a 3D array
    var tree = create3DArray(5, log_height, 5);
    //fill the log
    for (var y = 0; y < log_height; y++) {
        tree[2][y][2] = log;
    }

    var incxrease_scale = 5 * quality;
    if (incxrease_scale < 10) {
        incxrease_scale = 10;
    }

    //increase the size of the tree
    tree = increase3DArray(tree, incxrease_scale, 10, incxrease_scale);

    // cet teh center coordinates
    var center = Math.floor(tree.length / 2);

    // at the bottom of the tree (1/4), make the log 5 blocks wide
    var bottom_bound = getBounds(0, 1, log_height, 4);
    for (var i = bottom_bound[0]; i < bottom_bound[1]; i++) {
        // draw a circle of logs
        drawCircle(tree, center, i, center, 1, log);
        drawCircle(tree, center, i, center, 2, log, 0.8);
    }

    // at the 1/4 to 2/4 of the tree, make the log 3 blocks wide
    var middle_bound = getBounds(1, 2, log_height, 4);
    for (var i = middle_bound[0]; i < middle_bound[1]; i++) {
        // draw a circle of logs
        drawCircle(tree, center, i, center, 0, log);
        drawCircle(tree, center, i, center, 1, log, 0.8);
    }

    // At the top third of the tree, create random branches (wooden blocks)
    var branches_bound = getBounds(5, 7, log_height, 8);
    for (var i = branches_bound[0]; i < branches_bound[1]; i++) {
        if (Math.random() < 0.75) {
            // get a random direction
            var direction = Math.floor(Math.random() * 4);
            // get a random angle
            var angle = Math.floor(Math.random() * 4) + 1;
            // get a random length
            var length = Math.floor(Math.random() * (log_height/8)) + 1;
            // generate the coordinates (orign and destination)
            var origin = [center, i, center];
            // generate destination with angle, length and direction
            var destination = [center, i + length, center];
            switch (direction) {
                case 0:
                    destination[0] = center - angle;
                    break;
                case 1:
                    destination[2] = center + angle;
                    break;
                case 2:
                    destination[0] = center + angle;
                    break;
                case 3:
                    destination[2] = center - angle;
                    break;
            }
            //draw a random leaf sphere at destination
            var radius = Math.floor(Math.random() * 2) + 2;
            drawSphere(tree, destination[0], destination[1], destination[2], radius, leaves, 0.75);

            // fdraw the branch
            drawLine(tree, origin[0], origin[1], origin[2], destination[0], destination[1], destination[2], log, true);
        }
    }

    for (var x = 0, z = 0; x < tree.length; x++) {
        for (var y = branches_bound[0]; y < tree[0].length; y++) {
            for (var z = 0; z < tree[0][0].length; z++) {
                // if there is a log
                if (tree[x][y][z] == log && Math.random() < 0.5) {
                    // Draw a sphere of random leaves around the log
                    var radius = Math.floor(Math.random() * 3) + 1;
                    drawSphere(tree, x, y, z, radius, leaves);
                    //draw another sphere 1 block larger, but only 50% of the time
                    drawSphere(tree, x, y, z, radius + 1, leaves, 0.5);
                }
            }
        }
    }

    // always have a leaf sphere above the highest log block
    drawSphere(tree, center, log_height - 1, center, 2, leaves);
    drawSphere(tree, center, log_height - 1, center, 3, leaves, 0.5);


    tree = cleanupUnconnected(tree, leaves);

    var tree_size = [tree.length, tree[0].length, tree[0][0].length];

    return [tree, tree_size];
}






// algorithm to generate a pine branch
function createPineBranch(log, leaves, placeholder, proportion) {
    // the lower the proportion, the smaller the branch

    // Start with an horizontal 1 to 5 blocks long log
    var log_length = Math.floor(1 + 4 * proportion);
    var branch_lenght = log_length + 3;
    var branch_width = log_length + 1;
    // if width is even, set to odd
    if (branch_width % 2 == 0) {
        branch_width++;
    }

    // create the 3D array (3 tall)
    var branch = create3DArray(branch_lenght, 3, branch_width);

    // create the log from south to north
    for (var x = 0; x < log_length; x++) {
        branch[x][1][Math.floor(branch_width / 2)] = log;
    }

    // after the log, fill with leaves to the tip
    for (var x = log_length; x < branch_lenght; x++) {
        var z = Math.floor(branch_width / 2);
        if (withinArray(x, 1, z, branch) && branch[x][1][z] == null)
            branch[x][1][z] = leaves;
    }

    // create the leaves on the sides of the log
    // make z the center of the branch
    var z_central = Math.floor(branch_width / 2);
    var z_1 = z_central + 1;
    var z_2 = z_central - 1;
    var x_1 = 0;
    var x_2 = branch_lenght - 2;

    // create fills
    for (var x = 0; x < branch_lenght - 1; x+=2) {
        fillZone([x_1, 1, z_1], [x_2, 1, z_2], leaves, 1, branch);

        // if x_1 to x_2 is 4 or more, break
        if (x_2 - x_1 < 4) {
            break;
        }


        z_2--;
        z_1++;

        x_2 -= 2;
    }

    z_1 = z_central;
    z_2 = z_central;
    x_1 = 0;
    x_2 = branch_lenght - 3;

    // create fills
    for (var x = 0; x < branch_lenght - 2; x+=2) {
        fillZone([x_1, 0, z_1], [x_2, 0, z_2], leaves, 1, branch);
        fillZone([x_1, 2, z_1], [x_2, 2, z_2], leaves, 1, branch);

        // if x_1 to x_2 is 4 or more, break
        if (x_2 - x_1 < 5) {
            break;
        }


        z_2--;
        z_1++;

        x_2 -= 2;
    }

    // remove the angles at z = 0 and z = branch_width - 1, and x = 0
    if (log_length > 1) {
        branch[0][1][0] = null;
        branch[0][1][branch_width - 1] = null;
    }

    if (branch_width > 7) {
        branch[0][0][2] = null;
        branch[0][2][2] = null;
        branch[0][0][branch_width - 3] = null;
        branch[0][2][branch_width - 3] = null;
    }


    return branch;
}





//function to get a lower and upper bound for a proportion of a tree
function getBounds(lower, upper, total_height, proportion) {
    /*
        for example, I want bounds from 7/20 to 10/20 of the tree height:
        lower = 7
        upper = 10
        total_height = <height>
        proportion = 20
    */
    var lower_bound = Math.floor(lower / proportion * total_height);
    var upper_bound = Math.floor(upper / proportion * total_height);
    //if 0, set to 1
    if (lower_bound < 0) {
        lower_bound = 1;
    }
    if (upper_bound < 0) {
        upper_bound = 1;
    }
    return [lower_bound, upper_bound];
}

//function to fill a zone with a block and a random chance
function fillZone(pos1, pos2, block, chance, tree) {
    //pos 1 and pos2 are [x, y, z]
    //block is the block type
    //chance is the chance of the block being placed
    var x1 = pos1[0];
    var y1 = pos1[1];
    var z1 = pos1[2];
    var x2 = pos2[0];
    var y2 = pos2[1];
    var z2 = pos2[2];

    var x_min = Math.min(x1, x2);
    var x_max = Math.max(x1, x2);
    var y_min = Math.min(y1, y2);
    var y_max = Math.max(y1, y2);
    var z_min = Math.min(z1, z2);
    var z_max = Math.max(z1, z2);

    for (var x = x_min; x <= x_max; x++) {
        for (var y = y_min; y <= y_max; y++) {
            for (var z = z_min; z <= z_max; z++) {
                if (Math.random() < chance) {
                    //if no block is already there
                    if (tree[x][y][z] == null) {
                        tree[x][y][z] = block;
                    }
                }
            }
        }
    }

    return true;
}

function createX(width, block) {
    //log("Creating X with width " + width + " and block " + block);
    // Create a 2D array of width x width
    var x = new Array(width);
    for (var i = 0; i < width; i++) {
        x[i] = new Array(width);
        for (var j = 0; j < width; j++) {
            x[i][j] = null;
        }
    }

    // get the center of the width (if 3, then 1, if 5, then 2...)
    var center = Math.floor(width / 2);
    // for the center as x, fill z
    for (var i = 0; i < width; i++) {
        //log("Placing " + block + " at " + center + ", " + i);
        x[center][i] = block;
        x[i][center] = block;
    }
    return x;
}

//subfunction to increase the height of a 2D array
function increase_2D_to_3D(array_2D, height) {
    
    var array_width = array_2D.length;
    // Create a 3D array of width x height x width
    var x = create3DArray(array_width, height, array_width);

    // for each layer, fill the X
    for (var i = 0; i < array_width; i++) {
        for (var j = 0; j < height; j++) {
            for (var k = 0; k < array_width; k++) {
                if (array_2D[i][k] != null) {
                    x[i][j][k] = array_2D[i][k];
                }
            }
        }
    }

    // return the X 
    return x;
}

// function to cerate a X log
function createLogX(height, min_layer_height, max_layer_height, log, placeholder) {

    // segment the height of the log into several segments of sizes between min_layer_height and max_layer_height
    var layers = segmentNumber(height, min_layer_height, max_layer_height);

    // create the ampty log
    //sum of all layers
    var log_height = 0;
    for (var i = 0; i < layers.length; i++) {
        log_height += layers[i];
    }
    // log width:
    var log_width = layers.length * 2;
    // make it odd
    if (log_width % 2 == 0) {
        log_width--;
    }

    // Create a 3D array of width x height x width
    //var log_array = create3DArray(log_width, log_height, log_width);

    // for each layers, from top to bottom, create a X that increases in size
    var y_start = 0;
    var concat_offset = 0;

    var x_2d = createX(log_width, log);
    var x_3d = increase_2D_to_3D(x_2d, layers[0], log);
    var log_array = x_3d;
    concat_offset++;

    if (layers.length > 1) {
        // for each layer, create a X and concatenate it to the log
        for (var i = 1; i < layers.length; i++) {
            log_width -= 2;
            //log("Creating layer " + i + " with height " + layers[i] + " and width " + log_width);

            // create the X
            x_2d = createX(log_width, log);
            // create the taller X
            x_3d = increase_2D_to_3D(x_2d, layers[i], log);
            //log("Created X log element, that will be placed between " + y_start + " and " + (y_start - layers[i] + 1));
            // concatenate the X to the log
            log_array = concatenate3DArrays(log_array, x_3d, concat_offset, y_start + layers[i] - 1, concat_offset);

            // update the y_start and the concat_offset
            y_start += layers[i];
            concat_offset++;
        }
    }

    // scan the log, and for every log that has nothing above, place a placeholder
    for (var x = 0; x < log_array.length; x++) {
        for (var y = 0; y < log_array[0].length; y++) {
            for (var z = 0; z < log_array[0][0].length; z++) {
                if (log_array[x][y][z] == log) {
                    var has_nothing_above = true;
                    for (var i = y + 1; i < log_array[0].length; i++) {
                        if (log_array[x][i][z] == log) {
                            has_nothing_above = false;
                        }
                    }
                    // Verticaly expand the log with a random height
                    if (has_nothing_above) {
                        var random = Math.floor(Math.random() * (Math.floor(min_layer_height / 4))*3);
                        for (var i = 1; i <= random; i++) {
                            if (y + i < log_array[0].length) {
                                log_array[x][y + i][z] = placeholder;
                            }
                        }
                    }
                }
            }
        }
    }

    // replace the placeholders with logs
    log_array = replaceBlock(log_array, placeholder, log);


    return log_array;
}

function segmentNumber(number, min, max) {
    // Calculate the number of segments needed
    var numSegments = Math.ceil(number / max);
    
    // Calculate the size of each segment
    var segmentSize = Math.ceil(number / numSegments);
    
    // Ensure segment size is within the min-max range
    var adjustedSegmentSize = Math.max(min, Math.min(max, segmentSize));
    
    // Calculate the number of segments with adjusted size
    var adjustedNumSegments = Math.ceil(number / adjustedSegmentSize);
    
    // Calculate the remainder
    var remainder = number % adjustedNumSegments;
    
    // Calculate the number of segments with adjusted size + 1
    var numSegmentsWithExtra = remainder;
    
    // Create an array to store the segments
    var segments = new Array(adjustedNumSegments);

    // Fill the array with the adjusted segment size
    for (var i = 0; i < adjustedNumSegments; i++) {
        segments[i] = adjustedSegmentSize;
    }
    
    // Add 1 to the first `remainder` segments
    for (var i = 0; i < numSegmentsWithExtra; i++) {
        segments[i]++;
    }
    
    return segments;
}


// function to create a 3D array
function create3DArray(x, y, z) {
    var array = new Array(x);
    for (var i = 0; i < x; i++) {
        array[i] = new Array(y);
        for (var j = 0; j < y; j++) {
            array[i][j] = new Array(z);
            for (var k = 0; k < z; k++) {
                array[i][j][k] = null;
            }
        }
    }
    return array;
}

// function to merge 2 3D arrays
function concatenate3DArrays(array1, array2, offset_x, offset_y, offset_z, replace_blocks) {
    //log("Concatenating 3D arrays with offset " + offset_x + ", " + offset_y + ", " + offset_z);

    // replace_blocks is true by default
    if (replace_blocks == null) {
        replace_blocks = true;
    }

    // get the size of the arrays
    var x1 = array1.length;
    var y1 = array1[0].length;
    var z1 = array1[0][0].length;
    var x2 = array2.length;
    var y2 = array2[0].length;
    var z2 = array2[0][0].length;

    // get the size of the merged array
    var x = Math.max(x1, x2 + offset_x);
    var y = Math.max(y1, y2 + offset_y);
    var z = Math.max(z1, z2 + offset_z);

    // create the merged array
    var merged = create3DArray(x, y, z);

    // copy the first array to the merged array
    for (var i = 0; i < x1; i++) {
        for (var j = 0; j < y1; j++) {
            for (var k = 0; k < z1; k++) {
                merged[i][j][k] = array1[i][j][k];
            }
        }
    }

    // copy the second array to the merged array
    for (var i = 0; i < x2; i++) {
        for (var j = 0; j < y2; j++) {
            for (var k = 0; k < z2; k++) {
                //if value within bounds
                if (replace_blocks || (withinArray(i + offset_x, j + offset_y, k + offset_z, merged) && merged[i + offset_x][j + offset_y][k + offset_z] == null)) {
                    merged[i + offset_x][j + offset_y][k + offset_z] = array2[i][j][k];
                }
            }
        }
    }

    return merged;
}

// function to build a 3D array in the world
function build3DArray(array, build_x, build_y, build_z, world) {

    // for each block in the 3D array, place it in the world
    //log("Array size: " + array.length + ", " + array[0].length + ", " + array[0][0].length);
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (array[x][y][z] != null) {
                    //log("Placing block " + array[x][y][z] + " at " + build_x + x + ", " + build_y + y + ", " + build_z + z);
                    //split block name on :
                    var block = array[x][y][z].split(":");
                    //merge the 2 first elements with :
                    var block_id = block[0] + ":" + block[1];
                    
                    // if it has damage
                    if (block.length > 2) {
                        var damage = block[2];
                        world.setBlock(build_x + x, build_y + y, build_z + z, block_id, damage);
                    } else {
                        world.setBlock(build_x + x, build_y + y, build_z + z, block_id, 0);
                    }
                }
            }
        }
    }

    return true;
}

// function to replace a block with another within a 3D array
function replaceBlock(array, block, replacement) {
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (array[x][y][z] == block) {
                    array[x][y][z] = replacement;
                }
            }
        }
    }
    return array;
}

//function to display a 3D array in chat
function display3DArray(array) {
    for (var y = 0; y < array[0].length; y++) {
        var line = "";
        for (var x = 0; x < array.length; x++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (array[x][y][z] != null) {
                    line += "o";
                }
                else {
                    line += "x";
                }
            }
            line += " ";
        }
        log(line);
    }
    log("______________________");
}

//function to display a 2D array in chat
function display2DArray(array) {
    for (var y = 0; y < array.length; y++) {
        var line = "";
        for (var x = 0; x < array.length; x++) {
            if (array[x][y] != null) {
                line += "o";
            }
            else {
                line += "x";
            }
        }
        log(line);
    }
    log("______________________");
}

//function to rotate a 3D array 90 degrees right or left
function rotate3DArray(array, right) {
    // create a new array with the same size but rotated
    var new_array = create3DArray(array[0][0].length, array[0].length, array.length);

    // for each block in the array, rotate it
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (right) {
                    new_array[z][y][array.length - x - 1] = array[x][y][z];
                }
                else {
                    new_array[array[0][0].length - z - 1][y][x] = array[x][y][z];
                }
            }
        }
    }

    return new_array;
}

//function to increase a 3D array on each axis while keeping content centered
function increase3DArray(array, increase_x, increase_y, increase_z) {
    // create a new array with the increased size
    var new_array = create3DArray(array.length + (increase_x * 2), array[0].length + increase_y, array[0][0].length + (increase_z * 2));

    // get the offset for each axis
    var offset_x = increase_x;
    var offset_y = 0;
    var offset_z = increase_z;

    // copy the content of the old array to the new array
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                new_array[x + offset_x][y + offset_y][z + offset_z] = array[x][y][z];
            }
        }
    }

    return new_array;
}

//function to draw a line in a 3D array
function drawLine(array, x1, y1, z1, x2, y2, z2, block, force) {
    // get the distance between the 2 points
    var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));

    // for each block in the array, check if it is on the line
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < array[0].length; j++) {
            for (var k = 0; k < array[0][0].length; k++) {
                // get the distance between the block and the 2 points
                var d1 = Math.sqrt(Math.pow(i - x1, 2) + Math.pow(j - y1, 2) + Math.pow(k - z1, 2));
                var d2 = Math.sqrt(Math.pow(i - x2, 2) + Math.pow(j - y2, 2) + Math.pow(k - z2, 2));

                // if the sum of the 2 distances is equal to the distance between the 2 points, the block is on the line
                if (Math.abs(d1 + d2 - distance) < 0.2 && (force || array[i][j][k] == null)) {
                    array[i][j][k] = block;
                }
            }
        }
    }

    return array;
}

//function to draw a sphere in a 3D array
function drawSphere(array, x, y, z, radius, block, chance) {
    // for each block in the array, check if it is within the sphere
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < array[0].length; j++) {
            for (var k = 0; k < array[0][0].length; k++) {
                if (array[i][j][k] == null && Math.pow(i - x, 2) + Math.pow(j - y, 2) + Math.pow(k - z, 2) < Math.pow(radius, 2)) {
                    if (chance == null || Math.random() < chance) {
                        array[i][j][k] = block;
                    }
                }
            }
        }
    }
    return array;
}

//function to draw a circle in a 3D array
function drawCircle(array, x, y, z, radius, block, chance) {
    // for each block in the array, check if it is within the circle
    for (var it_x = 0; it_x < array.length; it_x++) {
        for (var it_z = 0; it_z < array[0][0].length; it_z++) {
            // tolerence:
            var tolerence = 0.2;
            // get the distance between the block and the center of the circle
            var distance = Math.sqrt(Math.pow(it_x - x, 2) + Math.pow(it_z - z, 2));
            // if the distance is within the radius, place the block
            if (distance < radius + tolerence) {
                if (chance == null || Math.random() < chance) {
                    array[it_x][y][it_z] = block;
                }
            }
        }

    }

    return array;
}

// function to check if a coordinate is inbounds of an array
function withinArray(x, y, z, array) {
    return x >= 0 && x < array.length && y >= 0 && y < array[0].length && z >= 0 && z < array[0][0].length;
}

//function to get the number of connected similar blocks in a 3D array
function getConnectedBlocks(array, x, y, z, block) {
    // create a new array with the same size
    var new_array = create3DArray(array.length, array[0].length, array[0][0].length);

    // create a list of connected blocks
    var connected = [];
    connected.push([x, y, z]);

    // while there are connected blocks
    while (connected.length > 0) {
        // get the first block
        var block = connected.pop();
        var x = block[0];
        var y = block[1];
        var z = block[2];

        // if the block is the same as the original block, and is not already in the new array
        if (array[x][y][z] == block && new_array[x][y][z] == null) {
            // add the block to the new array
            new_array[x][y][z] = block;

            // add the connected blocks to the list
            if (withinArray(x - 1, y, z, array)) {
                connected.push([x - 1, y, z]);
            }
            if (withinArray(x + 1, y, z, array)) {
                connected.push([x + 1, y, z]);
            }
            if (withinArray(x, y - 1, z, array)) {
                connected.push([x, y - 1, z]);
            }
            if (withinArray(x, y + 1, z, array)) {
                connected.push([x, y + 1, z]);
            }
            if (withinArray(x, y, z - 1, array)) {
                connected.push([x, y, z - 1]);
            }
            if (withinArray(x, y, z + 1, array)) {
                connected.push([x, y, z + 1]);
            }
        }
    }

    return new_array;
}

//function to fill all the empty blocks in a 3D array with a block
function fillEmptyBlocks(array, block) {
    // for each block in the array, if it is empty, fill it
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (array[x][y][z] == null) {
                    array[x][y][z] = block;
                }
            }
        }
    }

    return array;
}

//function to cleanup unconnected blocks in a 3D array
function cleanupUnconnected(array, block) {
    // for each block in the array, if it is a leaf, and is not connected to the tree, remove it
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array[0].length; y++) {
            for (var z = 0; z < array[0][0].length; z++) {
                if (array[x][y][z] == block) {
                    // If all 6 blocks around are null, remove the block
                    var connected = 0;
                    if (withinArray(x - 1, y, z, array) && array[x - 1][y][z] != null) {
                        connected++;
                    }
                    if (withinArray(x + 1, y, z, array) && array[x + 1][y][z] != null) {
                        connected++;
                    }
                    if (withinArray(x, y - 1, z, array) && array[x][y - 1][z] != null) {
                        connected++;
                    }
                    if (withinArray(x, y + 1, z, array) && array[x][y + 1][z] != null) {
                        connected++;
                    }
                    if (withinArray(x, y, z - 1, array) && array[x][y][z - 1] != null) {
                        connected++;
                    }
                    if (withinArray(x, y, z + 1, array) && array[x][y][z + 1] != null) {
                        connected++;
                    }
                    if (connected == 0) {
                        array[x][y][z] = null;
                    }
                }
            }
        }
    }

    return array;
}