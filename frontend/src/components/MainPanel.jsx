import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Calendar, Timer, BarChart3 } from 'lucide-react';
import TabSwitcher from './TabSwitcher';

export default function MainPanel() {
  const [currentTab, setCurrentTab] = useState('schedule');
  
  return (
    <Box sx={{ pt: 1, pb: 2, pl: 1.5, pr: 1.5, maxWidth: '640px', mx: 'auto' }}>
      
      {/* Header*/}
      <div 
        className="p-6 mb-6 shadow-lg"
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3a6ed1 100%)',
          width: '100%',
        }}
      >
        <div className="flex flex-col text-white">
          <p className="text-[11px] opacity-90 mb-2 uppercase tracking-[0.2em] font-semibold">
            AGENCY SCHEDULE
          </p>
          <h2 className="text-[28px] font-bold mb-2 leading-[1.15]">
            Weekly Calendar
          </h2>
          <div className="flex items-center text-[14px] opacity-80 font-medium">
            <span>Manage your upcoming tasks</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 px-2">
        <TabSwitcher 
          variant="main" 
          activeTab={currentTab} 
          onTabChange={setCurrentTab} 
        />
      </div>

      {/* content */}

      {/* 1. SCHEDULE TAB */}
      {currentTab === 'schedule' && (
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="bg-indigo-50 p-4 rounded-full">
              <Calendar className="size-8 text-indigo-500" />
            </div>
            
            <div>
              <Typography variant="h6" className="text-gray-900 font-bold mb-1">
                Calendar View
              </Typography>
              <Typography variant="body2" className="text-gray-500 max-w-xs mx-auto">
                [Main Panel] <br/>
                Drag-and-Drop functionality will go here.
              </Typography>
            </div>

            <button className="mt-4 px-6 py-2 bg-[#ececf0] hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors">
              Add New Event
            </button>
          </div>
        </div>
      )}

      {/* 2. TIMER TAB */}
      {currentTab === 'timer' && (
        <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl mt-4 bg-white">
          <Timer className="mx-auto size-10 text-gray-300 mb-2" />
          <Typography className="text-gray-400 font-medium">Focus Timer Coming Soon</Typography>
          <Typography className="text-gray-300 text-sm">Track your deep work sessions</Typography>
        </div>
      )}

      {/* 3. STATS TAB */}
      {currentTab === 'stats' && (
        <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl mt-4 bg-white">
          <BarChart3 className="mx-auto size-10 text-gray-300 mb-2" />
          <Typography className="text-gray-400 font-medium">Stats Coming Soon</Typography>
          <Typography className="text-gray-300 text-sm">Weekly productivity insights</Typography>
        </div>
      )}
    </Box>
  );
}