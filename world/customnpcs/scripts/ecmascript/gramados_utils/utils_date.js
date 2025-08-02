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


function getAgeTick(world) {
    return world.getTotalTime();
}

function getAgeTickSince(world, startTime) {
    return world.getTotalTime() - startTime;
}

function hasAgeTickPassed(world, startTime, ageTick) {
    return world.getTotalTime() - startTime >= ageTick;
}

function TimeToTick(hours, minutes, seconds) {
    var targetTime = (hours * 3600 + minutes * 60 + seconds) * 20; // Convert to ticks (20 ticks per second)
    return targetTime;
}

function TimeToMinecraftTick(years, months, days) {
    var daysInYear = 360; // 12 months * 30 days
    var totalDays = years * daysInYear + months * 30 + days;
    return totalDays * 24000; // Convert days to ticks (24000 ticks per day)
}

function IRLDaysToTicks(days) {
    return days * 24 * 60 * 60 * 20; // Convert days to ticks (20 ticks per second, 86400 seconds per day)
}

function TicksToHumanReadable(ticks) {
    var totalSeconds = Math.floor(ticks / 20); // Convert ticks to seconds
    var days = Math.floor(totalSeconds / 86400); // Calculate days (86400 seconds in a day)
    var remainingSeconds = totalSeconds % 86400;
    var hours = Math.floor(remainingSeconds / 3600); // Calculate hours
    remainingSeconds %= 3600;
    var minutes = Math.floor(remainingSeconds / 60); // Calculate minutes
    var seconds = remainingSeconds % 60; // Remaining seconds

    return days + " days, " + hours + " hours, " + minutes + " minutes, " + seconds + " seconds";
}

function TicksToDate(ticks) {
    function pad(value, length) {
        value = String(value);
        while (value.length < length) {
            value = '0' + value;
        }
        return value;
    }

    var totalSeconds = Math.floor(ticks / 20); // Convert ticks to seconds
    var date = new Date(totalSeconds * 1000); // Convert seconds to milliseconds

    var day = pad(date.getDate(), 2);
    var month = pad(date.getMonth() + 1, 2); // Months are zero-based
    var year = date.getFullYear();
    var hours = pad(date.getHours(), 2);
    var minutes = pad(date.getMinutes(), 2);
    var seconds = pad(date.getSeconds(), 2);

    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
}

function getTimeLeftBeforeTick(world, targetTick) {
    var currentTick = getAgeTick(world);
    var ticksLeft = targetTick - currentTick;

    if (ticksLeft <= 0) {
        return "Time has already passed.";
    }

    return ticksLeft;
}