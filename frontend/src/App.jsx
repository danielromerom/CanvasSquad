import React from 'react';
import { Card, Box, Typography, Button, List, ListItem, ListItemText, Checkbox, IconButton } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

function App() {
  return (
    <Box sx={{ width: '100%', fontFamily: 'Lato, sans-serif' }}>
      
      <Box sx={{ 
        borderBottom: '1px solid #C7CDD1', 
        pb: 1, 
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          color: '#2D3B45' 
        }}>
          Widged Injected
        </Typography>
      </Box>

      <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
        <List dense disablePadding>
          {[1, 2, 3].map((item) => (
            <ListItem key={item} sx={{ 
              pl: 0, 
              pr: 0,
              alignItems: 'flex-start',
              borderBottom: '1px solid #F5F5F5' 
            }}>
              <Checkbox 
                size="small" 
                sx={{ p: 0, mt: 0.5, mr: 1, color: '#2D3B45' }} 
              />
              <ListItemText 
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3B45' }}>
                    Basic stuff testing extension {item}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#D12F19' }}>
                    Due Tomorrow at 11:59pm
                  </Typography>
                } 
              />
            </ListItem>
          ))}
        </List>

        {/* 3. Action Button */}
        <Box sx={{ mt: 2 }}>
          <Button 
            fullWidth 
            variant="contained" 
            disableElevation
            sx={{ 
              bgcolor: '#008EE2', 
              textTransform: 'none', 
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#0074B8' }
            }}
          >
            Button from MUI
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

export default App;