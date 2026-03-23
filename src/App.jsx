import { useState } from 'react'
import './App.css'

const VIBES = [
  { value: '야경', label: '🌃 야경' },
  { value: '해안도로', label: '🌊 해안도로' },
  { value: '산길/와인딩', label: '🏔 산길/와인딩' },
  { value: '카페투어', label: '☕ 카페투어' },
  { value: '맛집투어', label: '🍽 맛집투어' },
  { value: '드라이브스루', label: '🚗 드라이브스루' },
]

const LOADING_STEPS = [
  { icon: '📍', text: '출발지 분석 중...' },
  { icon: '🗺', text: '최적 코스 탐색 중...' },
  { icon: '🍽', text: '추천 스팟 선별 중...' },
  { icon: '✨', text: '드라이브 코스 완성 중...' },
]

function parseResult(text) {
  const sections = []
  const lines = text.split('\n')
  let current = null

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (current) sections.push(current)
      current = { title: line.replace(/^#{2,3}\s*/, ''), items: [], body: '' }
    } else if (/^\*\*(.+?)\*\*/.test(line)) {
      if (current) current.summary = line.replace(/\*\*/g, '').replace('코스 요약:', '').trim()
    } else if (line.startsWith('- ')) {
      if (current) current.items.push(line.replace(/^-\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1'))
    } else if (line.trim()) {
      if (current) current.body += (current.body ? '\n' : '') + line.trim().replace(/\*\*(.+?)\*\*/g, '$1')
    }
  }
  if (current) sections.push(current)
  return sections
}

export default function App() {
  const [step, setStep] = useState('input')
  const [departure, setDeparture] = useState('')
  const [people, setPeople] = useState('4~6명')
  const [vibes, setVibes] = useState([])
  const [duration, setDuration] = useState('반나절(3~4시간)')
  const [season, setSeason] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const toggleVibe = v =>
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const handleSubmit = async () => {
    if (!departure.trim()) { setError('출발지를 입력해주세요.'); return }
    setError(null); setStep('loading'); setLoadingStep(0)

    const timer = setInterval(() =>
      setLoadingStep(p => p < LOADING_STEPS.length - 1 ? p + 1 : p), 2800)

    const prompt = `당신은 한국 드라이브 코스 전문가입니다. 자동차 동아리 회원들을 위한 드라이브 코스를 추천해주세요.

조건:
- 출발지: ${departure}
- 인원: ${people}
- 소요 시간: ${duration}
- 선호 분위기: ${vibes.length > 0 ? vibes.join(', ') : '특별한 선호 없음'}
${season ? `- 계절/시간대: ${season}` : ''}

다음 형식으로 답변해주세요:

## 🗺 추천 코스명

**코스 요약:** 한 줄 소개

### 📍 코스 경로
출발지 → 경유지1 → 경유지2 → 도착지 (각 구간 예상 소요 시간 포함)

### 🚗 드라이브 포인트
- 도로 특징 및 볼거리 2~3가지

### 🍽 추천 스팟
- 맛집 또는 카페 2~3곳 (지역명과 특징)

### 💡 꿀팁
- 주의사항 또는 참고사항 1~2가지

한국어로 답변하고, 실제 존재하는 장소를 기반으로 구체적으로 추천해주세요.`

    try {
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || '추천 실패')
      setResult(data.text)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('input')
    } finally {
      clearInterval(timer)
    }
  }

  const reset = () => { setStep('input'); setResult(null); setError(null); setDeparture(''); setVibes([]) }

  /* ── INPUT ── */
  if (step === 'input') return (
    <div className="app">
      <header className="header">
        <div>
          <div className="logo">🗺 AI 드라이브 코스</div>
          <p className="logo-sub">맞춤 드라이브 코스 추천</p>
        </div>
      </header>

      <section className="hero">
        <div className="badge">✨ AI 기반 추천</div>
        <h1>나만의 <span className="accent">드라이브 코스</span>를<br />찾아드립니다</h1>
        <p className="hero-desc">
          출발지와 원하는 분위기를 입력하면<br />
          AI가 최적의 드라이브 코스를 추천해드립니다.
        </p>
      </section>

      <section className="form-section">
        {error && <div className="error-box">⚠️ {error}</div>}

        <div className="form-group">
          <label className="form-label">출발지 *</label>
          <input
            className="form-input"
            placeholder="예: 서울 강남, 수원 영통"
            value={departure}
            onChange={e => setDeparture(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">인원수</label>
            <select className="form-select" value={people} onChange={e => setPeople(e.target.value)}>
              <option>2~3명</option>
              <option>4~6명</option>
              <option>7~10명</option>
              <option>10명 이상</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">소요 시간</label>
            <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="약 2시간">약 2시간</option>
              <option value="반나절(3~4시간)">반나절 (3~4시간)</option>
              <option value="하루 종일">하루 종일</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">선호 분위기 <span className="form-hint">(중복 선택 가능)</span></label>
          <div className="vibe-grid">
            {VIBES.map(v => (
              <button key={v.value}
                className={`vibe-chip${vibes.includes(v.value) ? ' selected' : ''}`}
                onClick={() => toggleVibe(v.value)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">계절 / 시간대 <span className="form-hint">(선택)</span></label>
          <select className="form-select" value={season} onChange={e => setSeason(e.target.value)}>
            <option value="">상관없음</option>
            <option>🌸 봄</option>
            <option>☀️ 여름</option>
            <option>🍁 가을</option>
            <option>❄️ 겨울</option>
            <option>🌤 주간</option>
            <option>🌙 야간</option>
          </select>
        </div>

        <button
          className={`btn-primary${!departure.trim() ? ' disabled' : ''}`}
          disabled={!departure.trim()}
          onClick={handleSubmit}>
          {departure.trim() ? '🔍 코스 추천받기' : '출발지를 먼저 입력해주세요'}
        </button>
      </section>
    </div>
  )

  /* ── LOADING ── */
  if (step === 'loading') return (
    <div className="app loading-app">
      <div className="loading-wrap">
        <div className="loading-spinner" />
        <h2 className="loading-title">코스 생성 중입니다</h2>
        <div className="loading-steps">
          {LOADING_STEPS.map((s, i) => (
            <div key={i} className={`loading-step${i <= loadingStep ? ' active' : ''}${i < loadingStep ? ' done' : ''}`}>
              <span className="step-icon">{i < loadingStep ? '✅' : s.icon}</span>
              <span className="step-text">{s.text}</span>
            </div>
          ))}
        </div>
        <p className="loading-hint">약 10~20초 소요됩니다</p>
      </div>
    </div>
  )

  /* ── RESULT ── */
  const sections = parseResult(result || '')
  const titleSec = sections.find(s => s.title.includes('🗺'))
  const otherSecs = sections.filter(s => s !== titleSec)

  return (
    <div className="app">
      <header className="header">
        <div className="logo">🗺 AI 드라이브 코스</div>
        <button className="reset-btn" onClick={reset}>← 다시 추천</button>
      </header>

      {titleSec && (
        <section className="course-title-section">
          <div className="course-badge">AI 추천 코스</div>
          <h1 className="course-name">{titleSec.title.replace(/🗺\s*/, '')}</h1>
          {titleSec.summary && <p className="course-summary">{titleSec.summary}</p>}
          <div className="course-meta-chips">
            <span className="meta-chip">📍 {departure}</span>
            <span className="meta-chip">👥 {people}</span>
            <span className="meta-chip">⏱ {duration}</span>
            {vibes.length > 0 && <span className="meta-chip">{vibes.join(' · ')}</span>}
          </div>
        </section>
      )}

      <section className="result-sections">
        {otherSecs.map((sec, i) => (
          <div key={i} className="result-card">
            <h3 className="result-card-title">{sec.title}</h3>
            {sec.body && <p className="result-card-body">{sec.body}</p>}
            {sec.items?.length > 0 && (
              <ul className="result-card-list">
                {sec.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </section>

      <button className="btn-primary retry-btn" onClick={reset}>
        🔄 다른 코스 추천받기
      </button>
    </div>
  )
}
