import { useState } from 'react';
import { saveWorkout, getWorkoutByDate, type Workout } from '../lib/db';
import { ClipboardCheck, Save, AlertCircle, Copy, HelpCircle, X } from 'lucide-react';
import './Input.css';

const AI_PROMPT = `ウェイトトレーニングの記録を以下のJSON形式に変換してください。
複数の日程がある場合は、その配列を返してください。

【出力フォーマット】
[
  {
    "date": "YYYY-MM-DD",
    "exercises": [
      {
        "name": "種目名",
        "isBodyweight": false,
        "note": "備考（あれば）",
        "sets": [
          { "weight": 60, "reps": 10 },
          { "weight": 60, "reps": 8 }
        ]
      }
    ]
  }
]

【ルール】
- 重量は数値のみ（kgは含めない）。
- 自重種目の場合は isBodyweight を true にし、weight は含めない。
- 1つの日付に同じ種目が複数回あっても構いません（そのままリストに含めてください）。`;

const InputPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const handleSave = async () => {
    try {
      const data = JSON.parse(jsonInput);
      const workouts = Array.isArray(data) ? data : [data];

      for (const workout of workouts) {
        if (!workout.date || !workout.exercises) {
          throw new Error('不正なフォーマットです。dateとexercisesが必要です。');
        }

        // Check for existing workout on the same date to merge
        const existingWorkout = await getWorkoutByDate(workout.date);
        let finalWorkout: Workout;

        if (existingWorkout) {
          finalWorkout = {
            ...existingWorkout,
            exercises: [...existingWorkout.exercises, ...workout.exercises]
          };
        } else {
          finalWorkout = workout;
        }

        await saveWorkout(finalWorkout);
      }

      setStatus({ type: 'success', message: `${workouts.length}件の記録を保存しました（既存の記録には追記されました）。` });
      setJsonInput('');
    } catch (e) {
      setStatus({ type: 'error', message: '保存に失敗しました。JSONの形式を確認してください。' });
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    alert('プロンプトをコピーしました！AIに貼り付けて使用してください。');
  };

  return (
    <div className="input-page">
      <div className="header-row">
        <h2>記録の登録</h2>
        <button className="prompt-guide-btn" onClick={() => setShowPromptModal(true)}>
          <HelpCircle size={18} />
          AIプロンプトを取得
        </button>
      </div>
      
      <p className="description">
        生成AI（ChatGPTなど）で作成したJSONデータを貼り付けて保存してください。
      </p>

      <div className="input-container card">
        <textarea
          placeholder='[{"date": "2024-05-10", "exercises": [...]}]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
      </div>

      {status && (
        <div className={`status-message ${status.type} animate-in`}>
          {status.type === 'success' ? <ClipboardCheck size={20} /> : <AlertCircle size={20} />}
          {status.message}
        </div>
      )}

      <button className="btn-primary save-btn" onClick={handleSave}>
        <Save size={20} />
        記録を保存
      </button>

      {showPromptModal && (
        <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AIプロンプトガイド</h3>
              <button className="close-btn" onClick={() => setShowPromptModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-description">
              以下のプロンプトをコピーして、トレーニングノートの写真と一緒にAIに送ってください。
            </p>
            <div className="prompt-box">
              <pre>{AI_PROMPT}</pre>
              <button className="btn-primary copy-btn" onClick={copyPrompt}>
                <Copy size={18} />
                プロンプトをコピーする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputPage;
