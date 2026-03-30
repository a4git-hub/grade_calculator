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
        const grade = calculateCategoryGrade(cat.assignments || []);
        totalGrade += grade * weight;
        totalWeightUsed += weight;
    }

    if (totalWeightUsed === 0) return 100.0; // Unweighted or no categories

    // Scale to 100% based on weights used
    return totalGrade / totalWeightUsed;
}

export function calculateFinalExamGrade(currentGrade, desiredGrade, finalWeightObj) {
    let finalWeight = parseFloat(finalWeightObj);
    if (finalWeight > 1.0) finalWeight = finalWeight / 100.0;
    if (finalWeight <= 0) return "Weight must be > 0";

    const needed = (desiredGrade - (currentGrade * (1 - finalWeight))) / finalWeight;
    return needed.toFixed(2);
}
