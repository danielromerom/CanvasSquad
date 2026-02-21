# cleaning up assignment data for further processing
# not being used rn 
def normalize_assignments(assignments):
    return [
        {
            "id": a["id"],
            "title": a["name"],
            "due_at": a["due_at"],
            "points": a["points_possible"],
            "description": a["description"],
        }
        for a in assignments
        if a.get("published")
    ]
