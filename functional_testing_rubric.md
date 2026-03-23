# Compass – Canvas Assistant: Functional Testing Rubric

Manual checklist for verifying end-to-end behavior of the Chrome extension and Canvas integration. Each item should be tested in a real Chrome browser with the extension loaded from `frontend/dist`.

---

## Setup

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|-------------|
| 1 | Run `npm run build` in `frontend/` | `frontend/dist/` is created with `manifest.json` | |
| 2 | Open Chrome → `chrome://extensions/` → enable Developer mode → Load unpacked → select `frontend/dist` | "Compass - Canvas Assistant 1.0" appears, toggle is ON | |
| 3 | Navigate to `https://ufldev.instructure.com` | Page loads and redirects to Canvas login | |

---

## 1. Authentication

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 1.1 | Login page loads | Navigate to `https://ufldev.instructure.com` | Redirected to `/login/canvas`, email and password fields visible | |
| 1.2 | Successful login | Enter valid credentials, click login | Redirected to Canvas dashboard (`/`) | |
| 1.3 | Failed login | Enter wrong credentials, click login | Error message displayed, stays on login page | |
| 1.4 | Canvas OAuth flow (extension) | Click Compass icon in Chrome toolbar | Extension opens OAuth popup / login panel | |

---

## 2. Extension Injection

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 2.1 | Widget on dashboard | Log in, navigate to `https://ufldev.instructure.com/` | `#agency-native-widget` appears in DOM sidebar area | |
| 2.2 | Widget on course page | Navigate to `/courses/<id>` | `#agency-native-widget` visible in page | |
| 2.3 | Widget on assignment page | Navigate to `/courses/<id>/assignments/<id>` | `#agency-native-widget` visible in page | |
| 2.4 | Widget hidden on other pages | Navigate to `/courses/<id>/grades` | `#agency-native-widget` hidden (`display: none`) | |
| 2.5 | Widget not injected without `#main` | Open a non-Canvas page | Widget not present in DOM | |

---

## 3. Assignment Sync

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 3.1 | Assignments appear in widget | Log in, open a course with assignments | Assignment list visible inside the Compass widget | |
| 3.2 | Assignment due dates shown | View assignments in widget | Due dates displayed correctly | |
| 3.3 | Clicking an assignment | Click an assignment in the widget | Navigates to or highlights the correct assignment page | |

---

## 4. Task Generation

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 4.1 | Generate tasks for assignment | Open an assignment page, use widget to generate tasks | AI-generated task breakdown appears in the widget | |
| 4.2 | Tasks reflect assignment content | Generate tasks for an assignment with a description | Generated tasks are relevant to the assignment description | |
| 4.3 | Tasks for PDF assignment | Open an assignment that has a PDF attachment, generate tasks | Tasks are generated based on PDF content | |

---

## 5. PDF Extraction

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 5.1 | PDF link detected | Open an assignment with a PDF attachment | Widget shows option to process the PDF | |
| 5.2 | PDF content extracted | Trigger PDF extraction | Extracted text content is used for task generation | |
| 5.3 | Non-PDF assignment | Open an assignment without a PDF | No PDF extraction option shown | |

---

## 6. Student Dashboard / Timer

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 6.1 | Timer visible | Open any supported Canvas page | Timer/focus panel visible in widget | |
| 6.2 | Start timer | Click start on timer | Timer counts up/down correctly | |
| 6.3 | Timer persists across pages | Start timer, navigate to another Canvas page | Timer continues running | |
| 6.4 | Stats panel | Open stats/weekly view in widget | Weekly calendar or stats are displayed | |

---

## 7. Backend API

| # | Test | Steps | Expected Result | Pass / Fail |
|---|------|-------|-----------------|-------------|
| 7.1 | Health check | `GET /api/health/` | Returns 200 OK | |
| 7.2 | OAuth token exchange | Extension completes Canvas OAuth, backend receives auth code | Backend returns Canvas access token | |
| 7.3 | Assignment fetch | Backend calls Canvas API for assignments | Assignments returned and stored correctly | |
| 7.4 | Task generation endpoint | `POST /api/canvas/tasks/generate/` with assignment data | Returns AI-generated tasks | |
| 7.5 | PDF extraction endpoint | `POST /api/canvas/pdf/extract/` with PDF URL | Returns extracted text | |

---

## Notes

