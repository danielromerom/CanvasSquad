## not using this rn may delete later

from canvas.models import TaskGeneration, Task
from canvas.services.llm_service import generate_task_suggestions

def generate_and_store_tasks(assignments):
    normalized = [
        {
            "id": a.id,
            "title": a.title,
            "due_at": a.due_at,
            "points": a.points_possible,
            "description": a.description,
        }
        for a in assignments
    ]

    llm_response = generate_task_suggestions(normalized)

    for llm_assign in llm_response.get("assignments", []):
        assignment = next(
            a for a in assignments if a.id == llm_assign["id"]
        )

        # 🔐 One generation record per run
        generation = TaskGeneration.objects.create(
            assignment=assignment,
            model_name="gpt-oss-120b",
            prompt_used="auto-generated",
            raw_response=llm_assign,
        )

        # 🔄 Clear old tasks (optional but recommended)
        assignment.tasks.all().delete()

        for index, task in enumerate(llm_assign["tasks"], start=1):
            Task.objects.create(
                assignment=assignment,
                generation=generation,
                title=task["label"],
                estimated_minutes=int(task["estimated_time_hours"] * 60),
                priority=llm_assign["priority"],
                order=index,
            )
