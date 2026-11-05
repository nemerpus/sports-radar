const sports = ['Todos', 'Baloncesto', 'Ciclismo', 'Fútbol', 'MMA', 'Motor', 'NFL', 'NHL', 'Rugby', 'Tenis'];
let all = [], active = 'Todos', unavailableReason = '';
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const format = (value, options) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', ...options }).format(new Date(value));
const time = (value) => format(value, { hour: '2-digit', minute: '2-digit' });
const day = (value) => format(value, { weekday: 'short', day: 'numeric', month: 'short' });
function card(event) { const image = /^https:\/\//.test(event.image || '') ? `<img class="event-image" src="${esc(event.image)}" alt="" loading="lazy">` : ''; return `<article class="card">${image}<div class="sport">${esc(event.sport)} · ${esc(event.competition)}</div><h3 class="title">${esc(event.title)}</h3><div class="context">${day(event.start)} · ${time(event.start)}<br>${esc(event.context)}</div><span class="broadcast">${esc(event.broadcaster)}</span></article>`; }
function row(event) { return `<article class="row"><time class="time" datetime="${esc(event.start)}">${time(event.start)}</time><div><h3 class="title">${esc(event.title)}</h3><div class="context">${esc(event.sport)} · ${esc(event.competition)} · ${day(event.start)}</div></div><span class="broadcast">${esc(event.broadcaster)}</span></article>`; }
function empty(message) { return `<p class="empty">${esc(message)}</p>`; }
function render() {
  const events = active === 'Todos' ? all : all.filter((event) => event.sport === active);
  const live = events.filter((event) => event.status === 'live');
  const upcoming = events.filter((event) => event.status === 'upcoming').sort((a, b) => new Date(a.start) - new Date(b.start));
  const weekend = events.filter((event) => event.status === 'weekend').sort((a, b) => new Date(a.start) - new Date(b.start));
  const noData = unavailableReason || `No hay eventos ${active === 'Todos' ? '' : `de ${active} `}en la programación disponible.`;
  $('#live').innerHTML = live.length ? live.map(card).join('') : empty(noData);
  $('#upcoming').innerHTML = upcoming.length ? upcoming.map(row).join('') : empty(noData);
  $('#weekend').innerHTML = weekend.length ? weekend.map(card).join('') : empty(noData);
  $('#liveCount').textContent = live.length ? `${live.length} ahora` : '';
  ['#live', '#upcoming', '#weekend'].forEach((selector) => $(selector).setAttribute('aria-busy', 'false'));
  document.querySelectorAll('.tab').forEach((button) => { const selected = button.dataset.sport === active; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); });
}
function tabs() { sports.forEach((sport) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'tab'; button.dataset.sport = sport; button.textContent = sport; button.setAttribute('aria-pressed', String(sport === active)); button.addEventListener('click', () => { active = sport; render(); }); $('#sports').appendChild(button); }); }
function clock() { const now = new Date(); $('#clock').textContent = format(now, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); $('#clock').dateTime = now.toISOString(); }
async function loadEvents() { try { const response = await fetch('./api/events'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const payload = await response.json(); all = Array.isArray(payload.events) ? payload.events : []; $('#sourceNote').textContent = payload.meta?.source ? `Fuente: ${payload.meta.source} · actualización cada 5 min` : 'Datos actualizados'; } catch { unavailableReason = 'La programación no está disponible en este momento.'; $('#sourceNote').textContent = unavailableReason; } render(); }
tabs(); clock(); setInterval(clock, 30_000); loadEvents();
