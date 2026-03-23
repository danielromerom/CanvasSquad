"""
Tests for Canvas services layer
Tests: task generation, Canvas sync, PDF processing
"""
import pytest
from unittest.mock import patch, MagicMock, Mock
from django.utils import timezone
from django.contrib.auth.models import User

from canvas.models import Course, Assignment, StudentProfile
from canvas.services.canvas_sync_services import sync_assignments
from canvas.services.llm_service import generate_task_suggestions


# ============================================================================
# EXAMPLE 1: Testing Canvas Sync Service
# ============================================================================

@pytest.mark.django_db
class TestCanvasSyncService:
    """Test the Canvas sync service"""
    
    def test_sync_assignments_creates_course(self):
        """Test that sync_assignments creates a course"""
        # Setup
        raw_assignments = [
            {
                'id': 1,
                'name': 'Assignment 1',
                'description': 'Test assignment',
                'due_at': '2025-04-01T23:59:00Z',
                'points_possible': 10.0,
                'published': True
            }
        ]
        
        # Execute
        result = sync_assignments(
            course_canvas_id='canvas_course_1',
            course_name='Python Basics',
            raw_assignments=raw_assignments
        )
        
        # Assert: Check that course was created
        course = Course.objects.get(canvas_course_id='canvas_course_1')
        assert course.name == 'Python Basics'
        assert course.assignments.count() == 1
    
    def test_sync_assignments_creates_assignment(self):
        """Test that sync_assignments creates assignment"""
        # Setup
        raw_assignments = [
            {
                'id': 101,
                'name': 'Homework 1',
                'description': 'Complete exercises',
                'due_at': '2025-04-05T23:59:00Z',
                'points_possible': 20.0,
                'published': True
            }
        ]
        
        # Execute
        result = sync_assignments(
            course_canvas_id='course_100',
            course_name='Data Science 101',
            raw_assignments=raw_assignments
        )
        
        # Assert: Check assignment details
        assignment = Assignment.objects.get(canvas_assignment_id='101')
        assert assignment.title == 'Homework 1'
        assert assignment.points_possible == 20.0
        assert assignment.description == 'Complete exercises'
    
    def test_sync_assignments_skips_unpublished(self):
        """Test that unpublished assignments are skipped"""
        # Setup
        raw_assignments = [
            {
                'id': 1,
                'name': 'Published',
                'description': '',
                'due_at': None,
                'points_possible': 10.0,
                'published': True
            },
            {
                'id': 2,
                'name': 'Draft',
                'description': '',
                'due_at': None,
                'points_possible': 10.0,
                'published': False  # This should NOT be synced
            }
        ]
        
        # Execute
        result = sync_assignments(
            course_canvas_id='course_101',
            course_name='Test Course',
            raw_assignments=raw_assignments
        )
        
        # Assert: Only published assignment should exist
        course = Course.objects.get(canvas_course_id='course_101')
        assert course.assignments.count() == 1


# ============================================================================
# EXAMPLE 2: Testing LLM Service with Mocked API
# ============================================================================

