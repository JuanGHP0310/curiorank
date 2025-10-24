
const i18n = {
  es: {
    subtitle: "Comparaciones visuales interactivas con datos reales.",
    prev: "Anterior", next: "Siguiente", streak: "Racha", best: "Récord",
    choose: "Elige una opción para revelar el resultado.",
    tie: "Empate", correct: "Correcto", wrong: "Fallo", source: "Fuente",
    cookie: "Usamos cookies para analítica y anuncios. ¿Aceptar?"
  },
  en: {
    subtitle: "Interactive visual comparisons with real data.",
    prev: "Previous", next: "Next", streak: "Streak", best: "Best",
    choose: "Pick one to reveal the result.",
    tie: "Tie", correct: "Correct", wrong: "Wrong", source: "Source",
    cookie: "We use cookies for analytics and ads. Accept?"
  }
};

const state = { data: [], i: 0, locked: false, streak: 0, best: 0, lang: localStorage.getItem("crk.lang") || "es" };
const el = {
  subtitle: document.getElementById("subtitle"),
  lang: document.getElementById("lang"),
  cat: document.getElementById("cat"),
  title: document.getElementById("title"),
  summary: document.getElementById("summary"),
  msg: document.getElementById("msg"),
  src: document.getElementById("src"),
  left: document.getElementById("left"),
  right: document.getElementById("right"),
  imgL: document.getElementById("imgL"),
  imgR: document.getElementById("imgR"),
  capL: document.getElementById("capL"),
  capR: document.getElementById("capR"),
  revL: document.getElementById("revL"),
  revR: document.getElementById("revR"),
  streak: document.getElementById("streak"),
  best: document.getElementById("best"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  cookieBar: document.getElementById("cookiebar"),
  cookieAccept: document.getElementById("acceptCookies"),
  cookieText: document.getElementById("cookieText"),
};

// --- audio (embedded tiny wavs base64) ---
const clickAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAgAAAAAA=="); // tiny silent-ish tick
const goodAudio  = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAgAAAAAA==");
const badAudio   = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10 IBAAAAABAAEAESsAACJWAAACABYAAAAgAAAAAA==".replace(/\s+/g,''));

function beep(type) {
  try {
    (type==="good"?goodAudio:(type==="bad"?badAudio:clickAudio)).currentTime = 0;
    (type==="good"?goodAudio:(type==="bad"?badAudio:clickAudio)).play();
  } catch {}
}

function t(key){ return i18n[state.lang][key]; }

function applyLang(){
  el.lang.value = state.lang;
  el.subtitle.textContent = t("subtitle");
  document.querySelectorAll("[data-i18n='prev']").forEach(n=> n.textContent = t("prev"));
  document.querySelectorAll("[data-i18n='next']").forEach(n=> n.textContent = t("next"));
  document.querySelectorAll("[data-i18n='streak']").forEach(n=> n.textContent = t("streak"));
  document.querySelectorAll("[data-i18n='best']").forEach(n=> n.textContent = t("best"));
  el.msg.textContent = t("choose");
  el.cookieText.textContent = t("cookie");
  el.src.textContent = t("source");
}

function cookieInit(){
  const ok = localStorage.getItem("crk.cookies");
  if(!ok){ setTimeout(()=> el.cookieBar.classList.add("show"), 500); }
  el.cookieAccept.addEventListener("click", ()=>{
    localStorage.setItem("crk.cookies","1");
    el.cookieBar.classList.remove("show");
  });
}

function fallbackImg(imgEl){
  imgEl.onerror = null;
  imgEl.src = "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop";
  imgEl.referrerPolicy = "no-referrer";
}

function fmt(v,u){
  if (typeof v === "number"){
    if (Math.abs(v) >= 1e9) return (v/1e9).toFixed(2)+" B "+(u||"");
    if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(2)+" M "+(u||"");
    if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(2)+" k "+(u||"");
    return v+" "+(u||"");
  }
  return v+(u?(" "+u):"");
}

function setTile(imgEl, capEl, item){
  imgEl.src = item.img;
  imgEl.alt = item.name;
  imgEl.referrerPolicy = "no-referrer";
  imgEl.onerror = ()=> fallbackImg(imgEl);
  capEl.textContent = item.name;
}

function show(i){
  const it = state.data[i];
  state.locked = false;
  el.left.disabled = false;
  el.right.disabled = false;
  el.revL.className = "reveal";
  el.revR.className = "reveal";
  el.msg.textContent = t("choose");
  el.cat.textContent = it.category;
  el.title.textContent = it.title;
  setTile(el.imgL, el.capL, it.items[0]);
  setTile(el.imgR, el.capR, it.items[1]);
  el.summary.textContent = it.summary || "";
  el.src.href = it.source || "#";
}

function reveal(side){
  if(state.locked) return;
  const it = state.data[state.i];
  const A = it.items[0];
  const B = it.items[1];
  const winner = A.value === B.value ? null : (A.value > B.value ? 0 : 1);
  const loser = winner===0?1:0;
  const pick = side;

  state.locked = true;
  el.left.disabled = true;
  el.right.disabled = true;

  if (winner === null){
    el.revL.classList.add("ok");
    el.revR.classList.add("ok");
    el.msg.textContent = `${t("tie")}: ${A.name} = ${fmt(A.value, A.unit)} · ${B.name} = ${fmt(B.value, B.unit)}`;
    beep("click");
  } else {
    if (pick === winner){
      state.streak += 1;
      el.msg.textContent = `${t("correct")}: ${it.items[winner].name} (${fmt(it.items[winner].value, it.items[winner].unit)}) > ${it.items[loser].name} (${fmt(it.items[loser].value, it.items[loser].unit)})`;
      if (winner===0){ el.revL.classList.add("ok"); el.revR.classList.add("bad"); }
      else { el.revR.classList.add("ok"); el.revL.classList.add("bad"); }
      beep("good");
    } else {
      state.streak = 0;
      el.msg.textContent = `${t("wrong")}: ${it.items[winner].name} (${fmt(it.items[winner].value, it.items[winner].unit)})`;
      if (winner===0){ el.revL.classList.add("ok"); el.revR.classList.add("bad"); }
      else { el.revR.classList.add("ok"); el.revL.classList.add("bad"); }
      beep("bad");
    }
  }
  if(state.streak > (state.best||0)){ state.best = state.streak; localStorage.setItem("crk.best", String(state.best)); }
  el.streak.textContent = state.streak;
  el.best.textContent = state.best;
}

async function loadData(){
  const file = state.lang === "en" ? "data_en.json" : "data_es.json";
  const res = await fetch("data/" + file + "?nocache=" + Date.now());
  const json = await res.json();
  state.data = json.items;
  // shuffle for variety
  state.data.sort(()=> Math.random() - 0.5);
  state.i = 0;
}

async function init(){
  cookieInit();
  state.best = Number(localStorage.getItem("crk.best")||0);
  el.best.textContent = state.best;
  applyLang();
  await loadData();
  show(0);
}

el.left.addEventListener("click", ()=> { beep("click"); reveal(0); });
el.right.addEventListener("click", ()=> { beep("click"); reveal(1); });
el.btnNext.addEventListener("click", ()=>{ beep("click"); state.i = (state.i+1) % state.data.length; show(state.i); });
el.btnPrev.addEventListener("click", ()=>{ beep("click"); state.i = (state.i-1+state.data.length) % state.data.length; show(state.i); });
el.lang.addEventListener("change", async (e)=>{
  state.lang = e.target.value;
  localStorage.setItem("crk.lang", state.lang);
  applyLang();
  await loadData();
  show(0);
});

init();
