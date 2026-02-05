/**
 * Loads a JSON object from a file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Object|null} The parsed JSON object, or null if the file does not exist.
 */
function loadJson(filePath) {
    var fileReader = new java.io.FileReader(filePath);
    var bufferedReader = new java.io.BufferedReader(fileReader);
    var content = "";
    var line;
    while ((line = bufferedReader.readLine()) !== null) {
        content += line;
    }
    bufferedReader.close();
    // if empty, return null
    if (content.trim() === "") {
        return null;
    }
    return JSON.parse(content);
}

/**
 * Saves a JSON object to a file.
 * @param {Object} data - The JSON object to save.
 * @param {string} filePath - The path to the file where the JSON object will be saved.
 */
function saveJson(data, filePath) {
    var fileWriter = new java.io.FileWriter(filePath);
    fileWriter.write(JSON.stringify(data, null, 4));
    fileWriter.close();
}

/**
 * Saves a JSON object to a file without whitespace (compact form).
 * @param {Object} data - The JSON object to save.
 * @param {string} filePath - The path to the file where the JSON object will be saved.
 */
function saveJsonCompact(data, filePath) {
    var fileWriter = new java.io.FileWriter(filePath);
    fileWriter.write(JSON.stringify(data));
    fileWriter.close();
}

/**
 * Checks if a file exists at the given path.
 * @param {string} filePath - The path to the file.
 * @returns {boolean} True if the file exists, false otherwise.
 */
function checkFileExists(filePath) {
    var file = new java.io.File(filePath);
    return file.exists();
}

/**
 * Retrieves the stored data from the world.
 * @returns {Object} The stored data from the world.
 */
function getWorldData() {
    var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
    var world = API.getIWorld(0);
    return world.getStoreddata();
}

/**
 * Loads a JSON object from a file, removing letters at the end of number values.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Object|null} The parsed JSON object, or null if the file does not exist.
 */
function loadJavaJson(filePath) {
    var file = new java.io.File(filePath);
    if (!file.exists()) {
        return null;
    }

    var reader = new java.io.FileReader(file);
    var jsonString = org.apache.commons.io.IOUtils.toString(reader);
    reader.close();

    // Remove letters at the end of number values
    jsonString = sanitizeJavaJson(jsonString);

    var json = JSON.parse(jsonString);
    return json;
}

/**
 * Creates a directory path.
 * @param {string} path - The directory path.
 */
function mkPath(path) {
    var expath = path.split("/");
    var curpath = "";
    for (var ex in expath) {
        var expt = expath[ex];
        curpath += (curpath == "" ? "" : "/") + expt;
        var pfile = new File(curpath);
        if (!pfile.exists()) {
            if (expt.match(/[\w]+\.[\w]+/) === null) { //is dir?
                pfile.mkdir();
            } else {
                pfile.createNewFile();
            }
        }
    }
}

/**
 * Reads the contents of a directory.
 * @param {string} dirPath - The directory path.
 * @returns {Array<string>} The list of files in the directory.
 */
function readDir(dirPath) {
    var res = [];
    var files = new File(dirPath).listFiles();
    for (var id in files) {
        var file = files[id];
        if (file.isDirectory())
            res = res.concat(readDir(file.toString()));
        else
            res.push(Java.from(readFile(file.toString())).join("\n").replace(/\t/g, "  "));
    }
    return res;
}

/**
 * Reads the contents of a file.
 * @param {string} filePath - The file path.
 * @returns {Array<string>} The file contents as an array of lines.
 */
function readFile(filePath) {
    var path = Paths.get(filePath);
    try {
        return Files.readAllLines(path, CHARSET_UTF_8).toArray();
    } catch (e) {
        return [];
    }
}

/**
 * Writes text to a file.
 * @param {string} filePath - The file path.
 * @param {string} text - The text to write.
 * @param {number} [offset=0] - The offset to start writing at.
 * @param {number} [length=text.length] - The length of text to write.
 */
function writeToFile(filePath, text, offset, length) {
    if (typeof (offset) == typeof (undefined) || offset === null) { offset = null; }
    if (typeof (length) == typeof (undefined) || length === null) { length = null; }
    var path = Paths.get(filePath);
    try {
        var writer = Files.newBufferedWriter(path, CHARSET_UTF_8);
        writer.write(text, offset || 0, length || text.length);
        writer.close();
        return true;
    } catch (exc) {
        return false
    }
}

/**
 * Creates an empty JSON file at the specified path.
 * @param {string} filePath - The path to the file.
 */
function createJsonFile(filePath) {
    var fileWriter = new java.io.FileWriter(filePath);
    fileWriter.write("{}");
    fileWriter.close();
}

/**
 * Sanitizes a JSON string by removing Java/NBT primitive type suffixes.
 * @param {string} jsonString - The JSON string to sanitize.
 * @returns {string} The sanitized JSON string.
 */
function sanitizeJavaJson(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') return jsonString;
    // Remove primitive type suffixes used by NBT/Java: b,s,l,f,d (case-insensitive)
    // Integers with suffixes
    jsonString = jsonString.replace(/(\b-?\d+)[bBsSlL]/g, '$1');
    // Floats/doubles with optional decimals and suffixes
    jsonString = jsonString.replace(/(\b-?\d+(?:\.\d+)?)[fFdD]/g, '$1');
    return jsonString;
}