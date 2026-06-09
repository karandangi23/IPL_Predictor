from flask import Flask, request, jsonify, send_from_directory
import pickle, json, numpy as np, os

app = Flask(__name__, static_folder='static', static_url_path='')

BASE = os.path.dirname(__file__)

with open(f'{BASE}/model.pkl','rb') as f: model = pickle.load(f)
with open(f'{BASE}/le_team.pkl','rb') as f: le_team = pickle.load(f)
with open(f'{BASE}/le_venue.pkl','rb') as f: le_venue = pickle.load(f)
with open(f'{BASE}/le_decision.pkl','rb') as f: le_decision = pickle.load(f)
with open(f'{BASE}/le_winner.pkl','rb') as f: le_winner = pickle.load(f)
with open(f'{BASE}/stats.json','r') as f: stats = json.load(f)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/stats')
def get_stats():
    return jsonify(stats)

@app.route('/api/predict', methods=['POST'])
def predict():
    d = request.json
    try:
        t1 = d['team1']; t2 = d['team2']
        venue = d['venue']
        toss_winner = d['toss_winner']
        toss_decision = d['toss_decision']
        t1_avg = float(d.get('team1_avg_score', 165))
        t2_avg = float(d.get('team2_avg_score', 165))
        t1_wr = float(d.get('team1_win_rate', 0.5))
        t2_wr = float(d.get('team2_win_rate', 0.5))
        h2h1 = int(d.get('h2h_team1_wins', 3))
        h2h2 = int(d.get('h2h_team2_wins', 3))
        t1_fit = int(d.get('team1_key_player_fit', 1))
        t2_fit = int(d.get('team2_key_player_fit', 1))
        home_adv = int(d.get('home_advantage', 0))

        features = np.array([[
            le_team.transform([t1])[0],
            le_team.transform([t2])[0],
            le_venue.transform([venue])[0],
            le_team.transform([toss_winner])[0],
            le_decision.transform([toss_decision])[0],
            t1_avg, t2_avg, t1_wr, t2_wr,
            h2h1, h2h2, t1_fit, t2_fit, home_adv
        ]])

        proba = model.predict_proba(features)[0]
        pred_idx = np.argmax(proba)
        winner = le_winner.inverse_transform([pred_idx])[0]

        # Get confidence for team1 and team2
        team1_idx = list(le_winner.classes_).index(t1) if t1 in le_winner.classes_ else -1
        team2_idx = list(le_winner.classes_).index(t2) if t2 in le_winner.classes_ else -1
        t1_conf = round(float(proba[team1_idx])*100, 1) if team1_idx >= 0 else 0
        t2_conf = round(float(proba[team2_idx])*100, 1) if team2_idx >= 0 else 0

        # Normalize to sum 100
        total = t1_conf + t2_conf
        if total > 0:
            t1_conf = round(t1_conf/total*100, 1)
            t2_conf = round(100 - t1_conf, 1)

        return jsonify({
            "winner": winner,
            "team1_confidence": t1_conf,
            "team2_confidence": t2_conf,
            "confidence": max(t1_conf, t2_conf)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
