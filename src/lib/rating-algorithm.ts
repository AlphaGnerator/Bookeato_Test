/**
 * Computes the new average rating for a partner.
 * 
 * @param currentRating The current average rating (e.g., 4.2)
 * @param totalRatings The total number of ratings received so far (e.g., 100)
 * @param newRating The new rating received (1 to 5)
 * @returns The updated average rating rounded to 1 decimal place.
 */
export function computeNewPartnerRating(
    currentRating: number, 
    totalRatings: number, 
    newRating: number
): number {
    if (totalRatings === 0) return newRating;
    
    // Simple moving average
    const totalScore = (currentRating * totalRatings) + newRating;
    const newAverage = totalScore / (totalRatings + 1);
    
    // Round to nearest 0.5 or 0.1? The user mentioned "increasing by .5" for the UI, 
    // but the actual rating can be more granular. I'll round to 1 decimal place.
    return Math.round(newAverage * 10) / 10;
}

/**
 * Determines the color for a rating value.
 * 1-2: Red
 * 3: Yellow
 * 4-5: Green
 */
export function getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
}

export function getRatingButtonColor(value: number, selectedValue: number | null): string {
    if (selectedValue !== null && value <= selectedValue) {
        if (selectedValue >= 4) return 'bg-green-500 border-green-600 text-white';
        if (selectedValue >= 3) return 'bg-yellow-400 border-yellow-500 text-white';
        return 'bg-red-500 border-red-600 text-white';
    }
    return 'bg-white border-stone-200 text-stone-600 hover:border-stone-300';
}
