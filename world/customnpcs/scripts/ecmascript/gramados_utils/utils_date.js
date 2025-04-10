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