import json
import openai
from django.conf import settings
from dotenv import load_dotenv




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
You are a productivity assistant for a college student.

Given the following assignments in JSON format:
{json.dumps(assignments, indent=2)}

For EACH assignment:
- Break it into 3-5 concrete, actionable steps
- Consider due dates and assignment weight
- Assign a priority (High, Medium, Low)

Respond ONLY in valid JSON using this structure:
{{
  "assignments": [
    {{
      "title": "Assignment name",
      "priority": "High | Medium | Low",
      "tasks": ["task 1", "task 2"]
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
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback: log + return raw text
        return {
            "error": "Invalid JSON from LLM",
            "raw_response": content
        }

