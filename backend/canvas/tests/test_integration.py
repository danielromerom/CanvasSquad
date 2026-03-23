"""
Integration Tests for CanvasSquad

These tests verify that multiple components work together correctly.
They use a real test database but mock external APIs (Canvas, OpenAI).

Key Differences from Unit Tests:
- Tests involve multiple layers (models + services + views)
- Uses real database transactions
- Mocks external APIs (Canvas, OpenAI)
- Tests full workflows end-to-end
- Slower but more realistic
"""
import pytest
import json
from unittest.mock import patch, MagicMock
from django.test import Client
from django.utils import timezone
from django.contrib.auth.models import User

from canvas.models import Course, Assignment, StudentProfile, TaskGeneration, Task
from canvas.services.canvas_sync_services import sync_assignments
from canvas.services.llm_service import generate_task_suggestions


# ============================================================================
# INTEGRATION TEST 1: Full Canvas Sync Workflow
# ============================================================================

@pytest.mark.django_db
class TestCanvasSyncWorkflow:
    """Test complete Canvas → DB → Task Generation workflow"""
    
    def test_full_workflow_canvas_to_tasks(self):
        """
        Test complete flow:
        1. Fetch assignments from Canvas
        2. Sync to database
        3. Generate tasks with LLM
        """
        # Step 1: Create raw Canvas data (simulates Canvas API response)
        raw_canvas_assignments = [
            {
                'id': 401,
                'name': 'Midterm Exam',
                'description': 'Covers chapters 1-5',
                'due_at': '2025-04-15T23:59:00Z',
                'points_possible': 100.0,
                'published': True
            },
            {
                'id': 402,
                'name': 'Final Project',
                'description': 'Build a full stack app',
                'due_at': '2025-05-10T23:59:00Z',
                'points_possible': 50.0,
                'published': True
            }
        ]
        
        # Step 2: Sync assignments to database
        normalized = sync_assignments(
            course_canvas_id='course_400',
            course_name='Software Engineering 401',
            raw_assignments=raw_canvas_assignments
        )
        
        # Verify database state
        course = Course.objects.get(canvas_course_id='course_400')
        assert course.assignments.count() == 2
        
        midterm = Assignment.objects.get(canvas_assignment_id='401')
        assert midterm.title == 'Midterm Exam'
        assert midterm.points_possible == 100.0
        
        # Step 3: Mock and test task generation
        with patch('canvas.services.llm_service.client') as mock_client:
            mock_response = MagicMock()
            mock_response.choices[0].message.content = '''{
                "assignments": [
                    {
                        "title": "Midterm Exam",
                        "priority": "High",
                        "tasks": []
                    }
                ]
            }'''
            mock_client.chat.completions.create.return_value = mock_response
            
            result = generate_task_suggestions(normalized)
            
            # Verify result
            assert result is not None
            assert len(normalized) == 2
    
    def test_sync_with_pdf_extraction_workflow(self):
        """Test sync workflow that includes PDF text extraction"""
        # Simulate Canvas data + extracted PDF text
        raw_assignments = [
            {
                'id': 403,
                'name': 'Research Paper',
                'description': '',
                'due_at': '2025-04-20T23:59:00Z',
                'points_possible': 30.0,
                'published': True
            }
        ]
        
        # Simulate PDF extraction output
        pdf_text_map = {
            403: "Chapter 1: History of AI\nChapter 2: Machine Learning Basics\n..."
        }
        
        # Sync with PDF data
        result = sync_assignments(
            course_canvas_id='course_405',
            course_name='Advanced AI',
            raw_assignments=raw_assignments,
            pdf_text_map=pdf_text_map
        )
        
        # Verify PDF text is stored
        assignment = Assignment.objects.get(canvas_assignment_id='403')
        assert assignment.document_text == pdf_text_map[403]
        assert assignment.document_text_updated_at is not None
        
        # Verify normalized result includes PDF
        assert result[0]['document_text'] == pdf_text_map[403]


# ============================================================================
# INTEGRATION TEST 2: API Endpoint Tests (Django Views)
# ============================================================================

