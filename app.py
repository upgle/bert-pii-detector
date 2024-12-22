from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import re
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import pipeline
import time  # Import time module

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins="*")

# Load the pre-trained model and tokenizer
device = torch.device('cpu')

# 모델과 토크나이저 로드
model_path = 'upgle/bert-pii-korean'
model = AutoModelForSequenceClassification.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)
model.eval()

# Define the prediction function
def sentences_predict(sent):
    tokenized_sent = tokenizer(
        sent,
        return_tensors="pt",
        truncation=True,
        add_special_tokens=True,
        max_length=512
    )
    tokenized_sent.to(device)

    with torch.no_grad():  # Disable gradient calculation
        outputs = model(
            input_ids=tokenized_sent['input_ids'],
            attention_mask=tokenized_sent['attention_mask'],
            token_type_ids=tokenized_sent['token_type_ids']
        )

    logits = outputs[0]
    logits = logits.detach().cpu().numpy()
    result = np.argmax(logits)
    return result

nlp_sentence_classif = pipeline('sentiment-analysis', model=model, tokenizer=tokenizer, device=0)


# Function to split sentence if it's too long
def split_sentence(sentence, max_length=500):
    sentence = sentence.replace("\n", " ")
    sentence = re.sub(r'\s+', ' ', sentence)  # Replace multiple spaces with a single space

    if len(sentence) > max_length:
        # Split the sentence into parts of max_length characters
        parts = [sentence[i:i + max_length] for i in range(0, len(sentence), max_length)]
    else:
        parts = [sentence]
    return parts


@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()  # Start the timer

    data = request.get_json()
    sentence = data.get("sentence", "")
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400

    # Split the sentence if it's too long
    sentence_parts = split_sentence(sentence)

    results = []
    positive_sentences = []  # Store the original sentence if it's positive
    for part in sentence_parts:
        result = nlp_sentence_classif(part)[0]
        if result['label'] == 'LABEL_0':
            result['label'] = 'negative'
        elif result['label'] == 'LABEL_1':
            result['label'] = 'positive'
            positive_sentences.append(part)  # Store the original sentence part if it's positive
        results.append(result)

    # Determine final result (combine or just check if any part is positive)
    final_result = {
        "label": 'positive' if any(res['label'] == 'positive' for res in results) else 'negative',
        "results": results
    }

    # If there's any positive sentence, include the original sentence in the response
    if positive_sentences:
        final_result["positive_sentence"] = sentence

    end_time = time.time()  # End the timer
    processing_time = (end_time - start_time) * 1000  # Convert time to milliseconds

    final_result["processing_time_ms"] = round(processing_time, 2)  # Round to 2 decimal places

    return jsonify(final_result)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
