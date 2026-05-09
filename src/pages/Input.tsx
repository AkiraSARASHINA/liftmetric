import { useState } from 'react';
import { saveWorkout, type Workout } from '../lib/db';
import { Save, AlertCircle, CheckCircle2, Clipboard, Copy, X } from 'lucide-react';
import './Input.css';

const AI_PROMPT = `添付したウェイトトレーニングの記録（写真）を解析し、以下の指示に従って指定のJSONフォーマットに変換してください。

### 指示事項:
1. **日付**: 記録から日付を特定し、"YYYY-MM-DD" 形式で出力してください。複数日の記録がある場合は、配列形式で出力してください。
2. **種目名**: 種目名を正確に読み取ってください。
3. **自重種目**: 自重種目の場合は \`isBodyweight\` を \`true\` にしてください。
4. **セット内容**: 各セットの重量（weight）と回数（reps）を数値で抽出してください。
5. **出力**: 余計な解説は省き、純粋なJSONデータのみを出力してください。

### JSONフォーマット例:
[
  {
    "date": "2024-05-08",
    "exercises": [
      {
        "name": "ベンチプレス",
        "isBodyweight": false,
        "sets": [{ "weight": 70, "reps": 10 }]
      }
    ]
  }
]`;

const InputPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleSave = async () => {
    try {
      const data = JSON.parse(jsonInput);
      
      const workouts: Workout[] = Array.isArray(data) ? data : [data];

      for (const workout of workouts) {
        if (!workout.date || !Array.isArray(workout.exercises)) {
          throw new Error('JSON形式が正しくありません（dateまたはexercisesが不足しています）');
        }
        await saveWorkout(workout);
      }

      setStatus({ 
        type: 'success', 
        message: `${workouts.length}件のトレーニング記録を保存しました！` 
      });
      setJsonInput('');
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'JSONのパースに失敗しました' 
      });
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    alert('プロンプトをコピーしました！AIに貼り付けて使用してください。');
  };

  return (
    <div className="input-page">
      <div className="header-group">
        <div className="header-row">
          <h2>データ登録</h2>
          <button className="prompt-guide-btn" onClick={() => setShowModal(true)}>
            <Clipboard size={16} />
            AIプロンプトを取得
          </button>
        </div>
        <p className="description">生成AIで出力したJSONデータを貼り付けてください。複数日程の同時登録も可能です。</p>
      </div>

      <div className="input-container">
        <textarea
          placeholder='[{"date": "2023-10-25", "exercises": [...] }, ...]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          spellCheck={false}
        />
      </div>

      {status.type && (
        <div className={`status-message ${status.type}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      <button 
        className="btn-primary save-btn" 
        onClick={handleSave}
        disabled={!jsonInput.trim()}
      >
        <Save size={20} />
        <span>記録を保存</span>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AIプロンプト ガイド</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <p className="modal-description">以下のプロンプトをコピーして、写真と一緒にAI（ChatGPT/Gemini等）に渡してください。</p>
            <div className="prompt-box">
              <pre>{AI_PROMPT}</pre>
              <button className="copy-btn btn-primary" onClick={copyPrompt}>
                <Copy size={16} /> コピーする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputPage;
