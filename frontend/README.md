Backend
cd backend

Windows
python -m venv venv
venv\Scripts\activate

Mac/Linux
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver


Frontend
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