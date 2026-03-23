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

---

# Unit Testing 🧪

This project includes comprehensive unit tests for the backend (Django models, services, and API clients).

## Running Tests

### Run All Tests
```bash
pytest backend/canvas/tests/ -v
```

### Run Tests with Coverage Report
```bash
pytest backend/canvas/tests/ -v --cov=canvas
```

### Run Specific Test File
```bash
pytest backend/canvas/tests/test_models.py -v
```

### Run Specific Test Class
```bash
pytest backend/canvas/tests/test_models.py::TestAssignment -v
```

### Run a Single Test
```bash
pytest backend/canvas/tests/test_models.py::TestAssignment::test_assignment_completion_status -v
```

## Test Coverage

Currently, the project has **34 unit/integration tests + 5 functional tests** covering:

| Test Type | Tests | Coverage | What's Tested |
|-----------|-------|----------|---------------|
| **Unit Tests - Models** | 10 | 100% | StudentProfile, Course, Assignment models |
| **Unit Tests - Services** | 8 | ~35% | Canvas sync, PDF storage, updates |
| **Unit Tests - Canvas Client** | 7 | 37% | API calls, error handling, pagination |
| **Unit Tests - LLM** | 5 | ~82% | Task generation, mocking |
| **Integration Tests** | 9 | ~40% | Full workflows, multi-course sync, error recovery |
| **Functional Tests** | 5 | ~10% | Browser extension UI, user workflows |
| **TOTAL** | **44** | **~35%** | Full stack from database to browser |

## Test Structure

Tests are organized in `/backend/canvas/tests/`:

- **test_models.py** — Unit tests for database models and relationships
- **test_services.py** — Unit tests for service layer (Canvas sync, LLM, PDF processing)
- **test_canvas_client.py** — Unit tests for Canvas API client
- **test_integration.py** — Integration tests for full workflows and endpoint testing

## Integration Tests

Integration tests verify that multiple components work together:

### Full Workflow Tests
```bash
pytest backend/canvas/tests/test_integration.py::TestCanvasSyncWorkflow -v
```
Tests: Canvas sync → database → task generation

### Multi-Course Sync Tests
```bash
pytest backend/canvas/tests/test_integration.py::TestMultiCourseSyncWorkflow -v
```
Tests: Multiple courses synced independently

### API Endpoint Tests
```bash
pytest backend/canvas/tests/test_integration.py::TestCanvasAPIEndpoints -v
```
Tests: Django views with real database

### Error Recovery Tests
```bash
pytest backend/canvas/tests/test_integration.py::TestErrorRecoveryWorkflow -v
```
Tests: System handles errors gracefully

### Multi-Student Tests
```bash
pytest backend/canvas/tests/test_integration.py::TestMultiStudentWorkflow -v
```
Tests: Multiple students in same course

## Key Testing Patterns Used

| Pattern | Purpose |
|---------|---------|
| **@pytest.mark.django_db** | Access database in tests |
| **Mock/Patch** | Replace external APIs (Canvas, OpenAI) |
| **Setup → Action → Assert** | Clear test structure |
| **pytest.raises()** | Verify exceptions |
| **refresh_from_db()** | Verify database updates |
| **Real DB + Mocked APIs** | Integration tests use real DB but mock external services |

## Functional Tests

Functional tests verify that the Canvas Squad Chrome extension works end-to-end from a user perspective. These tests use Selenium WebDriver to automate browser interactions.

### Setup Requirements

1. **Chrome Browser** - Must be installed on the system
2. **Extension Built** - Run `npm run build` in the frontend directory
3. **Python Dependencies** - Selenium and webdriver-manager (already added to requirements.txt)

### Running Functional Tests

```bash
# Run all functional tests
pytest backend/canvas/tests/test_functional.py -v -s --tb=short

# Run specific functional test
pytest backend/canvas/tests/test_functional.py::TestCanvasSquadExtension::test_extension_loads_on_canvas_page -v -s

# Run functional tests with markers
pytest -m "functional" -v -s

# Skip slow functional tests in CI
pytest -m "not slow" -v
```

