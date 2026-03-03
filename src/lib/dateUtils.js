export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Converts any time string to 24-hour format (HH:MM).
 * Handles 12-hour format (e.g., "02:30 PM" -> "14:30") and preserves native 24-hour format.
 */
export function formatTimeTo24Hour(timeStr) {
    if (!timeStr) return '';

    // Trim string
    timeStr = String(timeStr).trim();

    // Check if it matches AM/PM pattern
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match) {
        let [_, hours, minutes, modifier] = match;
        let hrs = parseInt(hours, 10);

        if (modifier.toUpperCase() === 'PM' && hrs < 12) {
            hrs += 12;
        } else if (modifier.toUpperCase() === 'AM' && hrs === 12) {
            hrs = 0;
        }

        return `${String(hrs).padStart(2, '0')}:${minutes}`;
    }

    // Check if it's already HH:MM (or HH:MM:SS) format without AM/PM
    const militaryMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
        let [_, hrs, mins] = militaryMatch;
        return `${hrs.padStart(2, '0')}:${mins}`;
    }

    return timeStr; // Fallback to return original string if it doesn't match expected time formats
}
