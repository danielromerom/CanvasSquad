import { Box, Typography, Chip, Card, CardContent } from '@mui/material';

export default function AssignmentPanel() {
  return (
    <Box sx={{ p: 2, height: '100%', bgcolor: '#fff' }}>
      <Box sx={{ mb: 2 }}>
         <Chip label="AI Breakdown" color="secondary" size="small" sx={{ mb: 1 }} />
         <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
           Assignment Tasks
         </Typography>
      </Box>
      
      <Card variant="outlined" sx={{ mb: 1, borderColor: '#e0e0e0' }}>
        <CardContent sx={{ p: '12px !important' }}>
           <Typography variant="body2">1. Read Chapter 4</Typography>
           <Typography variant="caption" color="text.secondary">Est: 30m</Typography>
        </CardContent>
      </Card>
      
      <Card variant="outlined" sx={{ mb: 1, borderColor: '#e0e0e0' }}>
        <CardContent sx={{ p: '12px !important' }}>
           <Typography variant="body2">2. Answer Quiz Questions</Typography>
           <Typography variant="caption" color="text.secondary">Est: 45m</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}