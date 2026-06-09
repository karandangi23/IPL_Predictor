/* ========================
   IPL Predictor Frontend JS
   ======================== */

let statsData = null;
let tossDecision = 'bat';
let homeAdvantage = 1;
let t1Fit = 1, t2Fit = 1;

const teamEmojis = {
  'Chennai Super Kings': '🦁',
  'Mumbai Indians': '🔵',
  'Kolkata Knight Riders': '💜',
  'Royal Challengers Bangalore': '🔴',
  'Sunrisers Hyderabad': '🧡',
  'Delhi Capitals': '💙',
  'Delhi Daredevils': '💙',
  'Rajasthan Royals': '🩷',
  'Kings XI Punjab': '🔴',
  'Punjab Kings': '🔴',
  'Deccan Chargers': '⚡',
  'Kochi Tuskers Kerala': '🐘',
  'Pune Warriors India': '⚔️',
  'Gujarat Lions': '🦁',
  'Rising Pune Supergiant': '🌟',
  'Rising Pune Supergiants': '🌟',
  'Gujarat Titans': '⚡',
  'Lucknow Super Giants': '🟢',
};

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    statsData = await res.json();
    populateDropdowns();
    populateStatsSection();
    populateTeamsSection();
  } catch (e) {
    console.error('Failed to load stats', e);
  }
}

function populateDropdowns() {
  const { teams, venues } = statsData;

  const t1 = document.getElementById('team1');
  const t2 = document.getElementById('team2');
  const toss = document.getElementById('toss_winner');
  const venueEl = document.getElementById('venue');

  teams.forEach(t => {
    [t1, t2, toss].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      sel.appendChild(opt);
    });
  });

  venues.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    venueEl.appendChild(opt);
  });

  // Defaults
  t1.value = 'Chennai Super Kings';
  t2.value = 'Mumbai Indians';
  toss.value = 'Mumbai Indians';
  venueEl.value = venues[0];
}

function syncToss() {
  const t1 = document.getElementById('team1').value;
  const t2 = document.getElementById('team2').value;
  const toss = document.getElementById('toss_winner');
  const current = toss.value;
  toss.innerHTML = '<option value="">Select Team</option>';
  [t1, t2].filter(Boolean).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    toss.appendChild(opt);
  });
  if ([t1, t2].includes(current)) toss.value = current;
}

function setToss(val) {
  tossDecision = val;
  document.getElementById('btn-bat').classList.toggle('active', val === 'bat');
  document.getElementById('btn-field').classList.toggle('active', val === 'field');
}

function setHome(val) {
  homeAdvantage = val;
  document.getElementById('btn-home-t1').classList.toggle('active', val === 1);
  document.getElementById('btn-home-neutral').classList.toggle('active', val === 0);
  document.getElementById('btn-home-t2').classList.toggle('active', val === 2);
}

function setFit(team, val) {
  if (team === 1) {
    t1Fit = val;
    document.getElementById('t1fit-yes').classList.toggle('active', val === 1);
    document.getElementById('t1fit-no').classList.toggle('active', val === 0);
  } else {
    t2Fit = val;
    document.getElementById('t2fit-yes').classList.toggle('active', val === 1);
    document.getElementById('t2fit-no').classList.toggle('active', val === 0);
  }
}

async function predict() {
  const team1 = document.getElementById('team1').value;
  const team2 = document.getElementById('team2').value;
  const venue = document.getElementById('venue').value;
  const toss_winner = document.getElementById('toss_winner').value;

  if (!team1 || !team2 || !venue || !toss_winner) {
    alert('Please fill in all required fields (Teams, Venue, Toss Winner)');
    return;
  }
  if (team1 === team2) { alert('Team 1 and Team 2 cannot be the same!'); return; }

  const btn = document.querySelector('.predict-btn');
  const btnText = document.getElementById('btn-text');
  btn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span> Predicting...';

  // Hide all result panels
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-content').style.display = 'none';
  document.getElementById('result-error').style.display = 'none';

  const payload = {
    team1, team2, venue, toss_winner,
    toss_decision: tossDecision,
    team1_avg_score: document.getElementById('team1_avg_score').value,
    team2_avg_score: document.getElementById('team2_avg_score').value,
    team1_win_rate: (document.getElementById('team1_win_rate').value / 100).toFixed(2),
    team2_win_rate: (document.getElementById('team2_win_rate').value / 100).toFixed(2),
    h2h_team1_wins: document.getElementById('h2h_team1').value,
    h2h_team2_wins: document.getElementById('h2h_team2').value,
    team1_key_player_fit: t1Fit,
    team2_key_player_fit: t2Fit,
    // 1 = team1 home, 0 = neutral, 2 = team2 home → send as: team1=1, neutral=0, team2=-1
    home_advantage: homeAdvantage === 2 ? -1 : homeAdvantage
  };

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showResult(data, team1, team2);
  } catch (e) {
    document.getElementById('result-error').style.display = 'flex';
    document.getElementById('error-msg').textContent = e.message || 'Prediction failed';
  } finally {
    btn.disabled = false;
    btnText.innerHTML = '🔮 Predict Winner';
  }
}

