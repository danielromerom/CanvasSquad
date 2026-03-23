"""
Tests for Canvas app models
Tests model creation, relationships, and validation
"""
import pytest
from django.db import IntegrityError
from django.contrib.auth.models import User
from canvas.models import StudentProfile, Course, Assignment


@pytest.mark.django_db
class TestStudentProfile:
    """Test StudentProfile model"""
    
    def test_student_profile_creation(self):
        """Test creating a student profile"""
        # Create a user first
        user = User.objects.create_user(
            username='john_doe',
            email='john@example.com',
            password='testpass123'
        )
        
        # Create student profile
        profile = StudentProfile.objects.create(
            user=user,
            canvas_user_id='canvas_123',
            time_zone='America/New_York'
        )
        
        # Assert
        assert profile.user.username == 'john_doe'
        assert profile.canvas_user_id == 'canvas_123'
        assert profile.time_zone == 'America/New_York'
    
    def test_student_profile_string_representation(self):
        """Test that __str__ returns username"""
        user = User.objects.create_user(username='testuser')
        profile = StudentProfile.objects.create(
            user=user,
            canvas_user_id='canvas_456'
        )
        
        assert str(profile) == 'testuser'

@pytest.mark.django_db
class TestStudentProfileUniqueness:
    """Test StudentProfile uniqueness constraints"""
    
    def test_duplicate_user_id(self):
        """Test that canvas_id must be unique"""
        user1 = User.objects.create_user(username='user1')
        user2 = User.objects.create_user(username='user2')

        StudentProfile.objects.create(
            user=user1,
            canvas_user_id='canvas_unique'
        )
        
        # Attempting to create with duplicate canvas_user_id should raise IntegrityError
        with pytest.raises(IntegrityError):
            StudentProfile.objects.create(
                user=user2,
                canvas_user_id='canvas_unique'
            )


@pytest.mark.django_db
class TestCourse:
    """Test Course model"""
    
    def test_course_creation(self):
        """Test creating a course"""
        course = Course.objects.create(
            canvas_course_id='course_101',
            name='Introduction to Python',
            course_code='CS101'
        )
        
        # Assert
        assert course.name == 'Introduction to Python'
        assert course.course_code == 'CS101'
        assert course.students.count() == 0  # No students yet
    
    def test_course_string_representation(self):
        """Test that __str__ returns name and code"""
        course = Course.objects.create(
            canvas_course_id='course_102',
            name='Data Science',
            course_code='DS101'
        )
        
        assert str(course) == 'Data Science (DS101)'
    
    def test_course_students_relationship(self):
        """Test adding students to a course"""
        # Create course and students
        course = Course.objects.create(
            canvas_course_id='course_103',
            name='Web Development'
        )
        
        user1 = User.objects.create_user(username='alice')
        user2 = User.objects.create_user(username='bob')
        
        profile1 = StudentProfile.objects.create(
            user=user1,
            canvas_user_id='canvas_alice'
        )
        profile2 = StudentProfile.objects.create(
            user=user2,
            canvas_user_id='canvas_bob'
        )
        
        # Add students to course
        course.students.add(profile1, profile2)
        
        # Assert
        assert course.students.count() == 2
        assert profile1 in course.students.all()


@pytest.mark.django_db
class TestAssignment:
    """Test Assignment model"""
    
    def test_assignment_creation(self):
        """Test creating an assignment"""
        # Create course first
        course = Course.objects.create(
            canvas_course_id='course_201',
            name='Test Course'
        )
        
        # Create assignment
        assignment = Assignment.objects.create(
            canvas_assignment_id='assign_001',
            course=course,
            title='Quiz 1',
            description='First quiz',
            points_possible=10.0
        )
        
        # Assert
        assert assignment.title == 'Quiz 1'
        assert assignment.course == course
        assert assignment.is_completed == False
        assert assignment.points_possible == 10.0
    
    def test_assignment_string_representation(self):
        """Test that __str__ returns title"""
        course = Course.objects.create(
            canvas_course_id='course_202',
            name='Test Course'
        )
        
        assignment = Assignment.objects.create(
            canvas_assignment_id='assign_002',
            course=course,
            title='Homework 1'
        )
        
        assert str(assignment) == 'Homework 1'

    def test_assignment_complete_status(self):
        """Test setting assignment as completed"""
        course = Course.objects.create(
            canvas_course_id='course_203',
            name='Test Course'
        )
        
        assignment = Assignment.objects.create(
            canvas_assignment_id='assign_003',
            course=course,
            title='Project 1'
        )
        
        # Mark as completed
        assignment.is_completed = True
        assignment.save()
        
        # Refresh from DB and assert
        assignment.refresh_from_db()
        assert assignment.is_completed == True
    
    
    def test_course_assignments_relationship(self):
        """Test that a course can have multiple assignments"""
        course = Course.objects.create(
            canvas_course_id='course_204',
            name='Test Course'
        )

        Assignment.objects.create(
            canvas_assignment_id='assign_004',
            course=course,
            title='Assignment 1'
        )

        Assignment.objects.create(
            canvas_assignment_id='assign_005',
            course=course,
            title='Assignment 2'
        )
        
        assert course.assignments.count() == 2
