#!/bin/bash
# Canvas Squad Functional Test Runner
# This script helps run functional tests with proper environment setup

echo "🧪 Canvas Squad Functional Test Runner"
echo "====================================="

# Check if extension is built
if [ ! -d "frontend/dist" ]; then
    echo "❌ Extension not built. Run 'npm run build' in frontend/ directory first."
    exit 1
fi

echo "✅ Extension is built"

# Check for credentials
if [ -z "$CANVAS_TEST_USERNAME" ] || [ -z "$CANVAS_TEST_PASSWORD" ]; then
    echo "⚠️  Canvas credentials not set. Authenticated tests will be skipped."
    echo "   To enable authenticated tests, set:"
    echo "   export CANVAS_TEST_USERNAME='your-username@ufl.edu'"
    echo "   export CANVAS_TEST_PASSWORD='your-password'"
    echo "   export CANVAS_TEST_COURSE_URL='https://ufldev.instructure.com/courses/YOUR_COURSE_ID'"
    echo ""
fi

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source .venv/bin/activate

# Run tests
echo "🚀 Running functional tests..."
if [ "$1" = "auth" ]; then
    echo "Running authenticated Canvas test..."
    pytest backend/canvas/tests/test_functional.py::TestCanvasSquadExtension::test_extension_with_canvas_authentication -v -s
elif [ "$1" = "real" ]; then
    echo "Running real Canvas access test..."
    pytest backend/canvas/tests/test_functional.py::TestCanvasSquadExtension::test_extension_on_real_canvas_page -v -s
else
    echo "Running all functional tests..."
    pytest backend/canvas/tests/test_functional.py -v -s --tb=short
fi

echo "✅ Test run complete!"