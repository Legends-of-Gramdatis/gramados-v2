/**
 * Shuffles an array.
 * @param {Array} a - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function array_shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Filters an array based on a predicate function.
 * @param {Array} a - The array to filter.
 * @param {Function} fn - The predicate function.
 * @returns {Array} The filtered array.
 */
function array_filter(a, fn) {
    var aa = [];
    for (var i in a) {
        if (fn(a[i])) { aa.push(a[i]); }
    }

    return aa;
}

/**
 * Removes duplicate elements from an array.
 * @param {Array} a - The array to process.
 * @returns {Array} The array with unique elements.
 */
function array_dist(a) {
    var b = [];
    for (var c in a) {
        if (b.indexOf(a[c]) == -1) {
            b.push(a[c]);
        }
    }

    return b;
}

/**
 * Removes an element from an array.
 * @param {Array} array - The array to modify.
 * @param {*} element - The element to remove.
 */
function array_remove(array, element) {
    var index = array.indexOf(element);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

/**
 * Removes specified values from an array.
 * @param {Array} arr - The array to modify.
 * @param {Array|string} vals - The values to remove.
 * @returns {Array} The modified array.
 */
function removeFromArray(arr, vals) {
    if (typeof (vals) == 'string') { vals = [vals]; }
    var a = arr;
    for (var v in vals) {
        var val = vals[v];
        array_remove(a, val);
    }
    return a;
}

/**
 * Removes elements from an array by their keys.
 * @param {Array} arr - The array to modify.
 * @param {Array} keys - The keys of the elements to remove.
 * @returns {Array} The modified array.
 */
function removeFromArrayByKey(arr, keys) {
    var narr = [];
    for (var k in keys) {
        var key = keys[k];
        keys[k] = parseInt(key);
    }
    for (var i in arr) {
        var ari = arr[i];
        if (keys.indexOf(i) > -1) {
            narr.push(ari);
        }
    }
    return narr;
}

/**
 * Merges two arrays.
 * @param {Array} a1 - The first array.
 * @param {Array} a2 - The second array.
 * @returns {Array} The merged array.
 */
function array_merge(a1, a2) {
    var bb = [];
    for (var k in a1) {
        bb[k] = a1[k];
    }
    for (var k in a2) {
        bb[k] = a2[k];
    }
    return bb;
}

/**
 * Transforms an array using a function.
 * @param {Array} arr - The array to transform.
 * @param {Function} elfn - The function to apply to each element.
 * @returns {Array} The transformed array.
 */
function arrayTransform(arr, elfn) {
    var newa = [];
    for (var a in arr) {
        var arri = arr[a];
        newa.push(elfn(arri, a, arr));
    }
    return newa;
}

/**
 * Takes a range of elements from an array.
 * @param {Array} arr - The array to take elements from.
 * @param {number} start - The start index.
 * @param {number} [end] - The end index.
 * @returns {Array} The array with the taken elements.
 */
function arrayTakeRange(arr, start, end) {
    if (typeof (end) == typeof (undefined) || end === null) { end = null; }
    if (end == null) { end = arr.length; }
    var a = [];
    var _end = Math.min(end, arr.length);
    var _start = Math.min(start, _end);
    for (var i = _start; i < Math.min(end, arr.length); i++) {
        if (typeof (arr[i]) != typeof (undefined)) {
            a.push(arr[i]);
        }
    }
    return a;
}

/**
 * Counts the occurrences of subarrays in a string.
 * @param {string} string - The string to search.
 * @param {Array<string>} subArray - The subarrays to count.
 * @param {boolean} [allowOverlapping=false] - Whether to allow overlapping occurrences.
 * @param {boolean} [caseSensitive=true] - Whether the search is case-sensitive.
 * @returns {number} The number of occurrences.
 */
function arrayOccurs(string, subArray, allowOverlapping, caseSensitive) {
    if (typeof (allowOverlapping) == typeof (undefined) || allowOverlapping === null) { allowOverlapping = false; }
    if (typeof (caseSensitive) == typeof (undefined) || caseSensitive === null) { caseSensitive = true; }
    var occ = 0;
    for (var i in subArray) {
        var sel = subArray[i];
        occ += occurrences(string, sel, allowOverlapping, caseSensitive);
    }

    return occ;
}

/**
 * Formats an array into a string.
 * @param {Array} array - The array to format.
 * @param {string} format - The format string.
 * @param {string} [sep=" "] - The separator.
 * @returns {string} The formatted string.
 */
function arrayFormat(array, format, sep) {
    var joined = "";
    for (var i = 0; i < array.length; i++) {
        joined += format.fill({
            "VALUE": array[i]
        }) + (i == array.length - 1 ? "" : sep || " ");
    }
    return joined;
}

/**
 * Returns the x coordinate for a given length and angle.
 * @param {number} length - The length.
 * @param {number} angle - The angle in degrees.
 * @returns {number} The x coordinate.
 */
function lengthdir_x(length, angle) {
    return length * Math.cos(toRadians(angle));
}

/**
 * Returns the z coordinate for a given length and angle.
 * @param {number} length - The length.
 * @param {number} angle - The angle in degrees.
 * @returns {number} The z coordinate.
 */
function lengthdir_z(length, angle) {
    return length * Math.sin(toRadians(angle));
}

/**
 * Converts an angle from degrees to radians.
 * @param {number} angle - The angle in degrees.
 * @returns {number} The angle in radians.
 */
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

/**
 * Gets the angle between two points.
 * @param {number} x1 - The x coordinate of the first point.
 * @param {number} y1 - The y coordinate of the first point.
 * @param {number} x2 - The x coordinate of the second point.
 * @param {number} y2 - The y coordinate of the second point.
 * @returns {number} The angle in degrees.
 */
function getPosAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

/**
 * Rounds a number to the nearest multiple of another number.
 * @param {number} num - The number to round.
 * @param {number} rounder - The multiple to round to.
 * @param {string} [mode] - The rounding mode ('up', 'down', or 'nearest').
 * @returns {number} The rounded number.
 */
function roundByNum(num, rounder, mode) {
    switch (mode) {
        case 'up':
            return Math.ceil(num / rounder) * rounder;
        case 'down':
            return Math.floor(num / rounder) * rounder;
        default:
            return Math.round(num / rounder) * rounder;
    }
}

/**
 * Returns the sign of a number.
 * @param {number} num - The number.
 * @returns {number} 1 if the number is positive, -1 if negative, 0 if zero.
 */
function sign(num) {
    return (num > 0) - (num < 0) || +num;
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num - The number to round.
 * @param {number} dec - The number of decimal places.
 * @returns {number} The rounded number.
 */
function roundDec(num, dec) {
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}

/**
 * Normalizes an angle to the range [0, 360).
 * @param {number} angle - The angle in degrees.
 * @returns {number} The normalized angle.
 */
function fixAngle(angle) {
    return (angle % 360 + 360) % 360;
}

/**
 * Calculates a position based on direction, pitch, and length.
 * @param {object} pos - The starting position.
 * @param {number} dir - The direction in degrees.
 * @param {number} pitch - The pitch in degrees.
 * @param {number} len - The length.
 * @param {boolean} [flying] - Whether the entity is flying.
 * @returns {object} The new position.
 */
function posdir(pos, dir, pitch, len, flying) {
    var x = pos.x + lengthdir_x(len, dir);
    var z = pos.z + lengthdir_z(len, dir);
    var y = pos.y + (flying ? lengthpitch_y(pitch, len) : 0);
    return { x: x, y: y, z: z };
}

/**
 * Returns the y coordinate for a given pitch and length.
 * @param {number} pitch - The pitch in degrees.
 * @param {number} length - The length.
 * @returns {number} The y coordinate.
 */
function lengthpitch_y(pitch, length) {
    return length * Math.sin(toRadians(pitch));
}

/**
 * Returns the quadrant rotation for a given direction.
 * @param {number} dir - The direction in degrees.
 * @returns {number} The quadrant rotation.
 */
function getQuartRotation(dir) {
    return Math.floor((fixAngle(dir) + 45) / 90) % 4;
}

/**
 * Returns the half rotation for a given angle.
 * @param {number} angle - The angle in degrees.
 * @returns {number} The half rotation.
 */
function getHalfRotation(angle) {
    return Math.floor((fixAngle(angle) + 90) / 180) % 2;
}

/**
 * Generates a random number within a specified range and sums it a given number of times.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @param {number} count - The number of times to sum the random values.
 * @returns {number} The sum of the random values.
 */
function random_ranges(min, max, count) {
    var total = 0;
    for (var i = 0; i < count; i++) { total += random_range(min, max); }
    return total;
}

/**
 * Generates a random integer within a specified range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random integer.
 */
function rrandom_range(min, max) {
    return Math.round(random_range(min, max));
}

/**
 * Generates a random number within a specified range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random number.
 */
function random_range(min, max) {
    var minimum = Math.min(min, max);
    var maximum = Math.max(min, max);
    var difference = maximum - minimum;
    return (minimum + (Math.random() * difference));
}

/**
 * Picks a specified number of elements from an array based on their chances.
 * @param {Array} array - The array to pick from. Elements can be single values or arrays with the value and its chance.
 * @param {number} count - The number of elements to pick.
 * @returns {Array} The picked elements.
 * @example
 * // Example usage:
 * var items = [['apple', 3], ['banana', 1], 'cherry'];
 * var pickedItems = pickchance(items, 2);
 * console.log(pickedItems); // Might output: ['apple', 'cherry']
 */
function pickchance(array, count) {
    var weightedArray = [];
    for (var i in array) {
        if (!isArray(array[i])) {
            weightedArray.push(array[i]);
        } else {
            for (var j = 0; j < array[i][1]; j++) {
                weightedArray.push(array[i][0]);
            }
        }
    }
    return pick(weightedArray, count);
}

/**
 * Checks if the given object is an array.
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object is an array, false otherwise.
 */
function isArray(obj) {
    if (typeof (obj) === 'object') {
        for (var key in obj) {
            if (isNaN(key)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

/**
 * Picks a specified number of unique elements from an array.
 * @param {Array} array - The array to pick from.
 * @param {number} count - The number of elements to pick.
 * @returns {Array|*} The picked elements or a single element if count is 1.
 * @example
 * // Example usage:
 * var fruits = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
 * var pickedFruits = pick(fruits, 3);
 * console.log(pickedFruits); // Might output: ['banana', 'date', 'apple']
 */
function pick(array, count) {
    if (typeof (count) == typeof (undefined) || count === null) { count = 1; }
    var index = Math.floor(Math.random() * array.length);
    count = Math.min(array.length, count);
    if (count == 1) {
        return array[index];
    } else {
        var picks = [];
        while (picks.length < count) {
            index = Math.floor(Math.random() * array.length);
            if (picks.indexOf(array[index]) == -1) { picks.push(array[index]); }
        }
        return picks;
    }
}

/**
 * Calculates the base-10 logarithm of a number.
 * @param {number} value - The number to calculate the logarithm for.
 * @returns {number} The base-10 logarithm of the number.
 */
function log10(value) {
    return Math.log(value) / Math.LN10;
}

function pickFromArray(array) {
    var index = Math.floor(Math.random() * array.length);
    return array[index];
}