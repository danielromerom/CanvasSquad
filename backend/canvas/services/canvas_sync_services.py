# combines logic for syncing courses/assignments from Canvas and generating tasks using LLM
from canvas.models import Course, Assignment, TaskGeneration, Task
from .llm_service import generate_task_suggestions

def sync_assignments(course_canvas_id, course_name, raw_assignments):
    """
    syncs assignments from Canvas to our DB.
     - Creates/updates Course and Assignment objects.
     - Returns a list of normalized assignment dicts for task generation.
    """
    #  Sync course
    course, _ = Course.objects.get_or_create(
        canvas_course_id=str(course_canvas_id),
        defaults={"name": course_name or f"Course {course_canvas_id}"}
    )

    normalized_assignments = []

    for a in raw_assignments:
        if not a.get("published"):
            continue

        assignment_obj, _ = Assignment.objects.update_or_create(
            canvas_assignment_id=str(a["id"]),
            defaults={
                "course": course,
                "title": a.get("name", "Untitled Assignment"),
                "description": a.get("description", ""),
                "due_at": a.get("due_at"),
                "points_possible": a.get("points_possible"),
            }
        )

        normalized_assignments.append({
            "id": assignment_obj.id,  # DB id
            "title": assignment_obj.title,
            "due_at": assignment_obj.due_at,
            "points": assignment_obj.points_possible,
            "description": assignment_obj.description,
        })

    return normalized_assignments


def generate_and_store_tasks(assignments):
    """
    calls LLM to generate task suggestions for each assignment and stores the results in the DB.
    """
    if not assignments:
        return []

    #  llm call
    llm_response = generate_task_suggestions(assignments)

    # Loop through assignments returned from LLM
    for llm_assign in llm_response.get("assignments", []):
        # Get the DB assignment
        # We use the DB id (not canvas_assignment_id) because that's what we sent to the LLM in the first place.
        assignment_id = llm_assign.get("id")
        if not assignment_id:
            continue

        try:
            assignment_obj = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            continue

        # create a TaskGeneration record for this run (one per assignment)
        task_gen = TaskGeneration.objects.create(
            assignment=assignment_obj,
            model_name="gpt-oss-120b",
            prompt_used="LLM generated tasks based on assignment details",
            raw_response=llm_assign
        )

        # creating Task records for each suggested task from the LLM 
        for order, task in enumerate(llm_assign.get("tasks", []), start=1):
            Task.objects.create(
                assignment=assignment_obj,
                generation=task_gen,
                title=task.get("label", f"Task {order}"),
                estimated_minutes=int(task.get("estimated_time_hours", 0) * 60),
                priority=task.get("priority", "Medium"),
                order=order
            )

    return True

