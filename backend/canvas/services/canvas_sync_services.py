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
    Calls LLM to generate task suggestions for assignments that do not already have tasks, and stores results in DB.
    """

    if not assignments:
        return {"generated": 0, "skipped": 0}

    # Filter assignments that already have tasks
    assignments_to_generate = []
    skipped = 0

    for assignment in assignments:
        # assignment can be a model instance OR dict
        assignment_id = assignment.id if hasattr(assignment, "id") else assignment.get("id")

        try:
            assignment_obj = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            continue

        if assignment_obj.tasks.exists():
            skipped += 1
            continue

        assignments_to_generate.append({
            "id": assignment_obj.id,
            "title": assignment_obj.title,
            "due_at": assignment_obj.due_at,
            "points": assignment_obj.points_possible,
            "description": assignment_obj.description,
        })

    #  Nothing new → no LLM call
    if not assignments_to_generate:
        return {"generated": 0, "skipped": skipped}

    # Call LLM only once
    llm_response = generate_task_suggestions(assignments_to_generate)

    generated = 0

    # Store results
    for llm_assign in llm_response.get("assignments", []):
        assignment_id = llm_assign.get("id")
        if not assignment_id:
            continue

        try:
            assignment_obj = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            continue

        # check if tasks exist 
        if assignment_obj.tasks.exists():
            continue

        task_gen = TaskGeneration.objects.create(
            assignment=assignment_obj,
            model_name="gpt-oss-120b",
            prompt_used="LLM generated tasks based on assignment details",
            raw_response=llm_assign
        )

        for order, task in enumerate(llm_assign.get("tasks", []), start=1):
            Task.objects.create(
                assignment=assignment_obj,
                generation=task_gen,
                title=task.get("label", f"Task {order}"),
                estimated_minutes=int(task.get("estimated_time_hours", 0) * 60),
                priority=llm_assign.get("priority", "Medium"),
                order=order
            )

        generated += 1

    return {
        "generated": generated,
        "skipped": skipped
    }