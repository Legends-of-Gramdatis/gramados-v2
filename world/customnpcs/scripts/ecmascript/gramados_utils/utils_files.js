/**
 * Loads a JSON object from a file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Object|null} The parsed JSON object, or null if the file does not exist.
 */
function loadJson(filePath) {
    var file = new java.io.File(filePath);
    if (!file.exists()) {
        return null;
    }

    var reader = new java.io.FileReader(file);
    var json = JSON.parse(org.apache.commons.io.IOUtils.toString(reader));
    reader.close();

    return json;
}

/**
 * Saves a JSON object to a file.
 * @param {Object} data - The JSON object to save.
 * @param {string} filePath - The path to the file where the JSON object will be saved.
 */
function saveJson(data, filePath) {
    var writer = new java.io.FileWriter(filePath);
    writer.write(JSON.stringify(data, null, 4));
    writer.close();
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
    jsonString = jsonString.replace(/(\d+)[bBsSlLfFdD]/g, '$1');

    var json = JSON.parse(jsonString);
    return json;
}