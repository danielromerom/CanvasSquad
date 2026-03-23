"""
pytest configuration and fixtures for CanvasSquad tests
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.contrib.auth.models import User


@pytest.fixture
def test_user(db):
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def mock_canvas_client():
    """Mock the Canvas API client"""
    with patch('canvas.canvas_client.CanvasClient') as mock:
        instance = MagicMock()
        mock.return_value = instance
        yield instance


@pytest.fixture
def mock_canvas_token():
    """Mock Canvas token"""
    return 'test_token_123abc'


@pytest.fixture
def sample_course_data():
    """Sample Canvas course data"""
    return {
        'id': 1,
        'name': 'Test Course',
        'course_code': 'CS101',
        'enrollment_term_id': 1
    }


@pytest.fixture
def sample_assignment_data():
    """Sample Canvas assignment data"""
    return {
        'id': 101,
        'name': 'Assignment 1',
        'description': 'Test assignment',
        'due_at': '2025-04-01T23:59:00Z',
        'html_url': 'https://canvas.example.com/courses/1/assignments/101'
    }
