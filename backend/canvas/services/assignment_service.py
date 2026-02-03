# cleaning up assignment data for further processing
def normalize_assignments(assignments):
    return [
        {
            "title": a["name"],
            "due_at": a["due_at"],
            "points": a["points_possible"],
            "description": a["description"],
        }
        for a in assignments
        if a.get("published")
    ]
