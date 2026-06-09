"""
IPL Match Winner Predictor - Random Forest Model Trainer
Run this once to generate model.pkl and stats.json before starting the app.
Usage: python train_model.py
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import pickle, json, os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, 'ipl_full_dataset.csv')

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"  {len(df)} matches loaded | columns: {list(df.columns)}")

# ---- Encoders ----
le_team = LabelEncoder()
le_venue = LabelEncoder()
le_decision = LabelEncoder()
le_winner = LabelEncoder()

all_teams = sorted(set(df['team1'].tolist() + df['team2'].tolist()))
all_venues = sorted(df['venue'].unique().tolist())

le_team.fit(all_teams)
le_venue.fit(all_venues)
le_decision.fit(['bat', 'field'])
le_winner.fit(all_teams)

df['team1_enc']         = le_team.transform(df['team1'])
df['team2_enc']         = le_team.transform(df['team2'])
df['venue_enc']         = le_venue.transform(df['venue'])
df['toss_winner_enc']   = le_team.transform(df['toss_winner'])
df['toss_decision_enc'] = le_decision.transform(df['toss_decision'])
df['winner_enc']        = le_winner.transform(df['winner'])

FEATURES = [
    'team1_enc', 'team2_enc', 'venue_enc', 'toss_winner_enc', 'toss_decision_enc',
    'team1_avg_score', 'team2_avg_score', 'team1_win_rate', 'team2_win_rate',
    'h2h_team1_wins', 'h2h_team2_wins',
    'team1_key_player_fit', 'team2_key_player_fit', 'home_advantage'
]

X = df[FEATURES]
y = df['winner_enc']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest (200 trees, depth=12)...")
rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"  ✅ Test Accuracy: {acc*100:.2f}%")

# ---- Save model and encoders ----
for name, obj in [('model', rf), ('le_team', le_team), ('le_venue', le_venue),
                   ('le_decision', le_decision), ('le_winner', le_winner)]:
    with open(os.path.join(BASE, f'{name}.pkl'), 'wb') as f:
        pickle.dump(obj, f)
    print(f"  Saved {name}.pkl")

# ---- Stats for frontend ----
team_stats = {}
for t in all_teams:
    t1m = df[df['team1'] == t]
    t2m = df[df['team2'] == t]
    avg_score = t1m['team1_avg_score'].mean() if len(t1m) else (t2m['team2_avg_score'].mean() if len(t2m) else 160)
    wins = int(df[df['winner'] == t].shape[0])
    matches = int(df[(df['team1'] == t) | (df['team2'] == t)].shape[0])
    team_stats[t] = {"avg_score": round(float(avg_score), 1), "wins": wins, "matches": matches}

stats = {
    "accuracy": round(acc * 100, 2),
    "total_matches": len(df),
    "teams": all_teams,
    "venues": all_venues,
    "toss_decisions": ["bat", "field"],
    "seasons": sorted(df['season'].unique().tolist()),
    "team_win_rates": {t: round(df[df['winner']==t].shape[0]/max(df[(df['team1']==t)|(df['team2']==t)].shape[0],1)*100,1) for t in all_teams},
    "feature_importance": dict(zip(FEATURES, rf.feature_importances_.tolist())),
    "team_stats": team_stats
}
with open(os.path.join(BASE, 'stats.json'), 'w') as f:
    json.dump(stats, f, indent=2)
print("  Saved stats.json")
print("\n🎉 Training complete! Run: python app.py")
