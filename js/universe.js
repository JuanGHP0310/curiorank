
async function loadData() {
  const res = await fetch('./data/universe_data.json');
  return await res.json();
}
function formatNumber(x) {
  if (x === null || x === undefined) return '—';
  const units = [
    { v: 1e24, s: 'Y' },
    { v: 1e21, s: 'Z' },
    { v: 1e18, s: 'E' },
    { v: 1e15, s: 'P' },
    { v: 1e12, s: 'T' },
    { v: 1e9,  s: 'G' },
    { v: 1e6,  s: 'M' },
    { v: 1e3,  s: 'k' },
  ];
  for (const u of units) {
    if (Math.abs(x) >= u.v) return (x / u.v).toFixed(2).replace(/\.00$/, '') + ' ' + u.s;
  }
  return x.toLocaleString('es-ES');
}
let DATA = [], score = 0, record = 0, currentA = null, currentB = null, lock = false;
function pickTwo() {
  const a = Math.floor(Math.random() * DATA.length);
  let b = Math.floor(Math.random() * DATA.length);
  while (b === a) b = Math.floor(Math.random() * DATA.length);
  return [DATA[a], DATA[b]];
}
function setCard(el, item) {
  el.querySelector('.title').textContent = item.name;
  el.querySelector('.about').textContent = item.about || '';
  el.dataset.value = item.value;
  el.querySelector('.value').textContent = '¿?';
  el.classList.remove('correct', 'wrong', 'revealed');
}
function revealCard(el) {
  el.querySelector('.value').textContent = formatNumber(Number(el.dataset.value));
  el.classList.add('revealed');
}
function updateScoreboard() {
  document.getElementById('score').textContent = score;
  document.getElementById('record').textContent = record;
}
function enableChoices(enable) {
  document.querySelectorAll('.choice').forEach(ch => {
    ch.disabled = !enable;
    ch.classList.toggle('disabled', !enable);
  });
}
function newRound() {
  const [a, b] = pickTwo();
  currentA = a; currentB = b;
  setCard(document.getElementById('cardA'), a);
  setCard(document.getElementById('cardB'), b);
  enableChoices(true);
  document.getElementById('nextBtn').classList.add('hidden');
  document.getElementById('resetBtn').classList.add('hidden');
  document.getElementById('hint').textContent = "Elija la opción con MÁS cantidad";
  lock = false;
}
function handleChoice(side) {
  if (lock) return;
  lock = true;
  enableChoices(false);
  const left = Number(currentA.value);
  const right = Number(currentB.value);
  const winner = left === right ? 'tie' : (left > right ? 'A' : 'B');
  const cardA = document.getElementById('cardA');
  const cardB = document.getElementById('cardB');
  revealCard(cardA);
  revealCard(cardB);
  if (winner === 'tie' || winner === side) {
    document.getElementById('hint').textContent = "¡Correcto!";
    document.getElementById('nextBtn').classList.remove('hidden');
    score += 1;
    if (score > record) {
      record = score;
      localStorage.setItem('curiorank_universe_record', String(record));
    }
    updateScoreboard();
    document.getElementById('card' + side).classList.add('correct');
  } else {
    document.getElementById('hint').textContent = "¡Fallaste!";
    document.getElementById('resetBtn').classList.remove('hidden');
    document.getElementById('card' + side).classList.add('wrong');
  }
}
async function init() {
  DATA = await loadData();
  record = Number(localStorage.getItem('curiorank_universe_record') || 0);
  score = 0;
  updateScoreboard();
  newRound();
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('moreA').addEventListener('click', () => handleChoice('A'));
  document.getElementById('moreB').addEventListener('click', () => handleChoice('B'));
  document.getElementById('nextBtn').addEventListener('click', newRound);
  document.getElementById('resetBtn').addEventListener('click', () => { score = 0; updateScoreboard(); newRound(); });
  init();
});
