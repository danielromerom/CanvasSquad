import React, { useState, useEffect } from 'react';
import { Box, Typography, Card } from '@mui/material';
import MainPanel from './components/MainPanel';
import AssignmentPanel from './components/AssignmentPanel';

function App() {
  const [view, setView] = useState('main');
  const [courseId, setCourseId] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);

  useEffect(() => {
    const checkContext = () => {
      const path = window.location.pathname; 
      
      // 1. Specific Assignment Detail View (/courses/###/assignments/###)
      // The (\d+)$ at the end ensures we match only when the URL ends with an ID
      const assignDetailMatch = path.match(/\/courses\/(\d+)\/assignments\/(\d+)\/?$/);
      
      // 2. Course Assignments List View (/courses/###/assignments)
      // This matches only if the URL ends exactly with "assignments" (ignoring trailing slash)
      const assignListMatch = path.match(/\/courses\/(\d+)\/assignments\/?$/);

      if (assignDetailMatch && !path.includes('/syllabus')) {
        setView('assignment');
        setCourseId(assignDetailMatch[1]);
        setAssignmentId(assignDetailMatch[2]);
      } 
      else if (assignListMatch) {
        setView('courseAssignments');
        setCourseId(assignListMatch[1]);
        setAssignmentId(null);
      }
      else if (path.match(/\/courses\/\d+/)) {
        const courseMatch = path.match(/\/courses\/(\d+)/);
        setCourseId(courseMatch[1]);
        setView('course');
      } 
      else if (path === '/' || path === '/dashboard') {
        setView('main');
        setCourseId(null);
      } 
      else {
        setView('hidden');
      }
    };

    checkContext();
    const intervalId = setInterval(checkContext, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box sx={{ width: '100%', fontFamily: 'Lato, sans-serif', mb: 2 }}>
      <Box sx={{ 
        borderBottom: '1px solid rgb(39, 53, 64, 0.1)', 
        pb: 1, mt: 2.75, mb: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(39, 53, 64)' }}>
          {(view === 'assignment' || view === 'courseAssignments') ? 'Task Breakdown' : 'Agency Schedule'}
        </Typography>
      </Box>

      <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
        {/* Only pass showDropdown=true if we are in the 'courseAssignments' view */}
        {(view === 'assignment' || view === 'courseAssignments') ? (
          <AssignmentPanel 
            courseId={courseId} 
            initialAssignmentId={assignmentId} 
            showDropdown={view === 'courseAssignments'} 
          />
        ) : (
          <MainPanel filteredCourseId={courseId} />
        )}
      </Card>
    </Box>
  );
}

export default App;