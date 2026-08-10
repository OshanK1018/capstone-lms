function isValidYYYYMMDD(dateString) {
    if (!(typeof(dateString) === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)))
        return false;
    
    const date = new Date(dateString + 'T00:00:00Z');
    const [year, month, day] = dateString.split('-').map(field => Number(field))
    return (date.getUTCFullYear() === year &&
            date.getUTCMonth() == (month - 1) &&
            date.getUTCDate() == day);
}

module.exports = { isValidYYYYMMDD };