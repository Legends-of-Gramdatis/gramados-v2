load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js')

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


/**
 * Gets the current age tick of the world.
 * @param {Object} world - The world object.
 * @returns {number} - The current age tick of the world.
 */
function getAgeTick(world) {
    return world.getTotalTime();
}

/**
 * Gets the age tick since a specific start time.
 * @param {Object} world - The world object.
 * @param {number} startTime - The start time.
 * @returns {number} - The age tick since the start time.
 */
function getAgeTickSince(world, startTime) {
    return world.getTotalTime() - startTime;
}

/**
 * Checks if the age tick has passed since a specific start time.
 * @param {Object} world - The world object.
 * @param {number} startTime - The start time.
 * @param {number} ageTick - The age tick to check against.
 * @returns {boolean} - True if the age tick has passed, false otherwise.
 */
function hasAgeTickPassed(world, startTime, ageTick) {
    return world.getTotalTime() - startTime >= ageTick;
}

/**
 * Converts a given time in hours, minutes, and seconds to Minecraft ticks.
 * @param {number} hours - The number of hours.
 * @param {number} minutes - The number of minutes.
 * @param {number} seconds - The number of seconds.
 * @returns {number} - The equivalent time in Minecraft ticks.
 */
function TimeToTick(hours, minutes, seconds) {
    var targetTime = (hours * 3600 + minutes * 60 + seconds) * 20; // Convert to ticks (20 ticks per second)
    return targetTime;
}

/**
 * Converts a given time in years, months, and days to Minecraft ticks.
 * @param {number} years - The number of years.
 * @param {number} months - The number of months.
 * @param {number} days - The number of days.
 * @returns {number} - The equivalent time in Minecraft ticks.
 */
function TimeToMinecraftTick(years, months, days) {
    var daysInYear = 360; // 12 months * 30 days
    var totalDays = years * daysInYear + months * 30 + days;
    return totalDays * 24000; // Convert days to ticks (24000 ticks per day)
}

/**
 * Converts a given number of IRL days to Minecraft ticks.
 * @param {number} days - The number of IRL days.
 * @returns {number} - The equivalent time in Minecraft ticks.
 */
function IRLDaysToTicks(days) {
    return days * 24 * 60 * 60 * 20; // Convert days to ticks (20 ticks per second, 86400 seconds per day)
}

/**
 * Converts a given number of ticks to a human-readable format.
 * @param {number} ticks - The number of ticks.
 * @returns {string} - The time in a human-readable format (days, hours, minutes, seconds).
 */
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

/**
 * Converts a given number of ticks to a date string.
 * @param {number} ticks - The number of ticks.
 * @returns {string} - The date in the format DD/MM/YYYY HH:mm:ss.
 */
function AllTicksToDate(ticks) {
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

/**
 * Converts a given number of ticks to a date string relative to the current world age.
 * @param {Object} world - The world object.
 * @param {number} ticks - The number of ticks.
 * @returns {string} - The date in the format DD/MM/YYYY HH:mm:ss.
 * 
 * @description This function calculates the date based on the current world age and the specified ticks.
 * It adjusts the current date by removing the seconds equivalent to the current world age in ticks,
 * then adds the specified ticks to get the final date.
 */
function TicksToDate(world, ticks) {
    // Take current Date
    var currentDate = new Date();
    // Calculate the total server age in seconds
    var totalSeconds = getAgeTick(world) / 20; // Convert ticks to seconds
    // Remove those seconds from the current date
    currentDate.setSeconds(currentDate.getSeconds() - totalSeconds);
    
    // Add the ticks to the current date
    var secondsToAdd = ticks / 20; // Convert ticks to seconds
    currentDate.setSeconds(currentDate.getSeconds() + secondsToAdd);

    // Format the date as dd/mm/yyyy hh:mm:ss
    var day = pad(currentDate.getDate(), 2);
    var month = pad(currentDate.getMonth() + 1, 2); // Months are zero-based
    var year = currentDate.getFullYear();
    var hours = pad(currentDate.getHours(), 2);
    var minutes = pad(currentDate.getMinutes(), 2);
    var seconds = pad(currentDate.getSeconds(), 2);

    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;

}

/**
 * Calculates the time left before a specific tick in the world.
 * @param {Object} world - The world object.
 * @param {number} targetTick - The target tick.
 * @returns {string|number} - The number of ticks left or a message if the time has already passed.
 */
function getTimeLeftBeforeTick(world, targetTick) {
    var currentTick = getAgeTick(world);
    var ticksLeft = targetTick - currentTick;

    if (ticksLeft <= 0) {
        return "Time has already passed.";
    }

    return ticksLeft;
}

/**
 * Converts a Date object to YYYY-MM-DD format string.
 * @param {Date} [dateObj] - The Date object to convert. If not provided, uses current date.
 * @returns {string} - The date formatted as YYYY-MM-DD.
 */
function dateToYYYYMMDD(dateObj) {
    if (!dateObj) {
        dateObj = new Date();
    }
    var year = dateObj.getFullYear();
    var month = padLeft(dateObj.getMonth() + 1, 2, "0");
    var day = padLeft(dateObj.getDate(), 2, "0");
    return year + "-" + month + "-" + day;
}
