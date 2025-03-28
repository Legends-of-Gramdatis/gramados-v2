/**
 * Adds a specified amount of time to the current Date object.
 * @param {number} addTime - The amount of time in milliseconds to add.
 * Format: Compact Time Format
 */
Date.prototype.addTime = function(addTime) {
	this.setTime(this.getTime() + addTime);
};

/**
 * Checks if the current Date object has passed a specified date.
 * @param {Date} passDate - The date to compare against.
 * @returns {boolean} - True if the current date is equal to or after the specified date, false otherwise.
 * Format: Standard Date-Time Format
 */
Date.prototype.hasPassed = function(passDate) {
	return (this.getTime() >= passDate.getTime());
};

/**
 * Converts a time string in Compact Time Format into a number representing milliseconds.
 * @param {string} timeString - The time string to convert.
 * @returns {number} - The equivalent time in milliseconds.
 * Format: Compact Time Format
 * 
 * Example:
 * Input: "1d2h30min"
 * Output: 93600000 (milliseconds)
 */
function getStringTime(timeString) {
	//0y4mon3d 6h 8min3s 800ms
	var reg = /([\d]+)([a-zA-Z]+)/g;
	var _m = timeString.match(reg);
	var newTime = NaN;
	var _tk = Object.keys(msTable);

	for(var m in _m) {
		var fm = _m[m];
		var nm = fm.replace(reg, '$1').cInt();
		var om = fm.replace(reg, '$2');
		if(nm != null) {
			if(isNaN(newTime)) { newTime = 0; }
			if(_tk.indexOf(om) != -1) {
				newTime += nm * (msTable[_tk[_tk.indexOf(om)]]);
			} else { newTime += nm; }
		}
	}

	return newTime;
}

/**
 * Converts a number representing milliseconds into a time string in Compact Time Format.
 * @param {number} stringTime - The time in milliseconds to convert.
 * @param {string[]} excludes - An array of time units to exclude from the conversion (e.g., ["ms", "s"]).
 * @returns {string} - The formatted time string.
 * Format: Compact Time Format
 * 
 * Example:
 * Input: 93600000 (milliseconds), excludes=["ms"]
 * Output: "1d2h30min"
 */
function getTimeString(stringTime, excludes=[]) {
	var newTime = parseInt(stringTime);
	var newStr = '';
	for(var ms in msTable) {
		if(excludes.indexOf(ms) == -1) {
			var msnum = 0;
			while(newTime >= msTable[ms]) {
				msnum++;
				newTime -= msTable[ms];
			}
			if(msnum > 0) {
				newStr += msnum.toString() + ms;
			}
		}
	}

	return newStr;
}

/**
 * Converts Minecraft ticks into a formatted Minecraft Age Format string.
 * @param {number} ticks - The number of Minecraft ticks.
 * @returns {string} - The formatted Minecraft Age Format string.
 * Format: Minecraft Age Format
 * 
 * Example:
 * Input: 72000 (ticks)
 * Output: "0/0/1 (+ 1h)"
 */
function ticksToMinecraftAge(ticks) {
    var days = Math.floor(ticks / 24000);
    var years = Math.floor(days / 360);
    days = days - years * 360;
    var months = Math.floor(days / 30);
    days = days - months * 30;
    var hours = Math.floor((ticks % 24000) / 1000);

    return years + "/" + months + "/" + days + " ( + " + hours + "h)";
}

/**
 * Converts a Minecraft date into ticks.
 * @param {object} event - The event object (used for logging messages).
 * @param {number} days - The day component of the Minecraft date.
 * @param {number} months - The month component of the Minecraft date.
 * @param {number} years - The year component of the Minecraft date.
 * @param {number} hours - The hour component of the Minecraft date.
 * @param {number} minutes - The minute component of the Minecraft date.
 * @param {number} seconds - The second component of the Minecraft date.
 * @returns {number} - The equivalent time in ticks.
 * Format: Minecraft Age Format
 * 
 * Example:
 * Input: days=1, months=0, years=0, hours=1, minutes=0, seconds=0
 * Output: 79200 (ticks)
 */
