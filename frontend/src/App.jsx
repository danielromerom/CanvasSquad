import React, { useState, useEffect } from 'react';
import { Box, Typography, Card } from '@mui/material';
import MainPanel from './components/MainPanel';
import AssignmentPanel from './components/AssignmentPanel';

function App() {
  const [view, setView] = useState('main');

  // checks what page is open
  useEffect(() => {
    const checkContext = () => {
      const url = window.location.href;
      const path = window.location.pathname; 
      const container = document.getElementById('agency-native-widget');

      if (url.includes('/assignments/') && !url.includes('/syllabus')) {
        setView('assignment');
        if (container) container.style.display = 'block';
      } 
      else if (path === '/') {
        setView('main');
        if (container) container.style.display = 'block';
      } 
      else {
        setView('hidden');
        if (container) container.style.display = 'none'; 
      }
    };

    checkContext();
    // check every second in case user navigates without reload
    const intervalId = setInterval(checkContext, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box sx={{ width: '100%', fontFamily: 'Lato, sans-serif', mb: 2 }}>
      
      {/* Header */}
      <Box sx={{ 
        borderBottom: '1px solid rgb(39, 53, 64, 0.1)', 
        pb: 1,
        mt: 2.75,
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          color: 'rgb(39, 53, 64)' 
        }}>
          {/* Dynamic Title */}
          {view === 'main' ? 'Agency Schedule' : 'Task Breakdown'}
        </Typography>
      </Box>

      {/* Dynamic Content Area */}
      <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
        {view === 'main' ? <MainPanel /> : <AssignmentPanel />}
      </Card>

    </Box>
  );
}

export default App;