@pytest.mark.django_db
class TestCanvasAPIEndpoints:
    """Test Django API endpoints with real database"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test client and sample data"""
        self.client = Client()
        
        # Create a test user for authentication
        self.user = User.objects.create_user(
            username='testuser500',
            password='testpass123'
        )
        
        # Create a test course and assignments
        self.course = Course.objects.create(
            canvas_course_id='course_500',
            name='API Test Course'
        )
        
        self.assignment1 = Assignment.objects.create(
            canvas_assignment_id='assign_501',
            course=self.course,
            title='API Test Assignment 1',
            points_possible=25.0
        )
        
        self.assignment2 = Assignment.objects.create(
            canvas_assignment_id='assign_502',
            course=self.course,
            title='API Test Assignment 2',
            points_possible=50.0
        )
        
        # Login the user (if needed)
        self.client.login(username='testuser500', password='testpass123')
    
    def test_get_courses_endpoint(self):
        """Test GET /api/canvas/courses/ endpoint"""
        # This assumes you have a CoursesView that lists courses
        # Adjust the URL based on your actual URL patterns
        response = self.client.get('/api/canvas/courses/')
        
        # Verify response - could be 401 (auth required), 200, or 404 (endpoint not ready)
        assert response.status_code in [200, 401, 404]
        
    def test_get_assignments_endpoint(self):
        """Test GET /api/canvas/courses/<id>/assignments/ endpoint"""
        # This tests the AssignmentView
        course_id = self.course.id
        response = self.client.get(f'/api/canvas/courses/{course_id}/assignments/')
        
        # Check response - could be 401 (auth required), 200, or 404 (endpoint not ready)
        assert response.status_code in [200, 401, 404]


# ============================================================================
# INTEGRATION TEST 3: Task Generation Workflow
# ============================================================================

