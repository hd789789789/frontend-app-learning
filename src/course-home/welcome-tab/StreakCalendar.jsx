import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from '@openedx/paragon';
import './StreakCalendar.scss';

const StreakCalendar = ({ streakDays, lastDayOfStreak }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Vietnamese month names
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Calculate completed dates
  const completedDates = useMemo(() => {
    const dates = new Set();
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);

    if (streakDays > 0) {
      if (lastDayOfStreak) {
        try {
          const lastDay = new Date(lastDayOfStreak);
          lastDay.setHours(0, 0, 0, 0);
          for (let i = 0; i < streakDays; i++) {
            const date = new Date(lastDay);
            date.setDate(lastDay.getDate() - i);
            date.setHours(0, 0, 0, 0);
            dates.add(date.toDateString());
          }
        } catch (e) {
          console.warn('Failed to parse lastDayOfStreak:', e);
        }
      }

      // Fallback: if no lastDayOfStreak, assume streak ends today
      if (dates.size === 0) {
        for (let i = 0; i < streakDays; i++) {
          const date = new Date(todayNormalized);
          date.setDate(todayNormalized.getDate() - i);
          date.setHours(0, 0, 0, 0);
          dates.add(date.toDateString());
        }
      }
    }

    return dates;
  }, [streakDays, lastDayOfStreak, today]);

  // Generate calendar for selected month
  const calendarData = useMemo(() => {
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const days = [];

    // First day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday = 0 format
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Add week day headers
    weekDays.forEach(day => {
      days.push({ type: 'header', label: day });
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() - (firstDayOfWeek - i));
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toDateString();
      const todayNormalized = new Date(today);
      todayNormalized.setHours(0, 0, 0, 0);
      
      days.push({
        type: 'day',
        date: date.getDate(),
        fullDate: date,
        isToday: dateStr === todayNormalized.toDateString(),
        isCompleted: completedDates.has(dateStr),
        isOtherMonth: true,
        isFuture: date > todayNormalized,
      });
    }

    // Add all days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toDateString();
      const todayNormalized = new Date(today);
      todayNormalized.setHours(0, 0, 0, 0);
      
      days.push({
        type: 'day',
        date: day,
        fullDate: date,
        isToday: dateStr === todayNormalized.toDateString(),
        isCompleted: completedDates.has(dateStr),
        isOtherMonth: false,
        isFuture: date > todayNormalized,
      });
    }

    // Fill remaining cells to complete the calendar grid (6 rows x 7 columns = 42 cells)
    const totalCells = 42; // 6 weeks * 7 days
    const currentCells = days.filter(d => d.type === 'day').length;
    const remainingCells = totalCells - currentCells;

    if (remainingCells > 0) {
      const lastDate = new Date(currentYear, currentMonth, lastDay.getDate());
      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(lastDate);
        date.setDate(lastDate.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        const dateStr = date.toDateString();
        const todayNormalized = new Date(today);
        todayNormalized.setHours(0, 0, 0, 0);
        
        days.push({
          type: 'day',
          date: date.getDate(),
          fullDate: date,
          isToday: dateStr === todayNormalized.toDateString(),
          isCompleted: completedDates.has(dateStr),
          isOtherMonth: true,
          isFuture: date > todayNormalized,
        });
      }
    }

    return days;
  }, [currentMonth, currentYear, completedDates, today]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value, 10));
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value, 10));
  };

  // Generate year options (current year ± 2 years)
  const yearOptions = [];
  const currentYearValue = today.getFullYear();
  for (let year = currentYearValue - 2; year <= currentYearValue + 2; year++) {
    yearOptions.push(year);
  }

  return (
    <Card className="streak-calendar-card">
      <Card.Body>
        <h3 className="streak-calendar-title">🔥 Chuỗi của bạn</h3>
        
        <div className="streak-calendar-header">
          <div className="streak-calendar-number">{streakDays}</div>
          <div className="streak-calendar-label">ngày liên tiếp</div>
        </div>

        {/* Month/Year Selector */}
        <div className="streak-calendar-controls">
          <Button
            variant="link"
            size="sm"
            onClick={handlePrevMonth}
            className="streak-calendar-nav-btn"
            aria-label="Tháng trước"
          >
            ‹
          </Button>
          
          <div className="streak-calendar-date-selectors">
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              className="streak-calendar-select"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>
                  {name}
                </option>
              ))}
            </select>
            
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="streak-calendar-select"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <Button
            variant="link"
            size="sm"
            onClick={handleNextMonth}
            className="streak-calendar-nav-btn"
            aria-label="Tháng sau"
          >
            ›
          </Button>
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
            
            if (item.isOtherMonth) {
              dayClasses.push('streak-calendar-day-other-month');
            }
            
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
                title={item.fullDate ? item.fullDate.toLocaleDateString('vi-VN') : ''}
              >
                {item.date}
              </div>
            );
          })}
        </div>
        
        <div className="streak-calendar-legend">
          <div className="legend-item">
            <div className="legend-color legend-today"></div>
            <span>Hôm nay</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-completed"></div>
            <span>Đã học</span>
          </div>
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
