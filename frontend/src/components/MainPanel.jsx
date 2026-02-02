import { Box, Typography, Paper } from '@mui/material';

export default function MainPanel() {
  return (
    <Box sx={{ p: 2, height: '100%', bgcolor: '#f5f5f5' }}>
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderLeft: '4px solid #4f46e5' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
          Weekly Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary">
          [Main Panel] <br/>
          Drag-and-Drop Calendar will go here.
        </Typography>
      </Paper>
    </Box>
  );
}