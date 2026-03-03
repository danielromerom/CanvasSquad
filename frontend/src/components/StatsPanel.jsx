import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Sparkles, Timer, CheckCircle2, Flame, BookOpen, Coffee } from 'lucide-react';

export default function StatsPanel() {
  
  function loadStats() {
    const savedStats = JSON.parse(localStorage.getItem('userStats')) || {};
    return {
      totalFocusMinutes: savedStats.totalFocusMinutes || 0,
      totalTasksCompleted: savedStats.totalTasksCompleted || 0,
      currentStreak: savedStats.currentStreak || 0,
      assignmentsCompleted: savedStats.assignmentsCompleted || 0,
      totalSessions: savedStats.totalSessions || 0,
      xp: savedStats.xp || 0
    };
  }

  const [stats, setStats] = useState(() => loadStats());

  useEffect(() => {
    const handleStorageChange = () => {
      setStats(loadStats());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('statsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('statsUpdated', handleStorageChange);
    };
  }, []);

  // Gamification 
  const XP_PER_LEVEL = 1500;
  const currentLevel = Math.floor(stats.xp / XP_PER_LEVEL) + 1;
  const currentLevelXP = stats.xp % XP_PER_LEVEL;
  const progressPercentage = (currentLevelXP / XP_PER_LEVEL) * 100;

  // Rank based on level
  const getRankTitle = (level) => {
    if (level < 5) return "Novice Planner";
    if (level < 10) return "Task Master";
    if (level < 20) return "Productivity Wizard";
    return "Time Lord";
  };

  return (
    <Box sx={{ pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Top box */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', 
        borderRadius: '20px', 
        p: 3, 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)'
      }}>
        {/* Yellow Sparkle Icon */}
        <Box sx={{ 
          bgcolor: '#eab308', 
          p: 2, 
          borderRadius: '16px', 
          mb: 2,
          boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
        }}>
          <Sparkles size={32} color="white" />
        </Box>

        <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
          {getRankTitle(currentLevel)}
        </Typography>
        <Typography variant="body2" sx={{ color: '#ddd6fe', mb: 3, fontWeight: 500 }}>
          Level {currentLevel} • Top {Math.max(1, 100 - (currentLevel * 2))}%
        </Typography>

        {/* XP */}
        <Box sx={{ width: '100%', mb: 1 }}>
          <Box sx={{ width: '100%', height: '8px', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
            <Box sx={{ width: `${progressPercentage}%`, height: '100%', bgcolor: '#eab308', transition: 'width 0.5s ease-out' }} />
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: '#ddd6fe', fontWeight: 500 }}>
          {currentLevelXP} / {XP_PER_LEVEL} XP to next level
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
        
        {/* Focus Time */}
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <Box sx={{ bgcolor: '#eff6ff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            <Timer size={16} color="#3b82f6" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>
            {stats.totalFocusMinutes >= 60 
              ? `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m` 
              : `${stats.totalFocusMinutes}m`}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Focus Time</Typography>
        </Box>

        {/* Sessions */}
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <Box sx={{ bgcolor: '#fff1f2', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            <Coffee size={16} color="#f43f5e" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>{stats.totalSessions}</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Sessions</Typography>
        </Box>

        {/* Tasks */}
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <Box sx={{ bgcolor: '#ecfdf5', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            <CheckCircle2 size={16} color="#10b981" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>{stats.totalTasksCompleted}</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Tasks Done</Typography>
        </Box>

        {/* Streak */}
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <Box sx={{ bgcolor: '#fff7ed', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            <Flame size={16} color="#f97316" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>{stats.currentStreak}</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Day Streak</Typography>
        </Box>

        {/* Assignments */}
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <Box sx={{ bgcolor: '#f5f3ff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            <BookOpen size={16} color="#8b5cf6" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827', mb: 0.5 }}>{stats.assignmentsCompleted}</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Assignments</Typography>
        </Box>

      </Box>

      {/* Achievements */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#111827', mb: 2 }}>
          Recent Achievements
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          
          {/* Example Achievement 1 (Dynamic opacity based on streak) */}
          <Box sx={{ 
            bgcolor: 'white', p: 2, borderRadius: '12px', border: '1px solid #f3f4f6', 
            display: 'flex', alignItems: 'center', gap: 2,
            opacity: stats.currentStreak >= 7 ? 1 : 0.5
          }}>
          <Box sx={{ 
              bgcolor: '#f97316', 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0 
            }}>
              <Sparkles size={20} color="white" />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1f2937' }}>
                Week Warrior
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Complete 7 days in a row
              </Typography>
            </Box>
          </Box>

          {/* Example Achievement 2 (Dynamic opacity based on focus mins) */}
          <Box sx={{ 
            bgcolor: 'white', p: 2, borderRadius: '12px', border: '1px solid #f3f4f6', 
            display: 'flex', alignItems: 'center', gap: 2,
            opacity: stats.totalFocusMinutes >= 100 ? 1 : 0.5
          }}>
          <Box sx={{ 
              bgcolor: '#3b82f6', 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0 
            }}>
              <Timer size={20} color="white" />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1f2937', lineHeight: 1.2 }}>
                Focus Master
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Complete 100+ focus minutes
              </Typography>
            </Box>
          </Box>

        </Box>
      </Box>

    </Box>
  );
}