- **Credentials:** Use `source setup_credentials.sh` to load test credentials before running any automated backend tests.
- **Course URL for testing:** `https://ufldev.instructure.com/courses/255`

---

## Why We Could Not Use Selenium or Playwright for Functional Testing

We originally attempted to automate the functional tests using **Selenium WebDriver** and later **Playwright**, but both approaches were blocked by a fundamental Chrome browser security policy.

### The Core Problem: Chrome Blocks Developer Extensions in Automation Mode

When Chrome is launched by an automated testing tool like Selenium or Playwright, it starts in **automation mode**. This is detectable by Chrome internally and is used as a security signal. Starting with **Chrome 108** (released late 2022), Google introduced a policy that **automatically disables developer-mode extensions** — unpacked extensions loaded via "Load unpacked" in `chrome://extensions/` — whenever Chrome is running in an automated session.

Our extension (Compass - Canvas Assistant) is an unpacked, developer-mode extension distributed via `frontend/dist`. It is not published on the Chrome Web Store. Because of this, Chrome silently prevents it from running its content scripts when the browser is controlled by a testing framework.

### What We Tried

**1. Selenium with `--load-extension` flag**
The standard approach for loading a Chrome extension in Selenium is to pass `--load-extension=/path/to/dist` as a Chrome argument. We confirmed the path was correct and the `manifest.json` existed, but Chrome's automation policy blocked the content script from injecting into Canvas pages. No `#agency-native-widget` element appeared in the DOM, and browser console logs showed zero extension activity.

**2. Persistent Chrome Profile**
We created a dedicated Chrome test profile (`~/.canvas-test-profile`) by launching Chrome manually with `--user-data-dir`, installing the extension through the UI, and quitting cleanly. The extension was confirmed registered in the profile's `Secure Preferences` file with no disable reasons. When Selenium loaded this profile, Chrome started successfully and we could authenticate and navigate Canvas — but the content script still did not run. Navigating directly to `chrome-extension://agelmkoaekkmemnioakhdfenimaipjaa/manifest.json` returned a Chrome error page, confirming the extension was not active in the automated session.

**3. Suppressing Automation Flags**
We tried disabling the automation signal Chrome uses to detect WebDriver by adding:

```python
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option("useAutomationExtension", False)
```

This approach worked in older Chrome versions but no longer bypasses the extension policy in Chrome 108+.

**4. `undetected-chromedriver`**
We installed `undetected-chromedriver`, a library specifically designed to patch ChromeDriver binaries to avoid Chrome's automation detection. It ran but the extension remained inaccessible — confirming that Chrome's developer extension block operates at a deeper level than the automation detection flag alone.

**5. Playwright with Persistent Context**
Playwright has documented support for Chrome extensions via `launch_persistent_context`. We installed Playwright and attempted to load the extension using the same persistent profile. Playwright started the browser successfully, but navigating to the extension's internal URL returned `ERR_BLOCKED_BY_CLIENT`, confirming the same Chrome security policy was in effect regardless of the automation framework used.

### Why This Happens

Chrome's rationale for this restriction is security: developer-mode extensions have unrestricted access to page content, cookies, and browser APIs. Allowing them to run silently inside an automation session would make it trivially easy for malicious scripts to abuse extensions to steal data or bypass browser protections. The policy is intentional and not configurable through command-line flags or profile settings for unpacked extensions.

### What Would Be Required to Automate Extension Testing

To automate functional tests for a Chrome extension, one of the following would be needed:

- **Publish to the Chrome Web Store** — Store extensions can be force-installed via enterprise policy and are not subject to the developer-mode restriction. This is the standard path for production extensions.
- **Chrome Enterprise Policy** — Organizations can configure Chrome via managed policies (MDM or JSON policy files) to allow specific developer extensions in automated contexts. This requires system-level configuration and is not practical for a class project.
- **Chrome for Testing with a custom build** — Google provides a special "Chrome for Testing" binary intended for automation. With the right build flags, it may permit unpacked extensions, but this requires building or sourcing a non-standard Chrome binary.

### Conclusion

The functional test automation was not abandoned due to a flaw in the test code or the extension itself — both were working correctly. The limitation is a deliberate Chrome security policy that cannot be bypassed through any standard Selenium or Playwright configuration when using an unpacked developer extension. Manual testing against a live Canvas instance with the extension loaded in a normal Chrome browser is the appropriate substitute until the extension is published to the Chrome Web Store.
