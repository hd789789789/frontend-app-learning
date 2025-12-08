import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@openedx/paragon';
import './StreakCalendar.scss';

const StreakCalendar = ({ streakDays, lastDayOfStreak }) => {
  // Generate calendar days for the last 2-3 weeks
  const calendarData = useMemo(() => {
    const today = new Date();
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);
    
    const days = [];
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    // Start from 2 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 20); // Show ~3 weeks
    
    // Calculate which days are completed
    const completedDates = new Set();
    
    if (streakDays > 0) {
      // If we have lastDayOfStreak, use it
      if (lastDayOfStreak) {
        try {
          const lastDay = new Date(lastDayOfStreak);
          lastDay.setHours(0, 0, 0, 0);
          // Mark all days in the streak as completed
          for (let i = 0; i < streakDays; i++) {
            const date = new Date(lastDay);
            date.setDate(lastDay.getDate() - i);
            date.setHours(0, 0, 0, 0);
            completedDates.add(date.toDateString());
          }
        } catch (e) {
          // If parsing fails, use fallback
          console.warn('Failed to parse lastDayOfStreak:', e);
        }
      }
      
      // Fallback: if no lastDayOfStreak or parsing failed, assume streak ends today
      if (completedDates.size === 0) {
        // Mark days from today going back (streakDays) days
        for (let i = 0; i < streakDays; i++) {
          const date = new Date(todayNormalized);
          date.setDate(todayNormalized.getDate() - i);
          date.setHours(0, 0, 0, 0);
          completedDates.add(date.toDateString());
        }
      }
    }
    
    // Generate week day headers
    weekDays.forEach(day => {
      days.push({ type: 'header', label: day });
    });
    
    // Generate calendar days
    const currentDate = new Date(startDate);
    // Find the first Monday (T2) before or on startDate
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentDate.setDate(currentDate.getDate() - daysToMonday);
    
    // Generate 21 days (3 weeks)
    for (let i = 0; i < 21; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toDateString();
      const isToday = dateStr === todayNormalized.toDateString();
      const isCompleted = completedDates.has(dateStr);
      const isFuture = date > todayNormalized;
      
      days.push({
        type: 'day',
        date: date.getDate(),
        isToday,
        isCompleted,
        isFuture,
      });
    }
    
    return days;
  }, [streakDays, lastDayOfStreak]);

  return (
    <Card className="streak-calendar-card">
      <Card.Body>
        <h3 className="streak-calendar-title">🔥 Chuỗi của bạn</h3>
        
        <div className="streak-calendar-header">
          <div className="streak-calendar-number">{streakDays}</div>
          <div className="streak-calendar-label">ngày liên tiếp</div>
        </div>
        
        <div className="streak-calendar-grid">
          {calendarData.map((item, index) => {
            if (item.type === 'header') {
              return (
                <div key={`header-${index}`} className="streak-calendar-day-header">
                  {item.label}
                </div>
              );
            }
            
            const dayClasses = ['streak-calendar-day'];
            let dayStyle = {};
            
            // Priority: today > completed > future
            if (item.isToday) {
              dayClasses.push('streak-calendar-day-today');
              dayStyle = {
                backgroundColor: '#8b3a62',
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(139, 58, 98, 0.3)',
              };
            } else if (item.isCompleted) {
              dayClasses.push('streak-calendar-day-completed');
              dayStyle = {
                backgroundColor: '#2ecc71',
                color: 'white',
                fontWeight: 500,
              };
            } else if (item.isFuture) {
              dayClasses.push('streak-calendar-day-future');
              dayStyle = {
                border: '1px dashed #e0e0e0',
                opacity: 0.6,
              };
            }
            
            return (
              <div 
                key={`day-${index}`} 
                className={dayClasses.join(' ')} 
                style={dayStyle}
              >
                {item.date}
              </div>
            );
          })}
        </div>
        
        <div className="streak-calendar-message">
          Học hôm nay để giữ chuỗi! 💪
        </div>
      </Card.Body>
    </Card>
  );
};

StreakCalendar.propTypes = {
  streakDays: PropTypes.number,
  lastDayOfStreak: PropTypes.string, // ISO date string
};

StreakCalendar.defaultProps = {
  streakDays: 0,
  lastDayOfStreak: null,
};

export default StreakCalendar;