class TestLLMService:
    """Test the LLM task generation service"""
    
    @patch('canvas.services.llm_service.client')
    def test_generate_task_suggestions_calls_api(self, mock_client):
        """Test that generate_task_suggestions calls OpenAI API"""
        # Setup: Mock the API response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''{
            "assignments": [
                {
                    "id": 1,
                    "title": "Essay",
                    "priority": "High",
                    "tasks": [
                        {
                            "label": "Read 5 sources",
                            "estimated_time_hours": 1.0,
                            "ai_insight": "Focus on recent publications"
                        }
                    ]
                }
            ]
        }'''
        mock_client.chat.completions.create.return_value = mock_response
        
        # Setup: Create test assignments
        assignments = [
            {
                'title': 'Essay on Climate Change',
                'due_at': '2025-04-10',
                'points': 50,
                'description': 'Write a 5-page essay'
            }
        ]
        
        # Execute
        result = generate_task_suggestions(assignments)
        
        # Assert: API was called
        mock_client.chat.completions.create.assert_called_once()
    
    # TODO: Write a test that:
    # 1. Mocks the OpenAI API response
    # 2. Calls generate_task_suggestions with 2 assignments
    # 3. Verifies the response contains tasks for both assignments
    # Name it: test_generate_task_suggestions_multiple_assignments
    # Hint: Follow the pattern above with mock_response
    
    # TODO: Write a test that:
    # 1. Tests error handling when API returns invalid JSON
    # 2. Should catch or handle the error gracefully
    # Name it: test_generate_task_suggestions_invalid_json
    # Hint: Use pytest.raises(JSONDecodeError) or similar


# ============================================================================
# EXAMPLE 3: Integration Test (Sync + LLM)
# ============================================================================

@pytest.mark.django_db
class TestCanvasAssignmentWorkflow:
    """Test full workflow: Canvas sync → LLM task generation"""
    
    @patch('canvas.services.llm_service.client')
    def test_full_workflow_sync_and_generate_tasks(self, mock_client):
        """Test complete workflow from Canvas sync to task generation"""
        # Setup
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''{
            "assignments": [
                {
                    "title": "Quiz",
                    "priority": "High",
                    "tasks": []
                }
            ]
        }'''
        mock_client.chat.completions.create.return_value = mock_response
        
        # Step 1: Sync assignments from Canvas
        raw_assignments = [
            {
                'id': 201,
                'name': 'Quiz 1',
                'description': 'Chapter 1-3',
                'due_at': '2025-04-02T23:59:00Z',
                'points_possible': 15.0,
                'published': True
            }
        ]
        
        normalized = sync_assignments(
            course_canvas_id='course_200',
            course_name='Biology 101',
            raw_assignments=raw_assignments
        )
        
        # Assert: Assignments synced
        assert len(normalized) == 1
        assert normalized[0]['title'] == 'Quiz 1'
        
        # Step 2: Generate tasks from synced assignments
        result = generate_task_suggestions(normalized)
        
        # Assert: Tasks were "generated"
        assert result is not None


# ============================================================================
# TESTS YOU SHOULD ADD
# ============================================================================

@pytest.mark.django_db
class TestCanvasSyncServiceAdditional:
    """Additional tests for Canvas sync service"""
    
    def test_sync_assignments_stores_pdf_text(self):
        """Test that sync_assignments stores PDF text when provided"""
        # Setup
        raw_assignments = [
            {
                'id': 101,
                'name': 'Assignment with PDF',
                'description': '',
                'due_at': None,
                'points_possible': 10.0,
                'published': True
            }
        ]
        pdf_text_map = {101: "PDF content here"}
        
        # Execute
        sync_assignments(
            course_canvas_id='course_102',
            course_name='Test Course',
            raw_assignments=raw_assignments,
            pdf_text_map=pdf_text_map
        )
        
        # Assert: Check that PDF text is stored on the assignment
        assignment = Assignment.objects.get(canvas_assignment_id='101')
        assert assignment.document_text == "PDF content here"
    
    def test_sync_assignments_empty_list(self):
        """Test that sync_assignments handles empty assignments list"""
        # Execute
        result = sync_assignments(
            course_canvas_id='course_103',
            course_name='Empty Course',
            raw_assignments=[]  # No assignments
        )
        
        # Assert: Course should be created but no assignments
        course = Course.objects.get(canvas_course_id='course_103')
        assert course.name == 'Empty Course'
        assert course.assignments.count() == 0

    def test_sync_assignments_updates_existing(self):
        """Test that sync_assignments updates existing assignments instead of creating duplicates"""
        # Setup: Create initial assignment
        raw_assignments = [
            {
                'id': 102,
                'name': 'Initial Assignment',
                'description': '',
                'due_at': '2025-04-01T23:59:00Z',
                'points_possible': 10.0,
                'published': True
            }
        ]
        
        sync_assignments(
            course_canvas_id='course_104',
            course_name='Update Test Course',
            raw_assignments=raw_assignments
        )
        
        # Assert: One assignment should exist
        assert Assignment.objects.filter(canvas_assignment_id='102').count() == 1
        
        # Step 2: Call sync_assignments with updated data for the same assignment
        updated_raw_assignments = [
            {
                'id': 102,  # Same ID to indicate update
                'name': 'Updated Assignment Name',
                'description': 'Updated description',
                'due_at': '2025-04-05T23:59:00Z',
                'points_possible': 15.0,
                'published': True
            }
        ]
        
        sync_assignments(
            course_canvas_id='course_104',
            course_name='Update Test Course',
            raw_assignments=updated_raw_assignments
        )
        
        # Assert: Still only one assignment, but details should be updated
        assert Assignment.objects.filter(canvas_assignment_id='102').count() == 1
        assignment = Assignment.objects.get(canvas_assignment_id='102')
        assert assignment.title == 'Updated Assignment Name'
        assert assignment.description == 'Updated description'
        assert assignment.points_possible == 15.0
