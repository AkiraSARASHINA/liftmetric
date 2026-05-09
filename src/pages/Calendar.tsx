import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { getAllWorkouts, getWorkoutByDate, type Workout } from '../lib/db';
import { Info, Calendar as CalendarIcon, List as ListIcon, X } from 'lucide-react';
import './Calendar.css';

type ViewMode = 'grid' | 'list';

const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  
  const [monthsToDisplay, setMonthsToDisplay] = useState<Date[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWorkouts();
    const initialMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      initialMonths.push(d);
    }
    setMonthsToDisplay(initialMonths);
  }, []);

  useLayoutEffect(() => {
    if (viewMode === 'grid' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [viewMode, monthsToDisplay.length === 6]);

  const loadWorkouts = async () => {
    const all = await getAllWorkouts();
    setAllWorkouts(all);
  };

  const workoutMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    allWorkouts.forEach(w => {
      map[w.date] = true;
    });
    return map;
  }, [allWorkouts]);

  const sortedWorkouts = useMemo(() => {
    return [...allWorkouts].sort((a, b) => b.date.localeCompare(a.date));
  }, [allWorkouts]);

  const handleDateClick = async (dateStr: string) => {
    const workout = await getWorkoutByDate(dateStr);
    if (workout) {
      setSelectedDateStr(dateStr);
      setSelectedWorkout(workout);
      setShowModal(true);
    }
  };

  const loadMorePastMonths = () => {
    const firstMonth = monthsToDisplay[0];
    const newMonths = [];
    const container = scrollContainerRef.current;
    const oldHeight = container?.scrollHeight || 0;

    for (let i = 6; i >= 1; i--) {
      const d = new Date(firstMonth);
      d.setMonth(d.getMonth() - i);
      newMonths.push(d);
    }
    
    setMonthsToDisplay([...newMonths, ...monthsToDisplay]);

    setTimeout(() => {
      if (container) {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - oldHeight;
      }
    }, 0);
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const renderMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = date.toLocaleString('ja-JP', { year: 'numeric', month: 'long' });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${year}-${month}-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasWorkout = workoutMap[dStr];

      days.push(
        <div 
          key={dStr} 
          className={`calendar-day ${hasWorkout ? 'has-workout' : ''}`}
          onClick={() => handleDateClick(dStr)}
        >
          <span>{d}</span>
          {hasWorkout && <div className="dot"></div>}
        </div>
      );
    }

    return (
      <div key={`${year}-${month}`} className="month-section">
        <h3 className="month-label">{monthLabel}</h3>
        <div className="calendar-weekdays">
          {['日', '月', '火', '水', '木', '金', '土'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  const renderList = () => {
    if (sortedWorkouts.length === 0) {
      return <div className="no-data card">記録がまだありません。</div>;
    }

    return (
      <div className="timeline-list animate-in">
        {sortedWorkouts.map((w) => (
          <div 
            key={w.date} 
            className="timeline-item card"
            onClick={() => handleDateClick(w.date)}
          >
            <div className="timeline-date">
              <span className="date-main">{w.date.split('-')[2]}</span>
              <span className="date-sub">{w.date.split('-')[0]}.{w.date.split('-')[1]} ({getDayOfWeek(w.date)})</span>
            </div>
            <div className="timeline-summary">
              <div className="exercise-chips">
                {w.exercises.map((ex, i) => (
                  <span key={i} className="chip">{ex.name}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <div className="view-toggle glass">
        <button 
          className={viewMode === 'grid' ? 'active' : ''} 
          onClick={() => setViewMode('grid')}
        >
          <CalendarIcon size={18} />
          カレンダー
        </button>
        <button 
          className={viewMode === 'list' ? 'active' : ''} 
          onClick={() => setViewMode('list')}
        >
          <ListIcon size={18} />
          リスト
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="vertical-calendar card animate-in" ref={scrollContainerRef}>
          <button className="load-more-btn top" onClick={loadMorePastMonths}>
            さらに過去を読み込む
          </button>
          {monthsToDisplay.map(m => renderMonthGrid(m))}
        </div>
      ) : renderList()}

      {showModal && selectedWorkout && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content card detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDateStr} ({getDayOfWeek(selectedDateStr)}) の記録</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="exercise-list">
              {selectedWorkout.exercises.map((ex, i) => (
                <div key={i} className="exercise-item card">
                  <div className="exercise-info">
                    <div className="exercise-header">
                      <span className="exercise-num">{i + 1}</span>
                      <h4>{ex.name}</h4>
                    </div>
                    {ex.note && <p className="note"><Info size={12} /> {ex.note}</p>}
                  </div>
                  <div className="sets-grid">
                    {ex.sets.map((set, si) => (
                      <div key={si} className="set-row">
                        <span className="set-num">{si + 1}</span>
                        <span className="set-val">
                          {ex.isBodyweight ? '自重' : `${set.weight}kg`} × {set.reps}回
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
