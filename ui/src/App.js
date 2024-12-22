import React, { useState } from 'react';
import './App.css';

function App() {
  const [sentence, setSentence] = useState('');
  const [prediction, setPrediction] = useState(null);

  const handleSubmit = async () => {
    const response = await fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sentence }),
    });

    const data = await response.json();
    setPrediction(JSON.stringify(data));
  };

  return (
    <div className="App">
      <h1>PI Prediction</h1>
      <textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        rows="4"
        cols="50"
        placeholder="Enter a sentence"
      ></textarea>
      <br />
      <button onClick={handleSubmit}>Predict</button>

      {prediction !== null && (
        <div>
          <h2>Prediction Result: {prediction}</h2>
        </div>
      )}
    </div>
  );
}

export default App;
