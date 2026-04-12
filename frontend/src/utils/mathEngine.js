export function calculateCategoryGrade(assignments) {
    const graded = assignments.filter((a) => a.score !== null && a.score !== undefined);
    if (graded.length === 0) return 100.0;

    const totalEarned = graded.reduce((sum, a) => sum + parseFloat(a.score), 0);
    const totalPossible = graded.reduce((sum, a) => sum + parseFloat(a.total_points), 0);

    if (totalPossible === 0) return 100.0;
    return (totalEarned / totalPossible) * 100;
}

export function calculateOverallGrade(categories) {
    let totalGrade = 0.0;
    let totalWeightUsed = 0.0;

    for (const cat of categories) {
        const weight = parseFloat(cat.weight || 0);

        // Check if there are any valid assignments (score != null) or fake What-If assignments
        const validAssignments = (cat.assignments || []).filter(a => (a.score !== null && a.score !== undefined) || a.isFake);
        if (validAssignments.length === 0) continue; // SKIP THIS CATEGORY if empty (e.g. un-taken Final Exam)

        const grade = calculateCategoryGrade(cat.assignments || []);
        totalGrade += grade * weight;
        totalWeightUsed += weight;
    }

    if (totalWeightUsed === 0) return 100.0; // Unweighted or no categories

    // Scale to 100% based on weights used
    return totalGrade / totalWeightUsed;
}

export function calculateAdvancedFinalExamGrade(categories, targetCategoryId, desiredGrade, finalPoints) {
    let S_other = 0;
    let W_other = 0;
    let targetCatWeight = 0;
    let E_c = 0;
    let T_c = 0;

    let targetCatExists = false;

    for (const cat of categories) {
        const weight = parseFloat(cat.weight || 0);
        if (cat.id === targetCategoryId) {
            targetCatExists = true;
            targetCatWeight = weight;
            const valid = (cat.assignments || []).filter(a => (a.score !== null && a.score !== undefined) || a.isFake);
            E_c = valid.reduce((sum, a) => sum + parseFloat(a.score), 0);
            T_c = valid.reduce((sum, a) => sum + parseFloat(a.total_points), 0);
        } else {
            const valid = (cat.assignments || []).filter(a => (a.score !== null && a.score !== undefined) || a.isFake);
            if (valid.length > 0) {
                const grade = calculateCategoryGrade(cat.assignments || []);
                S_other += grade * weight;
                W_other += weight;
            }
        }
    }

    if (!targetCatExists || targetCatWeight === 0) return "Impossible (Weight is 0)";

    // W_total will be W_other + targetCatWeight (since adding the final activates the category if empty)
    const W_total = W_other + targetCatWeight;

    // D * W_total = S_other + weight_c * (E_c + X) / (T_c + P_final) * 100
    // ratio = (D * W_total - S_other) / (weight_c * 100)
    const neededRatio = (desiredGrade * W_total - S_other) / (targetCatWeight * 100);

    // X = ratio * (T_c + P_final) - E_c
    if (T_c === 0 || !finalPoints) {
        // If T_c is 0, the points don't matter, percentage is just neededRatio * 100
        return (neededRatio * 100).toFixed(2);
    } else {
        const pts = parseFloat(finalPoints);
        if (isNaN(pts) || pts <= 0) return "?";
        const requiredPoints = neededRatio * (T_c + pts) - E_c;
        return ((requiredPoints / pts) * 100).toFixed(2);
    }
}

export function getLetterGrade(percentage) {
    const val = parseFloat(percentage);
    if (isNaN(val)) return '-';
    if (val >= 97) return 'A+';
    if (val >= 93) return 'A';
    if (val >= 90) return 'A-';
    if (val >= 87) return 'B+';
    if (val >= 83) return 'B';
    if (val >= 80) return 'B-';
    if (val >= 77) return 'C+';
    if (val >= 73) return 'C';
    if (val >= 70) return 'C-';
    if (val >= 67) return 'D+';
    if (val >= 63) return 'D';
    if (val >= 60) return 'D-';
    return 'F';
}
