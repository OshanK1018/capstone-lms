function isValidYYYYMMDD(dateString) {
    if (!(typeof(dateString) === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(dateString))))
        return false;
    
    const date = new Date(dateString + 'T00:00:00Z');
    const [year, month, day] = dateString.split('-').map(field => Number(field));
    return (date.getUTCFullYear() === year &&
            date.getUTCMonth() == (month - 1) &&
            date.getUTCDate() == day);
}

function isValidTime(timeString) {
    if (!(typeof(timeString) === 'string' && (/^\d{2}:\d{2}:\d{2}$/.test(timeString))))
        return false;

    const [hour, minute, second] = timeString.split(':').map(field => Number(field));
    return ((hour <= 23) && (hour >= 0) &&
            (minute <= 59) && (minute >= 0) &&
            (second <= 59) && (second >= 0));
}

module.exports = { isValidYYYYMMDD, isValidTime };