### Testing on Real Canvas (Authenticated)

To test the extension on actual Canvas pages with authentication:

1. **Set environment variables:**
```bash
export CANVAS_TEST_USERNAME="your-username@ufl.edu"
export CANVAS_TEST_PASSWORD="your-password"
export CANVAS_TEST_COURSE_URL="https://ufldev.instructure.com/courses/YOUR_COURSE_ID"
```

2. **Use the test runner script:**
```bash
# Run all functional tests
./run_functional_tests.sh

# Run only authenticated test
./run_functional_tests.sh auth

# Run only real Canvas access test
./run_functional_tests.sh real
```

**Or run directly with pytest:**
```bash
pytest backend/canvas/tests/test_functional.py::TestCanvasSquadExtension::test_extension_with_canvas_authentication -v -s
```

**⚠️ Security Notes:**
- Never commit credentials to version control
- Use test accounts with minimal permissions
- Consider using Canvas API tokens instead of passwords
- Tests will handle login automatically but may need adjustment for UFL's auth system

### Test Coverage

Functional tests cover:

| Test | Purpose | Status |
|------|---------|--------|
| **Extension Loading** | Verifies extension loads in Chrome | ✅ Implemented |
| **Real Canvas Access** | Tests navigation to Canvas sites | ✅ Implemented |
| **Authentication Flow** | Tests login to Canvas (requires credentials) | ✅ Implemented |
| **UI Interaction** | Tests basic extension UI interactions | ✅ Implemented |
| **Task Generation** | Tests AI task generation workflow | ✅ Framework ready |
| **PDF Processing** | Tests PDF extraction and processing | ✅ Framework ready |
| **Feature Accessibility** | Tests all major features are accessible | ✅ Implemented |

**Current Results:** 5 passed, 4 skipped (appropriate for tests without credentials)

### Test Architecture

- **Selenium WebDriver** - Browser automation
- **Chrome Extension Loading** - Tests run with extension loaded
- **Local HTML Test Pages** - Simulates Canvas pages for testing
- **Graceful Degradation** - Tests skip if extension features aren't available

### CI/CD Integration

For continuous integration, functional tests can be run in headless mode:

```bash
# Add to chrome_options in test setup:
chrome_options.add_argument("--headless")
```

### Troubleshooting

**Extension not built error:**
```bash
cd frontend && npm run build
```

**Chrome driver issues:**
- webdriver-manager handles driver installation automatically
- If issues persist, manually install ChromeDriver

**Test timeouts:**
- Functional tests are slower than unit tests
- Increase timeouts for slower systems
- Use `--tb=short` for cleaner output

---

# Version Control & Git Workflow 📝

## Future Testing Improvements

- [ ] **Acceptance Tests** — User story validation and business requirements testing
- [ ] **Real Canvas Integration** — Test against actual Canvas instance (requires credentials)
- [ ] **Performance Tests** — Test PDF extraction speed, LLM response times
- [ ] **Frontend Unit Tests** — Jest + React Testing Library for React components
- [ ] **CI/CD Pipeline** — GitHub Actions to run tests on every push
- [ ] **Cross-browser Testing** — Test extension compatibility across browsers
- [ ] **Load Testing** — Test system performance under load

## Creating and Pushing to a Branch

### Create and Checkout a New Branch
```bash
git checkout -b branch-name
```
Example:
```bash
git checkout -b testing
```

### Push Branch to Remote
```bash
git push origin branch-name
```
Example:
```bash
git push origin testing
```

### Or, Switch to Existing Branch and Push
```bash
git checkout testing
git push origin testing
```

### View All Branches
```bash
git branch -a
```

## Workflow Example: Testing Branch
```bash
# Create testing branch
git checkout -b testing

# Make changes to files
# Run tests
pytest backend/canvas/tests/ -v

# Stage and commit
git add .
git commit -m "Add unit tests for canvas services"

# Push to testing branch
git push origin testing
```

---

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