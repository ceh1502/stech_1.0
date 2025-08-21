// src/components/CalendarDropdown.jsx
import { useState } from 'react';
import dayjs from 'dayjs';
import './Calendar.css';

const CalendarDropdown = ({ value, onChange }) => {
    const [viewDate, setViewDate] = useState(dayjs(value)); // 현재 보고 있는 달

    /* 월 전후 이동 */
    const prevMonth = () => setViewDate(viewDate.subtract(1, 'month'));
    const nextMonth = () => setViewDate(viewDate.add(1, 'month'));

    /* 달력 그리드 데이터 */
    const start = viewDate.startOf('month').startOf('week'); // 달력 첫 칸
    const end = viewDate.endOf('month').endOf('week'); // 달력 끝 칸
    const days = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
        days.push(cur);
        cur = cur.add(1, 'day');
    }

    return (
        <div className="calendarBox">
            {/* 헤더: 년·월 + 이동 */}
            <div className="calHeader">
                <button onClick={prevMonth}>‹</button>
                <span>
                    {viewDate.format('YYYY')} / {viewDate.format('MM')}
                </span>
                <button onClick={nextMonth}>›</button>
            </div>

            {/* 요일 */}
            <div className="calWeekRow">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="calWeekCell">
                        {d}
                    </div>
                ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="calGrid">
                {days.map((d) => {
                    const isToday = d.isSame(dayjs(), 'day');
                    const isCurrent = d.isSame(viewDate, 'month');
                    const isSelect = d.isSame(value, 'day');
                    return (
                        <button key={d.format('YYYY-MM-DD')} className={`calCell ${isCurrent ? '' : 'dim'} ${isToday ? 'today' : ''} ${isSelect ? 'selected' : ''}`} onClick={() => onChange(d)}>
                            {d.format('D')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarDropdown;
