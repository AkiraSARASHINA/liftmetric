import { useState, useEffect, useMemo } from 'react';
import { getExercisesByName, getUniqueExerciseNames, getWorkoutByDate, type Exercise, type Workout } from '../lib/db';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { TrendingUp, Activity, RotateCcw, Info, Search, ChevronDown, X } from 'lucide-react';
import './Charts.css';

interface ChartDataPoint {
  date: string;
  maxWeight: number;
  volume: number;
  reps: number;
  isBodyweight: boolean;
  exerciseDetail: Exercise;
}

const ChartsPage: React.FC = () => {
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    loadExerciseNames();
    
    // Global click listener to clear active chart point when clicking outside
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chart-section') && !target.closest('.custom-select-container')) {
        setActiveDate(null);
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, []);

  const loadExerciseNames = async () => {
    const names = await getUniqueExerciseNames();
    setExerciseNames(names);
    if (names.length > 0 && !selectedName) {
      setSelectedName(names[0]);
    }
  };

  useEffect(() => {
    if (selectedName) {
      loadChartData();
    }
  }, [selectedName]);

  const loadChartData = async () => {
    const results = await getExercisesByName(selectedName);
    const data: ChartDataPoint[] = results.map(r => {
      const ex = r.exercise!;
      const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
      const volume = ex.sets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);
      const reps = ex.sets.reduce((sum, s) => sum + s.reps, 0);
      
      return {
        date: r.date,
        maxWeight,
        volume,
        reps,
        isBodyweight: ex.isBodyweight,
        exerciseDetail: ex
      };
    });
    setChartData(data);
    setSelectedWorkout(null);
    setActiveDate(null);
  };

  const filteredNames = useMemo(() => {
    return exerciseNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exerciseNames, searchTerm]);

  const isBodyweight = useMemo(() => {
    return chartData.length > 0 && chartData[0].isBodyweight;
  }, [chartData]);

  const handlePointClick = async (data: any) => {
    let dateStr = '';
    
    if (data?.activePayload?.[0]?.payload?.date) {
      dateStr = data.activePayload[0].payload.date;
    } else if (data?.payload?.date) {
      dateStr = data.payload.date;
    } else if (data?.date) {
      dateStr = data.date;
    } else if (data?.activeLabel) {
      dateStr = data.activeLabel;
    }
    
    if (dateStr) {
      const workout = await getWorkoutByDate(dateStr);
      if (workout) {
        setSelectedWorkout(workout);
        setShowModal(true);
      }
    } else {
      setSelectedWorkout(null);
      setActiveDate(null);
    }
  };

  const handleChartMouseMove = (state: any) => {
    if (state && state.activeLabel) {
      setActiveDate(state.activeLabel);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWorkout(null);
    setActiveDate(null);
  };

  const selectExercise = (name: string) => {
    setSelectedName(name);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    // Only show if activeDate matches this label or Recharts thinks it's active
    if (active && payload && payload.length && (label === activeDate)) {
      return (
        <div className="custom-tooltip glass">
          <p className="label">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="value" style={{ color: p.color }}>
              {p.name}: {p.value}{p.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-page">
      <div className="exercise-selector card">
        <label>種目を選択</label>
        <div className="custom-select-container">
          <div 
            className="custom-select-trigger" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className={selectedName ? 'selected-val' : 'placeholder'}>
              {selectedName || '種目を選択してください'}
            </span>
            <ChevronDown size={18} className={isDropdownOpen ? 'rotate' : ''} />
          </div>

          {isDropdownOpen && (
            <div className="custom-dropdown glass animate-in">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="種目名で検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="options-list">
                {filteredNames.length > 0 ? (
                  filteredNames.map(name => (
                    <div 
                      key={name} 
                      className={`option ${name === selectedName ? 'active' : ''}`}
                      onClick={() => selectExercise(name)}
                    >
                      {name}
                    </div>
                  ))
                ) : (
                  <div className="no-results">該当する種目がありません</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isBodyweight && chartData.length > 0 && (
        <div className="chart-section card">
          <div className="chart-header">
            <TrendingUp size={18} />
            <h3>MAX重量推移 (kg)</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart 
                data={chartData} 
                onClick={handlePointClick} 
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setActiveDate(null)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#a0a0a0" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ pointerEvents: 'none' }}
                  active={activeDate !== null}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxWeight" 
                  name="MAX重量" 
                  unit="kg" 
                  stroke="var(--primary-color)" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: 'var(--primary-color)', strokeWidth: 0, cursor: 'pointer' }}
                  activeDot={{ r: 8, strokeWidth: 0, cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!isBodyweight && chartData.length > 0 && (
        <div className="chart-section card">
          <div className="chart-header">
            <Activity size={18} />
            <h3>総ボリューム (kg)</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={chartData} 
                onClick={handlePointClick} 
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setActiveDate(null)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#a0a0a0" fontSize={12} />
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ pointerEvents: 'none' }}
                  active={activeDate !== null}
                />
                <Bar dataKey="volume" name="ボリューム" unit="kg" fill="rgba(0, 163, 255, 0.4)" radius={[4, 4, 0, 0]} cursor="pointer">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeDate === entry.date ? 'var(--primary-color)' : 'rgba(0, 163, 255, 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="chart-section card">
          <div className="chart-header">
            <RotateCcw size={18} />
            <h3>総レップ数</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={chartData} 
                onClick={handlePointClick} 
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setActiveDate(null)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#a0a0a0" fontSize={12} />
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ pointerEvents: 'none' }}
                  active={activeDate !== null}
                />
                <Bar dataKey="reps" name="レップ数" unit="回" fill="rgba(255, 0, 85, 0.4)" radius={[4, 4, 0, 0]} cursor="pointer">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeDate === entry.date ? 'var(--secondary-color)' : 'rgba(255, 0, 85, 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {showModal && selectedWorkout && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content card detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedWorkout.date} ({getDayOfWeek(selectedWorkout.date)}) の全記録</h3>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="exercise-list">
              {selectedWorkout.exercises.map((ex, i) => (
                <div key={i} className="exercise-item card">
                  <div className="exercise-info">
                    <div className="exercise-header">
                      <span className="exercise-num">{i + 1}</span>
                      <h4 className={ex.name === selectedName ? 'highlight' : ''}>{ex.name}</h4>
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

      {chartData.length === 0 && selectedName && (
        <div className="no-data card">
          <p>データがありません。</p>
        </div>
      )}
    </div>
  );
};

export default ChartsPage;
