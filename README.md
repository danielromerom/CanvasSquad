# Backend Setup

## 1. Navigate to the Backend Folder

```bash
cd backend
```

## 2. Create and Activate a Virtual Environment

### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

### Mac/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## 4. Apply Migrations

```bash
python manage.py migrate
```

## 5. Run the Development Server

```bash
python manage.py runserver
```

---

# Environment Variables Setup

This project requires API keys for both Canvas and OpenAI.

## 1. Canvas API Access Token

To make Canvas API calls, you must generate a personal access token:

1. Log into Canvas.
2. Go to **Account** (top left).
3. Click **Profile**.
4. Scroll to **Approved Integrations**.
5. Click **+ New Access Token** and generate one.
6. Copy the generated token.

---

## 2. Create a `.env` File

Create a `.env` file in the project root directory (same level as `manage.py`).

Add the following:

```env
CANVAS_ACCESS_TOKEN="your_canvas_access_token"
OPENAI_API_KEY="your_openai_api_key"
```

- `CANVAS_ACCESS_TOKEN` is required for retrieving course and assignment data.
- `OPENAI_API_KEY` is required for AI-powered assignment breakdown functionality.

Make sure your `.env` file is included in `.gitignore` and never committed to version control.

## TESTING FOR PDFS - USE THIS URL
courses/<int:course_id>/assignments/<int:assignment_id>/pdfs.zip - replacing course ID and assignment ID as you see fit. 

## Frontend
cd frontend
npm install
npm run dev


Loading into Chrome

Open Chrome Extensions:
Go to chrome://extensions
Toggle "Developer Mode" (Top Right) -> ON.

Load the Extension:
Click "Load Unpacked" (Top Left).
Select the frontend/dist folder.
Note: Do NOT select frontend or public. You must select dist.

Verify:
Go to Canvas (e.g., ufl.instructure.com).
You should see the  widget injected into the dashboard.

## NGrok Setup (Temporary while we wait for backend deployment)

To expose your local backend server to the internet for testing:

Go to https://ngrok.com/
Create an account
Go to https://dashboard.ngrok.com/get-started/setup/windows or https://dashboard.ngrok.com/get-started/setup/macos

Install ngrok
Add authtoken

Run command:
ngrok http 8000
Copy ngrok link (Example: 'https://crosscurrented-roselle-prototypical.ngrok-free.dev')
Replace export const API_BASE_URL = "" from frontend's config.js file with ngrok link