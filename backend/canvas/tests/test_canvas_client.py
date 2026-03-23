"""
Tests for Canvas API client
Tests Canvas API integration, request handling, and error cases
"""
import pytest
from unittest.mock import patch, MagicMock
from canvas.canvas_client import CanvasClient


class TestCanvasClientInit:
    """Test CanvasClient initialization"""
    
    def test_client_initializes_with_correct_headers(self, mock_canvas_token):
        """Test that client sets up auth header correctly"""
        client = CanvasClient(
            base_url="https://canvas.example.com",
            token=mock_canvas_token
        )
        
        assert client.base_url == "https://canvas.example.com/"
        assert client.session.headers["Authorization"] == f"Bearer {mock_canvas_token}"
    
    def test_base_url_trailing_slash_handling(self):
        """Test that base_url always ends with /"""
        client1 = CanvasClient("https://canvas.example.com", "token")
        assert client1.base_url.endswith("/")
        
        client2 = CanvasClient("https://canvas.example.com/", "token")
        assert client2.base_url == "https://canvas.example.com/"


class TestCanvasClientListCourses:
    """Test list_courses method"""
    
    @patch('canvas.canvas_client.requests.Session.get')
    def test_list_courses_success(self, mock_get, mock_canvas_token):
        """Test successful course listing"""
        # Setup
        client = CanvasClient("https://canvas.example.com", mock_canvas_token)
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {'id': 1, 'name': 'Course 1'},
            {'id': 2, 'name': 'Course 2'},
        ]
        mock_get.return_value = mock_response
        
        # Execute
        result = client.list_courses()
        
        # Assert
        assert len(result) == 2
        assert result[0]['name'] == 'Course 1'
        mock_get.assert_called_once()
    
    @patch('canvas.canvas_client.requests.Session.get')
    def test_list_courses_api_error(self, mock_get, mock_canvas_token):
        """Test error handling when Canvas API fails"""
        # Setup
        client = CanvasClient("https://canvas.example.com", mock_canvas_token)
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("API Error")
        mock_get.return_value = mock_response
        
        # Execute & Assert
        with pytest.raises(Exception, match="API Error"):
            client.list_courses()


class TestCanvasClientListAssignments:
    """Test list_assignments method"""
    
    @patch('canvas.canvas_client.requests.Session.get')
    def test_list_assignments_success(self, mock_get, mock_canvas_token, sample_assignment_data):
        """Test successful assignment listing"""
        # Setup
        client = CanvasClient("https://canvas.example.com", mock_canvas_token)
        mock_response = MagicMock()
        mock_response.json.return_value = [sample_assignment_data]
        mock_get.return_value = mock_response
        
        # Execute
        result = client.list_assignments(course_id=1)
        
        # Assert
        assert len(result) == 1
        assert result[0]['id'] == 101
        assert result[0]['name'] == 'Assignment 1'
    
    @patch('canvas.canvas_client.requests.Session.get')
    def test_list_assignments_includes_pagination(self, mock_get, mock_canvas_token):
        """Test that pagination parameter is included"""
        # Setup
        client = CanvasClient("https://canvas.example.com", mock_canvas_token)
        mock_response = MagicMock()
        mock_response.json.return_value = []
        mock_get.return_value = mock_response
        
        # Execute
        client.list_assignments(course_id=1)
        
        # Assert - check that per_page param was sent
        call_args = mock_get.call_args
        assert call_args[1]['params']['per_page'] == 100


class TestCanvasClientGetAssignment:
    """Test get_assignment method"""
    
    @patch('canvas.canvas_client.requests.Session.get')
    def test_get_assignment_success(self, mock_get, mock_canvas_token, sample_assignment_data):
        """Test retrieving single assignment"""
        # Setup
        client = CanvasClient("https://canvas.example.com", mock_canvas_token)
        mock_response = MagicMock()
        mock_response.json.return_value = sample_assignment_data
        mock_get.return_value = mock_response
        
        # Execute
        result = client.get_assignment(course_id=1, assignment_id=101)
        
        # Assert
        assert result['id'] == 101
        assert result['name'] == 'Assignment 1'
