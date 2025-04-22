/**
 * Checks if the current date is between two specified dates.
 * @param {number} startDay - The start day of the range.
 * @param {number} startMonth - The start month of the range.
 * @param {number} endDay - The end day of the range.
 * @param {number} endMonth - The end month of the range.
 * @returns {boolean} - True if the current date is between the specified dates, false otherwise.
 */
function isDateBetween(startDay, startMonth, endDay, endMonth) {
    var currentDate = new Date();
    var startDate = new Date(currentDate.getFullYear(), startMonth, startDay);
    var endDate = new Date(currentDate.getFullYear(), endMonth, endDay);

    return currentDate >= startDate && currentDate <= endDate;
}

/**
 * Checks if the current date is between two specified dates in a specific year.
 * @param {number} startDay - The start day of the range.
 * @param {number} startMonth - The start month of the range.
 * @param {number} endDay - The end day of the range.
 * @param {number} endMonth - The end month of the range.
 * @param {number} year - The year to check against.
 * @returns {boolean} - True if the current date is between the specified dates, false otherwise.
 */
function isDateBetweenYear(startDay, startMonth, endDay, endMonth, year) {
    var currentDate = new Date(year, startMonth, startDay);
    var startDate = new Date(year, startMonth, startDay);
    var endDate = new Date(year, endMonth, endDay);

    return currentDate >= startDate && currentDate <= endDate;
}

/**
 * Checks if the current time is between two given times.
 * @param {Object} currentTime - The current time as { hour, minute, day, month }.
 * @param {Object} startTime - The start time as { hour, minute, day, month }.
 * @param {Object} endTime - The end time as { hour, minute, day, month }.
 * @returns {boolean} - True if the current time is between the start and end times, false otherwise.
 */
function isTimeBetween(currentTime, startTime, endTime) {
    // Normalize times for comparison
    var currentMinutes = currentTime.hour * 60 + currentTime.minute;
    var startMinutes = startTime.hour * 60 + startTime.minute;
    var endMinutes = endTime.hour * 60 + endTime.minute;

    // Handle cases where the end time crosses midnight
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours to the end time
        if (currentMinutes < startMinutes) {
            currentMinutes += 24 * 60; // Adjust current time if it's before the start time
        }
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function getCurrentTime() {
    var currentDate = new Date();
    var hours = currentDate.getHours();
    var minutes = currentDate.getMinutes();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1; // Months are zero-based in JavaScript

    return {
        hour: hours,
        minute: minutes,
        day: day,
        month: month
    };
}