function showResult(data, team1, team2) {
  const el = document.getElementById('result-content');
  el.style.display = 'block';

  document.getElementById('winner-name').textContent =
    (teamEmojis[data.winner] || '🏆') + ' ' + data.winner;

  document.getElementById('conf-t1-name').textContent = team1;
  document.getElementById('conf-t2-name').textContent = team2;
  document.getElementById('conf-t1-val').textContent = `${data.team1_confidence}%`;
  document.getElementById('conf-t2-val').textContent = `${data.team2_confidence}%`;

  // Animate bars (slight delay for animation)
  setTimeout(() => {
    document.getElementById('conf-t1-bar').style.width = data.team1_confidence + '%';
    document.getElementById('conf-t2-bar').style.width = data.team2_confidence + '%';
  }, 100);

  const winner_is_t1 = data.winner === team1;
  document.getElementById('result-details').innerHTML = `
    <p>🏏 <strong>${team1}</strong> win probability: <strong>${data.team1_confidence}%</strong></p>
    <p>🏏 <strong>${team2}</strong> win probability: <strong>${data.team2_confidence}%</strong></p>
    <p>📊 Model confidence: <strong>${data.confidence}%</strong></p>
    <p>${winner_is_t1 ? '✅' : '⚠️'} ${data.winner} predicted to win this match</p>
  `;

  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetResult() {
  document.getElementById('result-content').style.display = 'none';
  document.getElementById('result-placeholder').style.display = 'flex';
  document.getElementById('conf-t1-bar').style.width = '0%';
  document.getElementById('conf-t2-bar').style.width = '0%';
}

function populateStatsSection() {
  document.getElementById('stat-matches').textContent = statsData.total_matches.toLocaleString();
  document.getElementById('stat-teams').textContent = statsData.teams.length;
  document.getElementById('stat-venues').textContent = statsData.venues.length;
  document.getElementById('stat-accuracy').textContent = statsData.accuracy + '%';

  // Feature importance bars
  const featureLabels = {
    team1_enc: 'Team 1 Identity',
    team2_enc: 'Team 2 Identity',
    venue_enc: 'Venue',
    toss_winner_enc: 'Toss Winner',
    toss_decision_enc: 'Toss Decision',
    team1_avg_score: 'Team 1 Avg Score',
    team2_avg_score: 'Team 2 Avg Score',
    team1_win_rate: 'Team 1 Win Rate',
    team2_win_rate: 'Team 2 Win Rate',
    h2h_team1_wins: 'H2H Wins (T1)',
    h2h_team2_wins: 'H2H Wins (T2)',
    team1_key_player_fit: 'Team 1 Player Fit',
    team2_key_player_fit: 'Team 2 Player Fit',
    home_advantage: 'Home Advantage'
  };

  const fi = statsData.feature_importance;
  const sorted = Object.entries(fi).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];

  const container = document.getElementById('feature-bars');
  sorted.forEach(([key, val]) => {
    const pct = ((val / max) * 100).toFixed(1);
    const display = (val * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'feat-row';
    row.innerHTML = `
      <div class="feat-name">${featureLabels[key] || key}</div>
      <div class="feat-bar-wrap">
        <div class="feat-bar" style="width:0%" data-width="${pct}%"></div>
      </div>
      <div class="feat-pct">${display}%</div>
    `;
    container.appendChild(row);
  });

  // Animate bars on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.feat-bar').forEach(b => {
          b.style.width = b.dataset.width;
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(container);
}

function populateTeamsSection() {
  const grid = document.getElementById('teams-grid');
  const ts = statsData.team_stats;

  Object.entries(ts)
    .sort((a, b) => b[1].wins - a[1].wins)
    .forEach(([name, s]) => {
      const wr = s.matches > 0 ? Math.round(s.wins / s.matches * 100) : 0;
      const card = document.createElement('div');
      card.className = 'team-card';
      card.innerHTML = `
        <div class="team-emoji">${teamEmojis[name] || '🏏'}</div>
        <div class="team-name">${name}</div>
        <div class="team-stat-row"><span>Matches</span><span>${s.matches}</span></div>
        <div class="team-stat-row"><span>Wins</span><span>${s.wins}</span></div>
        <div class="team-stat-row"><span>Win Rate</span><span>${wr}%</span></div>
        <div class="win-rate-bar"><div class="win-rate-fill" style="width:${wr}%"></div></div>
      `;
      grid.appendChild(card);
    });
}

// Init
loadStats();