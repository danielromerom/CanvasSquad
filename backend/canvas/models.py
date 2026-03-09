from django.db import models
from django.contrib.auth.models import User

# first class is the StudentProfile, which extends the built-in User model to include additional fields specific to our application. 
# Each student has a one-to-one relationship with a User, and we also store their Canvas user ID, time zone,
# and the date their profile was created.
class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )
    canvas_user_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    time_zone = models.CharField(max_length=100, default="UTC")

    def __str__(self):
        return self.user.username

# The Course model represents a course in Canvas. It has a unique canvas_course_id, a name, and an optional course code.
# Each course can have many students (many-to-many relationship) and many assignments (one-to-many relationship). 
# We also track when the course was created.

class Course(models.Model):
    canvas_course_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    course_code = models.CharField(max_length=50, blank=True)

    students = models.ManyToManyField(
        "StudentProfile",
        related_name="courses",
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.course_code})"

# The Assignment model represents an assignment within a course. Each assignment has a unique canvas_assignment_id,
# a title, description, due date, possible points, and completion status. It is linked to a Course via a foreign key.
# We also track when the assignment was last synced and when it was created.
class Assignment(models.Model):
    canvas_assignment_id = models.CharField(max_length=100, unique=True)

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="assignments"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    points_possible = models.FloatField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    document_text = models.TextField(blank=True, default="")
    document_text_updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

# The TaskGeneration model captures the details of each time we generate tasks for an assignment using the LLM.
#  It stores a reference to the related assignment, the name of the model used for generation, 
# the prompt that was sent to the LLM, the raw response received, and the timestamp of when the generation occurred.
class TaskGeneration(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="task_generations"
    )
    model_name = models.CharField(max_length=100)
    prompt_used = models.TextField()
    raw_response = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TaskGeneration for {self.assignment.title} using {self.model_name}"

# The Task model represents individual tasks that are generated for assignments. Each task is linked to an Assignment and optionally to a TaskGeneration.
# It includes fields for the task title, estimated time to complete (in minutes), priority level, order of the task, completion status, and creation timestamp.
class Task(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="tasks"
    )

    generation = models.ForeignKey(
        TaskGeneration,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True
    )

    title = models.CharField(max_length=255)
    estimated_minutes = models.PositiveIntegerField()
    priority = models.CharField(
        max_length=20,
        choices=[
            ("High", "High"),
            ("Medium", "Medium"),
            ("Low", "Low"),
        ],
        default="Medium",
    )
    order = models.PositiveIntegerField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    ai_insight = models.TextField(blank=True, null=True)

    # Meta class to define default ordering of tasks by their order field
    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.title} (#{self.order})"