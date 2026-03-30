from typing import List, Dict, Union

def calculate_category_grade(assignments: List[Dict]) -> float:
    \"\"\"
    Calculates the grade percentage for a single category based on points earned / points possible.
    Expects a list of dictionaries like:
    [
        {\"name\": \"Homework 1\", \"score\": 9, \"total_points\": 10},
        {\"name\": \"Homework 2\", \"score\": 10, \"total_points\": 10}
    ]
    Returns a float between 0 and 100.
    \"\"\"
    total_earned = sum([a.get('score', 0) for a in assignments if a.get('score') is not None])
    total_possible = sum([a.get('total_points', 0) for a in assignments if a.get('score') is not None])
    
    if total_possible == 0:
        return 100.0 # Default if no graded assignments
        
    return (total_earned / total_possible) * 100

def calculate_overall_grade(categories: List[Dict]) -> float:
    \"\"\"
    Calculates the overall course grade based on category weights.
    Expects a list of categories like:
    [
        {\"name\": \"Homework\", \"weight\": 0.2, \"assignments\": [...]},
        {\"name\": \"Exams\", \"weight\": 0.8, \"assignments\": [...]}
    ]
    \"\"\"
    total_grade = 0.0
    total_weight_used = 0.0
    
    for cat in categories:
        weight = cat.get('weight', 0)
        grade = calculate_category_grade(cat.get('assignments', []))
        total_grade += grade * weight
        total_weight_used += weight
        
    if total_weight_used == 0:
        return 100.0  # Or whatever baseline we want
        
    # Scale it to out of 100 based on the weights used (if weights don't sum to 1.0 yet)
    return total_grade / total_weight_used

def what_if_grade(categories: List[Dict], fake_assignments: List[Dict]) -> float:
    \"\"\"
    Given existing categories and new fake assignments, calculate the hypothetical grade.
    fake_assignments:
    [
        {\"name\": \"Test 3\", \"score\": 90, \"total_points\": 100, \"category_name\": \"Exams\"}
    ]
    \"\"\"
    import copy
    temp_categories = copy.deepcopy(categories)
    
    for fake in fake_assignments:
        cat_name = fake.get('category_name')
        # Find the category
        for cat in temp_categories:
            if cat.get('name') == cat_name:
                if 'assignments' not in cat:
                    cat['assignments'] = []
                cat['assignments'].append(fake)
                break
                
    return calculate_overall_grade(temp_categories)

def calculate_final_exam_grade_needed(current_grade: float, desired_grade: float, final_weight: float) -> Union[float, str]:
    \"\"\"
    Calculate the score needed on a final exam to achieve a desired overall grade.
    final_weight should be a percentage between 0 and 100 (or decimal 0 and 1, we handle both).
    Formula: (Desired - (Current * (1 - Weight))) / Weight
    \"\"\"
    if final_weight > 1.0:
        final_weight = final_weight / 100.0
        
    if final_weight <= 0:
        return \"Weight must be > 0\"
        
    needed = (desired_grade - (current_grade * (1 - final_weight))) / final_weight
    return round(needed, 2)
