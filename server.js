const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Ensure logs directory exists
const ensureLogDirectory = async () => {
  try {
    await fs.access('logs');
  } catch {
    await fs.mkdir('logs', { recursive: true });
  }
};

const LOG_FILE = 'focus_sessions.log';
const ANALYTICS_CACHE_FILE = 'analytics_cache.json';
let analyticsCache = null;
let lastCacheUpdate = 0;

// Cache analytics for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Initialize
ensureLogDirectory();

// Enhanced session logging with validation
app.post('/api/log-session', async (req, res) => {
  try {
    const { sessionType, plannedDuration, actualDuration, distractionCount, distractions, completedAt, wasCompleted } = req.body;
    
    // Validate required fields
    if (!sessionType || typeof actualDuration !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid session data' });
    }
    
    const sessionData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      date: new Date().toDateString(),
      sessionType,
      plannedDuration: plannedDuration || 0,
      actualDuration,
      distractionCount: distractionCount || 0,
      distractions: distractions || [],
      completedAt,
      wasCompleted: wasCompleted || false,
      userIP: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    const logEntry = JSON.stringify(sessionData) + '\n';
    await fs.appendFile(LOG_FILE, logEntry);
    
    // Invalidate analytics cache
    analyticsCache = null;
    
    console.log(`[${new Date().toISOString()}] Session logged: ${sessionType} - ${actualDuration}min, ${distractionCount} distractions`);
    res.json({ success: true, message: 'Session logged successfully', id: sessionData.id });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({ success: false, error: 'Failed to log session' });
  }
});

// Enhanced analytics with caching
app.get('/api/analytics', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (analyticsCache && (now - lastCacheUpdate) < CACHE_DURATION) {
      return res.json(analyticsCache);
    }
    
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const sessions = data.trim().split('\n').filter(line => line).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const analytics = {
      totalSessions: sessions.length,
      sessionsByType: {},
      averageDistractions: 0,
      dailyStats: {},
      weeklyStats: {},
      totalFocusTime: 0,
      lastSession: sessions[sessions.length - 1]?.timestamp || null,
      topDistractions: {},
      focusStreaks: calculateStreaks(sessions),
      productivity: calculateProductivity(sessions)
    };
    
    sessions.forEach(session => {
      // Count by type
      analytics.sessionsByType[session.sessionType] = 
        (analytics.sessionsByType[session.sessionType] || 0) + 1;
      
      // Daily stats
      if (!analytics.dailyStats[session.date]) {
        analytics.dailyStats[session.date] = { 
          sessions: 0, 
          distractions: 0, 
          focusTime: 0,
          completedSessions: 0
        };
      }
      analytics.dailyStats[session.date].sessions++;
      analytics.dailyStats[session.date].distractions += session.distractionCount || 0;
      analytics.dailyStats[session.date].focusTime += session.actualDuration || 0;
      if (session.wasCompleted) analytics.dailyStats[session.date].completedSessions++;
      
      analytics.totalFocusTime += session.actualDuration || 0;
      
      // Track distraction patterns
      if (session.distractions) {
        session.distractions.forEach(d => {
          const key = d.distraction.toLowerCase().trim();
          analytics.topDistractions[key] = (analytics.topDistractions[key] || 0) + 1;
        });
      }
    });
    
    analytics.averageDistractions = sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + (s.distractionCount || 0), 0) / sessions.length : 0;
    
    // Cache the results
    analyticsCache = analytics;
    lastCacheUpdate = now;
    
    // Save cache to file for persistence
    await fs.writeFile(ANALYTICS_CACHE_FILE, JSON.stringify(analytics, null, 2));
    
    res.json(analytics);
  } catch (error) {
    console.error('Error reading analytics:', error);
    res.json({ 
      totalSessions: 0, 
      sessionsByType: {}, 
      averageDistractions: 0,
      error: 'Failed to load analytics'
    });
  }
});

// Helper functions for advanced analytics
function calculateStreaks(sessions) {
  // Calculate consecutive days with sessions
  const dates = [...new Set(sessions.map(s => s.date))].sort();
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || isConsecutiveDay(dates[i-1], dates[i])) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return { current: currentStreak, max: maxStreak };
}

function calculateProductivity(sessions) {
  const recent = sessions.slice(-10); // Last 10 sessions
  const completion_rate = recent.length > 0 ? 
    recent.filter(s => s.wasCompleted).length / recent.length : 0;
  
  return {
    completionRate: Math.round(completion_rate * 100),
    averageSessionLength: recent.length > 0 ? 
      recent.reduce((sum, s) => sum + s.actualDuration, 0) / recent.length : 0
  };
}

function isConsecutiveDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Export session data (for analysis)
app.get('/api/export', async (req, res) => {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const sessions = data.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="focus_sessions_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    totalSessions: analyticsCache?.totalSessions || 'loading...'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Focus Time Manager running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logging to: ${LOG_FILE}`);
});