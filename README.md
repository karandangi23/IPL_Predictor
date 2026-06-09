# 🏏 IPL Match Winner Predictor
**Random Forest ML Model · White / Olive Green / Brown Theme**

---

## 📁 Project Structure
```
ipl_app/
├── app.py                 ← Flask backend (API + serve frontend)
├── train_model.py         ← Train the RF model (run once)
├── requirements.txt       ← Python dependencies
├── ipl_full_dataset.csv   ← Dataset (1,099 IPL matches)
├── model.pkl              ← Trained Random Forest (auto-generated)
├── le_team.pkl            ← Label encoder - teams
├── le_venue.pkl           ← Label encoder - venues
├── le_decision.pkl        ← Label encoder - toss decision
├── le_winner.pkl          ← Label encoder - winner
├── stats.json             ← Pre-computed stats for frontend
└── static/
    ├── index.html         ← Main webpage
    ├── style.css          ← White/olive-green/brown theme
    └── app.js             ← Frontend logic
```

---

## ⚙️ Setup & Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the model (run once)
```bash
python train_model.py
```
This generates `model.pkl`, encoder `.pkl` files, and `stats.json`.

### 3. Start the Flask server
```bash
python app.py
```

### 4. Open in browser
```
http://localhost:5000
```

---

## 🌲 Model Details

| Property         | Value                         |
|-----------------|-------------------------------|
| Algorithm       | Random Forest Classifier      |
| Trees           | 200 (n_estimators=200)        |
| Max Depth       | 12                            |
| Features        | 14 (see below)                |
| Training data   | 80% of 1,099 matches          |
| Test Accuracy   | ~71%                          |
| Seasons covered | 2008–2024 (17 seasons)        |

### Features Used
1. Team 1 identity
2. Team 2 identity
3. Venue
4. Toss winner
5. Toss decision (bat/field)
6. Team 1 average score
7. Team 2 average score
8. Team 1 historical win rate
9. Team 2 historical win rate
10. Head-to-head wins (Team 1)
11. Head-to-head wins (Team 2)
12. Team 1 key player fitness
13. Team 2 key player fitness
14. Home advantage

---

## 🌐 API Endpoints

| Method | Endpoint       | Description               |
|--------|---------------|---------------------------|
| GET    | `/`           | Serves the frontend       |
| GET    | `/api/stats`  | Dataset & model stats     |
| POST   | `/api/predict`| Predict match winner      |

### POST /api/predict - Request Body
```json
{
  "team1": "Chennai Super Kings",
  "team2": "Mumbai Indians",
  "venue": "Wankhede Stadium, Mumbai",
  "toss_winner": "Mumbai Indians",
  "toss_decision": "bat",
  "team1_avg_score": 175,
  "team2_avg_score": 180,
  "team1_win_rate": 0.64,
  "team2_win_rate": 0.60,
  "h2h_team1_wins": 12,
  "h2h_team2_wins": 10,
  "team1_key_player_fit": 1,
  "team2_key_player_fit": 1,
  "home_advantage": 0
}
```

### Response
```json
{
  "winner": "Mumbai Indians",
  "team1_confidence": 38.5,
  "team2_confidence": 61.5,
  "confidence": 61.5
}
```

---

## 🎨 Theme
White · Olive Green (`#6B7C3A`) · Brown (`#7C4F2A`)

Built with pure HTML/CSS/JS frontend + Flask backend. No external AI API used.