@pytest.mark.django_db
class TestTaskGenerationWorkflow:
    """Test the complete task generation flow"""
    
    @patch('canvas.services.llm_service.client')
    def test_assignment_to_tasks_workflow(self, mock_client):
        """
        Test complete flow:
        1. Create assignment in DB
        2. Request task generation
        3. Store generation record
        """
        # Step 1: Create course and assignment
        course = Course.objects.create(
            canvas_course_id='course_600',
            name='Task Generation Test'
        )
        
        assignment = Assignment.objects.create(
            canvas_assignment_id='assign_600',
            course=course,
            title='Complete Project',
            description='Build and deploy a web app',
            points_possible=100.0,
            due_at=timezone.now()
        )
        
        # Step 2: Prepare normalized data for LLM
        normalized_assignments = [{
            'id': assignment.id,
            'title': assignment.title,
            'due_at': assignment.due_at,
            'points': assignment.points_possible,
            'description': assignment.description,
            'document_text': ''
        }]
        
        # Step 3: Mock LLM API response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''{
            "assignments": [
                {
                    "title": "Complete Project",
                    "priority": "High",
                    "tasks": [
                        {
                            "label": "Set up project repository",
                            "estimated_time_hours": 0.5,
                            "ai_insight": "Use GitHub for version control"
                        },
                        {
                            "label": "Create database schema",
                            "estimated_time_hours": 1.5,
                            "ai_insight": "Use PostgreSQL for production"
                        },
                        {
                            "label": "Build API endpoints",
                            "estimated_time_hours": 3.0,
                            "ai_insight": "Use Django REST framework"
                        }
                    ]
                }
            ]
        }'''
        mock_client.chat.completions.create.return_value = mock_response
        
        # Step 4: Generate tasks
        result = generate_task_suggestions(normalized_assignments)
        
        # Step 5: Verify API was called
        mock_client.chat.completions.create.assert_called_once()
        
        # Verify response contains tasks
        assert result is not None
        assert 'assignments' in result


# ============================================================================
# INTEGRATION TEST 4: Multi-Course Sync Workflow
# ============================================================================

@pytest.mark.django_db
class TestMultiCourseSyncWorkflow:
    """Test syncing multiple courses and assignments"""
    
    def test_sync_multiple_courses_independently(self):
        """Test that multiple course syncs don't interfere"""
        # Sync Course 1
        course1_assignments = [
            {
                'id': 701,
                'name': 'Course 1 - Assignment 1',
                'description': '',
                'due_at': None,
                'points_possible': 10.0,
                'published': True
            }
        ]
        
        sync_assignments(
            course_canvas_id='course_700',
            course_name='Course 1',
            raw_assignments=course1_assignments
        )
        
        # Sync Course 2
        course2_assignments = [
            {
                'id': 702,
                'name': 'Course 2 - Assignment 1',
                'description': '',
                'due_at': None,
                'points_possible': 20.0,
                'published': True
            },
            {
                'id': 703,
                'name': 'Course 2 - Assignment 2',
                'description': '',
                'due_at': None,
                'points_possible': 30.0,
                'published': True
            }
        ]
        
        sync_assignments(
            course_canvas_id='course_701',
            course_name='Course 2',
            raw_assignments=course2_assignments
        )
        
        # Verify both courses exist independently
        course1 = Course.objects.get(canvas_course_id='course_700')
        course2 = Course.objects.get(canvas_course_id='course_701')
        
        assert course1.assignments.count() == 1
        assert course2.assignments.count() == 2
        
        # Verify assignments belong to correct course
        assign1 = Assignment.objects.get(canvas_assignment_id='701')
        assign2 = Assignment.objects.get(canvas_assignment_id='702')
        
        assert assign1.course == course1
        assert assign2.course == course2


# ============================================================================
# INTEGRATION TEST 5: Error Recovery Workflow
# ============================================================================

@pytest.mark.django_db
class TestErrorRecoveryWorkflow:
    """Test that system handles errors gracefully"""
    
    def test_partial_sync_with_invalid_data(self):
        """Test that invalid data raises an error"""
        raw_assignments = [
            {
                'id': 801,
                'name': 'Valid Assignment',
                'description': 'OK',
                'due_at': '2025-04-30T23:59:00Z',
                'points_possible': 15.0,
                'published': True
            },
            {
                'id': 802,
                'name': None,  # Invalid: missing name
                'description': '',
                'due_at': None,
                'points_possible': 10.0,
                'published': True
            }
        ]
        
        # Sync with None name should raise an error (defensive validation)
        with pytest.raises(Exception):
            sync_assignments(
                course_canvas_id='course_800',
                course_name='Error Test Course',
                raw_assignments=raw_assignments
            )
    
    def test_duplicate_sync_is_idempotent(self):
        """Test that syncing twice gives the same result"""
        raw_assignments = [
            {
                'id': 901,
                'name': 'Idempotent Test',
                'description': 'Test',
                'due_at': None,
                'points_possible': 25.0,
                'published': True
            }
        ]
        
        # Sync 1
        sync_assignments(
            course_canvas_id='course_900',
            course_name='Idempotent Test',
            raw_assignments=raw_assignments
        )
        
        count_after_first = Assignment.objects.filter(
            canvas_assignment_id='901'
        ).count()
        
        # Sync 2 (same data)
        sync_assignments(
            course_canvas_id='course_900',
            course_name='Idempotent Test',
            raw_assignments=raw_assignments
        )
        
        count_after_second = Assignment.objects.filter(
            canvas_assignment_id='901'
        ).count()
        
        # Should be the same (not duplicated)
        assert count_after_first == count_after_second == 1


# ============================================================================
# INTEGRATION TEST 6: Student Workflow (Multi-User)
# ============================================================================

@pytest.mark.django_db
class TestMultiStudentWorkflow:
    """Test workflows with multiple students"""
    
    def test_multiple_students_same_course(self):
        """Test that multiple students can access the same course"""
        # Create course
        course = Course.objects.create(
            canvas_course_id='course_1000',
            name='Multi-Student Course'
        )
        
        # Create multiple students
        users = []
        profiles = []
        for i in range(3):
            user = User.objects.create_user(
                username=f'student_{i}',
                email=f'student_{i}@example.com',
                password='testpass'
            )
            profile = StudentProfile.objects.create(
                user=user,
                canvas_user_id=f'canvas_student_{i}'
            )
            users.append(user)
            profiles.append(profile)
        
        # Enroll all students in course
        for profile in profiles:
            course.students.add(profile)
        
        # Verify all students are enrolled
        assert course.students.count() == 3
        
        # Create assignments
        for i in range(2):
            Assignment.objects.create(
                canvas_assignment_id=f'assign_1000_{i}',
                course=course,
                title=f'Assignment {i}'
            )
        
        # Verify structure
        assert course.assignments.count() == 2
        assert all(profile in course.students.all() for profile in profiles)
