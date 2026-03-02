import json
import openai
from django.conf import settings
from dotenv import load_dotenv
import PyPDF2


# # Read PDF file
# def extract_text_from_pdf(pdf_path):
#     text = ""
#     with open(pdf_path, 'rb') as file:
#         pdf_reader = PyPDF2.PdfReader(file)
#         for page in pdf_reader.pages:
#             text += page.extract_text() + "\n"
#     return text




client = openai.OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.LITELLM_BASE_URL 
)
# Generate task suggestions using LLM
def generate_task_suggestions(assignments):
    """
    assignments: List of dicts with keys like
    - title
    - due_at
    - points
    - description
    """

    prompt = f"""
You are an expert academic productivity coach focused on Student Agency and overcoming procrastination.
Your goal is to break assignments into Micro-Tasks that feel easy to start and impossible to fail.

Given the following assignments in JSON format:
{json.dumps(assignments, indent=2, default=str)}

For EACH assignment:
1. Break it into highly granular, bite-sized steps (Micro-Tasks).
2. QUANTITY Generate between 6 to 10 steps. (Enough to be clear, but not overwhelming).
3. TIME CONSTRAINT: Aim for tasks that take 20 to 60 minutes.
4. Actionable Verbs: Use low-friction verbs. Instead of "Study", use "Review Chapter 4 Summary".
5. Logical Flow & Momentum: - Arrange tasks in a logical, dependent order (Step 1 must be done before Step 2).
   - CRITICAL: Ensure the first 1-2 tasks are "Easy Wins" (low effort, high clarity) to build momentum.
6. Prioritization: Prioritize based on due date and points.
7. Provide a 1-sentence 'ai_insight' for each step (a pro-tip, motivation, or specific resource hint).

Respond ONLY in valid JSON using this structure:
{{
  "assignments": [
    {{
      "title": "Assignment name",
      "priority": "High | Medium | Low",
      "tasks": [
        {{
          "label": "Task description",
          "estimated_time_hours": 1.5,
          "description: "Optional longer description for the task",
          "ai_insight": "The pro-tip or summary here"
        }},
      ]
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-oss-120b",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    try:
        llm_data = json.loads(content)

        enhanced_assignments = []

        for llm_assign in llm_data.get("assignments", []):
            original = next(
                (a for a in assignments if a["title"] == llm_assign["title"]), 
                None
            )
            
            # add the due_at field
            if original:
                llm_assign["id"] = original["id"]
                llm_assign["due_at"] = str(original["due_at"])
                
            enhanced_assignments.append(llm_assign)
            
        return {"assignments": enhanced_assignments}
    except json.JSONDecodeError:
        # Fallback: log + return raw text
        return {
            "error": "Invalid JSON from LLM",
            "raw_response": content
        }

