import React, { useState } from 'react';
import './App.css';
import samples from './samples.json';  // samples.json 파일 import

function App() {
  const [sentence, setSentence] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // 예측 결과를 처리하는 함수
  const handleSubmit = async () => {
    setLoading(true);
    const response = await fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sentence }),
    });

    const data = await response.json();
    setPrediction(data);
    setLoading(false);
  };

  // 라벨에 따라 출력되는 텍스트 변경 함수
  const getLabelText = (label) => {
    return label === 'positive' ? '🔴 개인정보 포함' : '🟢 개인정보 미포함';
  };

  // 샘플 입력 처리 함수
  const handleSampleInput = (type) => {
    const sample = type === 'include'
      ? samples.piIncluded[Math.floor(Math.random() * samples.piIncluded.length)]
      : samples.piExcluded[Math.floor(Math.random() * samples.piExcluded.length)];

    setSentence(sample);
  };

  return (
    <div className="App">
      <div className="container">
        <div className="left-side">
          <h1 className="header">PII Detector - BERT(NLP)</h1>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="textarea"
            placeholder="Enter your API body here"
          ></textarea>

          <div className="button-container">
            <button onClick={handleSubmit} className="predict-button" disabled={loading}>
              {loading ? (
                <>
                  로딩 중...
                  <div className="loading-spinner"></div>
                </>
              ) : (
                'Predict'
              )}
            </button>
          </div>

          {prediction !== null && !loading && (
            <div className="prediction-result">
              <h2>Prediction Result:</h2>
              <p>{getLabelText(prediction.label)}</p>
              <p>소요시간: {prediction.processing_time_ms.toFixed(0)}ms</p>
              <p>Score: {Math.floor(prediction.results[0].score * 10000) / 10000}</p>
            </div>
          )}
        </div>

        <div className="right-side">
          <h2>Sample Inputs</h2>
          <div className="sample-buttons">
            <button className="sample-button" onClick={() => handleSampleInput('include')}>
              개인정보 포함
            </button>
            <button className="sample-button" onClick={() => handleSampleInput('exclude')}>
              개인정보 미포함
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