function MCTimeToTicks(event, days, months, years, hours, minutes, seconds) {

    event.player.message("Botting Date: " + days + "/" + months + "/" + years + " " + hours + ":" + minutes + ":" + seconds);

    // Get system date
    var date = new Date();
    var current_day = date.getDate();
    var current_month = date.getMonth() + 1;
    var current_year = date.getFullYear();
    var current_hour = date.getHours();
    var current_minute = date.getMinutes();
    var current_second = date.getSeconds();

    event.player.message("Current Date: " + current_day + "/" + current_month + "/" + current_year + " " + current_hour + ":" + current_minute + "/" + current_second);

    // Get elapsed time
    var elapsed_years = current_year - years;
    var elapsed_months = current_month - months;
    var elapsed_days = current_day - days;
    var elapsed_hours = current_hour - hours;
    var elapsed_minutes = current_minute - minutes;
    var elapsed_seconds = current_second - seconds;

    if (elapsed_seconds < 0) {
        elapsed_seconds = 60 + elapsed_seconds;
        elapsed_minutes--;
    }
    if (elapsed_minutes < 0) {
        elapsed_minutes = 60 + elapsed_minutes;
        elapsed_hours--;
    }
    if (elapsed_hours < 0) {
        elapsed_hours = 24 + elapsed_hours;
        elapsed_days--;
    }
    if (elapsed_days < 0) {
        elapsed_days = 30 + elapsed_days;
        elapsed_months--;
    }
    if (elapsed_months < 0) {
        elapsed_months = 12 + elapsed_months;
        elapsed_years--;
    }

    event.player.message("Elapsed Time: " + elapsed_days + "/" + elapsed_months + "/" + elapsed_years + " " + elapsed_hours + ":" + elapsed_minutes + ":" + elapsed_seconds);

    // Get how much time that is in ticks (20 ticks = 1 second, 1 hour = 72000 ticks)
    var ticks = (elapsed_years * 360 * 72000 * 24) + (elapsed_months * 30 * 72000 * 24) + (elapsed_days * 72000 * 24) + (elapsed_hours * 72000) + (elapsed_minutes * 1200) + (elapsed_seconds * 20);

    event.player.message("Ticks: " + ticks);

    return ticks;
}

/**
 * Gets the current IRL date in Standard Date-Time Format.
 * @returns {string} - The formatted date string.
 * Format: Standard Date-Time Format
 * 
 * Example:
 * Output: "01/01/2023 12:00:00"
 */
function getIRLDate() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    // Add a 0 to the left of the number if it is less than 10
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}

/**
 * Converts between different date/time formats.
 * @param {string|number} input - The input date/time to convert. Can be in Compact Time Format, Standard Date-Time Format, or Minecraft Age Format.
 * @param {string} fromFormat - The format of the input ("compact", "standard", "mc-age").
 * @param {string} toFormat - The desired output format ("compact", "standard", "mc-age").
 * @returns {string|number} - The converted date/time in the desired format.
 */
function convertDateTime(input, fromFormat, toFormat) {
    if (fromFormat === "compact" && toFormat === "standard") {
        // Convert Compact Time Format to Standard Date-Time Format
        const ms = getStringTime(input);
        const date = new Date(ms);
        return getIRLDate.call(date);
    } else if (fromFormat === "standard" && toFormat === "compact") {
        // Convert Standard Date-Time Format to Compact Time Format
        const date = new Date(input);
        const ms = date.getTime();
        return getTimeString(ms);
    } else if (fromFormat === "mc-age" && toFormat === "compact") {
        // Convert Minecraft Age Format to Compact Time Format
        const [years, months, days, hours] = input.match(/\d+/g).map(Number);
        const ticks = MCTimeToTicks(null, days, months, years, hours, 0, 0);
        return getTimeString(ticks * 50); // Convert ticks to milliseconds
    } else if (fromFormat === "compact" && toFormat === "mc-age") {
        // Convert Compact Time Format to Minecraft Age Format
        const ms = getStringTime(input);
        const ticks = Math.floor(ms / 50); // Convert milliseconds to ticks
        return ticksToMinecraftAge(ticks);
    } else {
        throw new Error(`Unsupported conversion from ${fromFormat} to ${toFormat}`);
    }
}

/**
 * Converts a tick count into Compact Time Format.
 * @param {number} ticks - The number of Minecraft ticks.
 * @returns {string} - The equivalent time in Compact Time Format.
 * Format: Compact Time Format
 * 
 * Example:
 * Input: 72000 (ticks)
 * Output: "1d"
 */
function ticksToCompactTime(ticks) {
    const ms = ticks * 50; // Convert ticks to milliseconds
    return getTimeString(ms);
}