/**
 * Formats a number dynamically based on its size.
 * - Numbers >= 1 or <= -1 return exactly 2 decimal places.
 * - Numbers strictly between -1 and 1 return up to 4 significant 
 * digits after their leading zeros, bypassing scientific notation.
 */
export function formatDynamicDecimal(num: number): string {
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    if (num === 0) return '0.00';

    const absNum = Math.abs(num);

    if (absNum >= 1) {
        // Round normal numbers to 2 decimal places
        return num.toFixed(2);
    } else {
        // Determine the position of the first non-zero digit
        // e.g., for 0.0005, log10 is roughly -3.3 -> floor is -4
        const magnitude = Math.floor(Math.log10(absNum));

        // Add 3 to the absolute magnitude to get 4 significant digits
        // e.g., |-4| + 3 = 7 decimal places needed
        const decimalsToKeep = Math.abs(magnitude) + 3;

        // Cap at 100 to prevent RangeError in .toFixed()
        const safeDecimals = Math.min(100, Math.max(2, decimalsToKeep));

        const formatted = num.toFixed(safeDecimals);

        // Strip trailing zeroes to keep it clean (e.g., "0.00050" -> "0.0005")
        // It guarantees we keep at least the non-zero digits
        return formatted.replace(/(\.\d*?[1-9])0+$/, '$1');
    }
}
