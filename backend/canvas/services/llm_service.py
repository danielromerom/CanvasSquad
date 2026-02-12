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
      "tasks": [
        {{
          "description": ,
          "estimated_time_hours":
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
                llm_assign["due_at"] = original["due_at"]
                
            enhanced_assignments.append(llm_assign)
            
        return {"assignments": enhanced_assignments}
    except json.JSONDecodeError:
        # Fallback: log + return raw text
        return {
            "error": "Invalid JSON from LLM",
            "raw_response": content
        }

