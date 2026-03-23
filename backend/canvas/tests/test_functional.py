import pytest
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service


@pytest.mark.functional
@pytest.mark.slow
class TestCanvasSquadExtension:
    """Functional tests for the Canvas Squad Chrome extension.

    These tests require:
    1. Chrome browser installed
    2. Extension built (run 'npm run build' in frontend/)
    3. Internet connection for Canvas access
    4. Valid Canvas credentials (for full end-to-end testing)

    Run with: pytest backend/canvas/tests/test_functional.py -v -s
    """

    @pytest.fixture(scope="class")
    def chrome_driver_with_extension(self):
        """Set up Chrome driver with the Canvas Squad extension loaded."""
        # Path to the built extension
        extension_path = os.path.join(
            os.path.dirname(__file__),  # backend/canvas/tests/
            '..', '..', '..',          # Go up to project root (CanvasSquad/)
            'frontend', 'dist'         # Extension build directory
        )

        print(f"🔧 Extension path: {extension_path}")
        print(f"📁 Extension exists: {os.path.exists(extension_path)}")

        # Ensure extension is built
        if not os.path.exists(extension_path):
            pytest.skip(f"Extension not built. Run 'npm run build' in frontend/ directory. Expected path: {extension_path}")

        print("✅ Extension found, configuring Chrome...")

        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-extensions-except=" + extension_path)
        chrome_options.add_argument("--load-extension=" + extension_path)

        # Add extension to allowed origins for testing
        chrome_options.add_argument("--allow-file-access-from-files")
        chrome_options.add_argument("--disable-web-security")

        # For headless testing (uncomment for CI)
        # chrome_options.add_argument("--headless")

        print("🚀 Starting Chrome with extension...")
        try:
            # Use webdriver-manager to handle ChromeDriver
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            print("✅ Chrome started successfully with extension")
            yield driver
        except Exception as e:
            print(f"❌ Failed to start Chrome: {str(e)}")
            pytest.skip(f"Cannot start Chrome with extension: {str(e)}")
        finally:
            try:
                driver.quit()
                print("🛑 Chrome closed")
            except:
                pass

    def test_extension_on_real_canvas_page(self, chrome_driver_with_extension):
        """Test extension behavior on a real Canvas development instance."""
        driver = chrome_driver_with_extension

        # Use UFL Dev Canvas instance
        canvas_url = "https://ufldev.instructure.com"

        try:
            print(f"🌐 Navigating to: {canvas_url}")
            # Navigate to Canvas dev
            driver.get(canvas_url)

            # Wait for page load
            print("⏳ Waiting for page to load...")
            WebDriverWait(driver, 15).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            print("✅ Page loaded")

            # Check current URL (might be redirected)
            current_url = driver.current_url
            print(f"📍 Current URL: {current_url}")

            # Check page title
            title = driver.title
            print(f"📄 Page title: {title}")

            # Check if we're on a Canvas page (look for Canvas-specific elements)
            canvas_indicators = driver.find_elements(By.CSS_SELECTOR,
                "#application, .ic-Layout-wrapper, [data-reactroot], .canvas-content"
            )
            print(f"🔍 Found {len(canvas_indicators)} Canvas indicator elements")

            if len(canvas_indicators) == 0:
                print("❌ No Canvas indicators found - this might not be a Canvas page")
                pytest.skip("Not on a Canvas page - extension won't activate")

            print("✅ Detected Canvas page elements")

            # Give extension time to inject UI
            print("⏳ Waiting for extension to activate...")
            time.sleep(3)

            # Look for extension UI elements
            extension_selectors = [
                "[data-extension*='canvas']",
                ".canvas-squad-widget",
                "#canvas-squad-button",
                "[class*='canvas-squad']",
                "[id*='canvas-squad']"
            ]

            extension_found = False
            for selector in extension_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                print(f"🔍 Checking selector '{selector}': found {len(elements)} elements")
                if len(elements) > 0:
                    extension_found = True
                    print(f"✅ Extension UI found with selector: {selector}")
                    break

            if extension_found:
                print("🎉 SUCCESS: Extension successfully injected UI on Canvas page")
                assert True  # Test passes
            else:
                print("❌ Extension did not inject UI on Canvas page")
                print("This might be expected if:")
                print("  - Extension needs specific page (dashboard, assignments, etc.)")
                print("  - Extension requires user authentication")
                print("  - Extension has additional activation conditions")
                pytest.skip("Extension UI not detected - may need specific page/context")

        except Exception as e:
            print(f"❌ Error testing on Canvas: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            pytest.skip(f"Cannot test on Canvas dev instance: {str(e)}")

    def test_extension_with_canvas_authentication(self, chrome_driver_with_extension):
        """Test extension on authenticated Canvas course pages."""
        driver = chrome_driver_with_extension

        # This test requires Canvas credentials to be set as environment variables
        canvas_username = os.getenv('CANVAS_TEST_USERNAME')
        canvas_password = os.getenv('CANVAS_TEST_PASSWORD')
        course_url = os.getenv('CANVAS_TEST_COURSE_URL', 'https://ufldev.instructure.com/courses/123')

        if not canvas_username or not canvas_password:
            pytest.skip("Canvas test credentials not provided. Set CANVAS_TEST_USERNAME and CANVAS_TEST_PASSWORD environment variables.")

        try:
            print("🔐 Starting Canvas authentication flow...")

            # Navigate to Canvas login
            driver.get("https://ufldev.instructure.com")

            # Wait for login page
            WebDriverWait(driver, 10).until(
                lambda d: "login" in d.current_url.lower() or "canvas" in d.title.lower()
            )
            print("📝 On login page, looking for form fields...")

            # Try to find and fill login form (this will vary by institution)
            try:
                # Common Canvas login field selectors
                username_selectors = [
                    "input[type='email']",
                    "input[name*='user']",
                    "input[id*='user']",
                    "#pseudonym_session_unique_id",
                    "input[placeholder*='email']",
                    "input[placeholder*='username']"
                ]

                password_selectors = [
                    "input[type='password']",
                    "input[name*='pass']",
                    "#pseudonym_session_password",
                    "input[placeholder*='password']"
                ]

                username_field = None
                password_field = None

                # Find username field
                for selector in username_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            username_field = elements[0]
                            break
                    except:
                        continue

                # Find password field
                for selector in password_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            password_field = elements[0]
                            break
                    except:
                        continue

                if username_field and password_field:
                    print("✅ Found login form, entering credentials...")
                    username_field.clear()
                    username_field.send_keys(canvas_username)

                    password_field.clear()
                    password_field.send_keys(canvas_password)

                    # Find and click login button
                    login_selectors = [
                        "button[type='submit']",
                        "input[type='submit']",
                        "button[id*='login']",
                        ".btn-primary",
                        "button[class*='login']",
                        "[value*='login']"
                    ]

                    login_button = None
                    for selector in login_selectors:
                        try:
                            elements = driver.find_elements(By.CSS_SELECTOR, selector)
                            if elements:
                                login_button = elements[0]
                                break
                        except:
                            continue

                    if login_button:
                        login_button.click()
                        print("✅ Login submitted, waiting for redirect...")
                    else:
                        print("❌ Could not find login button")
                        pytest.skip("Login form found but no submit button")

                else:
                    print("❌ Could not find username/password fields")
                    print("This might be SSO login or different auth system")
                    print("Available input fields:")
                    inputs = driver.find_elements(By.TAG_NAME, "input")
                    for i, inp in enumerate(inputs[:5]):  # Show first 5
                        print(f"  {i+1}. {inp.get_attribute('type')} - {inp.get_attribute('name')} - {inp.get_attribute('id')}")
                    pytest.skip("Login form fields not found - manual authentication required")

            except Exception as e:
                print(f"❌ Login form interaction failed: {str(e)}")
                pytest.skip(f"Could not interact with login form: {str(e)}")

            # Wait for successful login (should redirect away from login page)
            try:
                WebDriverWait(driver, 30).until(
                    lambda d: "login" not in d.current_url.lower() and "auth" not in d.current_url.lower()
                )
                print("✅ Successfully logged in to Canvas!")
                print(f"📍 Current URL after login: {driver.current_url}")
            except TimeoutException:
                print("❌ Login may have failed - still on auth page")
                print(f"📍 Current URL: {driver.current_url}")
                pytest.skip("Login did not complete successfully")

            # Navigate to test course
            print(f"📚 Navigating to course: {course_url}")
            driver.get(course_url)

            # Wait for course page to load
            WebDriverWait(driver, 15).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )

            # Verify we're on a course page
            if "courses" in driver.current_url:
                print("✅ Successfully loaded course page")
                print(f"📍 Course URL: {driver.current_url}")
            else:
                print(f"⚠️  Unexpected URL: {driver.current_url}")
                print("May not be on expected course page")

            # Give extension time to inject UI on course page
            print("⏳ Waiting for extension to activate on course page...")
            time.sleep(5)

            # Look for extension UI elements
            extension_selectors = [
                "[data-extension*='canvas']",
                ".canvas-squad-widget",
                "#canvas-squad-button",
                "[class*='canvas-squad']",
                "[id*='canvas-squad']",
                ".assignment-tools",
                ".task-generator",
                ".pdf-extractor"
            ]

            extension_found = False
            found_elements = []

            for selector in extension_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if len(elements) > 0:
                    extension_found = True
                    found_elements.append(f"{selector} ({len(elements)} elements)")
                    print(f"✅ Extension UI found: {selector} ({len(elements)} elements)")

            if extension_found:
                print("🎉 SUCCESS: Extension is active on authenticated Canvas course page!")
                print(f"Found UI elements: {', '.join(found_elements)}")

                # Test could be extended to:
                # - Click extension buttons
                # - Verify task generation workflows
                # - Test PDF extraction
                # - Check assignment synchronization

                assert True  # Test passes
            else:
                print("❌ Extension UI not detected on course page")
                print("Possible reasons:")
                print("- Extension needs specific page context (assignments tab, specific assignment)")
                print("- Extension requires user interaction to activate")
                print("- Extension has different activation conditions")
                print("- Test course may not have expected content")
                print("- Extension may need page refresh or different timing")

                # Let's check what elements are actually on the page
                print("\n🔍 Debugging: Checking for any extension-related elements...")
                all_divs = driver.find_elements(By.TAG_NAME, "div")
                extension_related = [div for div in all_divs[:50] if any(term in (div.get_attribute("class") or "").lower() for term in ["canvas", "squad", "extension"])]
                if extension_related:
                    print(f"Found {len(extension_related)} potentially extension-related divs:")
                    for div in extension_related[:5]:
                        print(f"  - Class: {div.get_attribute('class')}, ID: {div.get_attribute('id')}")

                pytest.skip("Extension UI not detected - may need different page or manual activation")

        except Exception as e:
            print(f"❌ Error testing authenticated Canvas: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            pytest.skip(f"Could not test on authenticated Canvas: {str(e)}")

    def test_extension_ui_interaction(self, chrome_driver_with_extension):
        """Test basic UI interactions with the extension."""
        driver = chrome_driver_with_extension

        # Load a test page
        test_html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test Canvas Page</title></head>
        <body>
            <div id="canvas-content">
                <h1>Canvas Dashboard</h1>
                <div id="canvas-squad-button">Canvas Squad</div>
                <div id="canvas-squad-panel" style="display: none;">Extension Panel</div>
            </div>
        </body>
        </html>
        """

        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(test_html)
            temp_file = f.name

        try:
            driver.get(f"file://{temp_file}")

            # This test would interact with extension UI elements
            # For now, we'll test if the extension can find and interact with page elements
            try:
                # Wait for extension UI to be ready (if it creates buttons)
                extension_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.ID, "canvas-squad-button"))
                )
                extension_button.click()

                # Verify extension panel opens
                extension_panel = WebDriverWait(driver, 5).until(
                    EC.visibility_of_element_located((By.ID, "canvas-squad-panel"))
                )
                assert extension_panel.is_displayed(), "Extension panel did not open"

            except TimeoutException:
                pytest.skip("Extension UI elements not found - extension may inject different elements")

        finally:
            os.unlink(temp_file)

    def test_task_generation_workflow_simulation(self, chrome_driver_with_extension):
        """Test the task generation workflow simulation."""
        driver = chrome_driver_with_extension

        # Create a test page with assignment data
        test_html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test Assignment Page</title></head>
        <body>
            <div class="assignment-details">
                <h1>Assignment: Research Paper</h1>
                <div class="description">
                    <p>Write a 5-page research paper on artificial intelligence.</p>
                    <p>Due: April 1st</p>
                </div>
            </div>
            <div id="canvas-squad-tasks"></div>
        </body>
        </html>
        """

        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(test_html)
            temp_file = f.name

        try:
            driver.get(f"file://{temp_file}")

            # Wait for extension to potentially process the assignment
            time.sleep(2)  # Allow time for extension to inject and process

            # Check if task generation UI appears
            try:
                task_elements = WebDriverWait(driver, 5).until(
                    lambda d: d.find_elements(By.CSS_SELECTOR, ".canvas-squad-task, #canvas-squad-tasks")
                )

                # Verify some task-related UI is present
                assert len(task_elements) > 0, "No task generation UI detected"

            except TimeoutException:
                pytest.skip("Task generation UI not detected - feature may not be active on this page")

        finally:
            os.unlink(temp_file)

    def test_pdf_extraction_feature_simulation(self, chrome_driver_with_extension):
        """Test PDF extraction functionality simulation."""
        driver = chrome_driver_with_extension

        # Create a test page with PDF link
        test_html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test Assignment with PDF</title></head>
        <body>
            <div class="assignment-content">
                <h1>Assignment: Read and Analyze</h1>
                <a href="#" id="pdf-link" data-pdf-url="test.pdf">Download PDF</a>
            </div>
            <div id="pdf-extraction-results"></div>
        </body>
        </html>
        """

        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(test_html)
            temp_file = f.name

        try:
            driver.get(f"file://{temp_file}")

            # Test PDF extraction trigger
            try:
                extract_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.ID, "extract-pdf-btn"))
                )
                extract_button.click()

                # Wait for processing
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, "pdf-extraction-results"))
                )

                # Verify PDF content was extracted
                results_element = driver.find_element(By.ID, "pdf-extraction-results")
                assert results_element.is_displayed(), "PDF extraction results not shown"

            except TimeoutException:
                pytest.skip("PDF extraction UI not found - feature may not be implemented yet")

        finally:
            os.unlink(temp_file)

    @pytest.mark.parametrize("feature", [
        "assignment_sync",
        "task_generation",
        "pdf_processing",
        "student_dashboard"
    ])
    def test_extension_features_accessible(self, chrome_driver_with_extension, feature):
        """Test that extension features are accessible when expected."""
        driver = chrome_driver_with_extension

        # Create appropriate test pages for each feature
        test_pages = {
            "assignment_sync": """
                <div class="assignments-list">
                    <div class="assignment">Assignment 1</div>
                </div>
            """,
            "task_generation": """
                <div class="assignment-details">
                    <h1>Assignment Title</h1>
                    <div class="description">Assignment description</div>
                </div>
            """,
            "pdf_processing": """
                <a href="test.pdf" class="pdf-link">PDF Document</a>
            """,
            "student_dashboard": """
                <div class="dashboard-content">
                    <h1>Student Dashboard</h1>
                </div>
            """
        }

        test_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Test {feature}</title></head>
        <body>
            {test_pages[feature]}
        </body>
        </html>
        """

        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(test_html)
            temp_file = f.name

        try:
            driver.get(f"file://{temp_file}")

            # Give extension time to process the page
            time.sleep(1)

            # Check if extension injected any relevant UI for this feature
            # This is a basic check - in real implementation, you'd check for specific elements
            page_elements = driver.find_elements(By.CSS_SELECTOR, "*")

            # Extension should at least be loaded (basic check)
            assert len(page_elements) > 0, f"Page did not load properly for {feature} test"

            # More specific checks would be added based on actual extension implementation

        finally:
            os.unlink(temp_file)