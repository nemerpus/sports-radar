import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

const app = express(), port = Number(process.env.PORT || 3000);
const cache = { value: null, expires: 0 }, key = process.env.THESPORTSDB_API_KEY || '123';
app.disable('x-powered-by');
app.use(helmet({ crossOriginOpenerPolicy: false, originAgentCluster: false, contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'https:'], fontSrc: ["'self'"], connectSrc: ["'self'"], upgradeInsecureRequests: null } } }));
app.use(compression()); app.use(express.json({ limit: '32kb' }));
const date = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
const sport = (event) => ({ Soccer: 'Fútbol', Motorsport: 'Motor', 'Ice Hockey': 'NHL', 'American Football': 'NFL', Basketball: 'Baloncesto', Tennis: 'Tenis', Cycling: 'Ciclismo', Rugby: 'Rugby', MMA: 'MMA' })[event.strSport] || (event.strLeague === 'NFL' ? 'NFL' : event.strSport || 'Deporte');
const status = (event, now) => { const start = new Date(event.strTimestamp || event.dateEvent + 'T' + (event.strTime || '00:00:00') + 'Z'); if (/live|in progress|half time|1st|2nd|3rd|4th/i.test(event.strStatus || '') || (start <= now && now - start < 10800000)) return 'live'; return ['Sat', 'Sun'].includes(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' }).format(start)) ? 'weekend' : 'upcoming'; };
async function realEvents() {
  const now = new Date(), days = Array.from({ length: 7 }, (_, i) => date(new Date(now.getTime() + i * 86400000)));
  const responses = await Promise.all(days.map(async (day) => { const response = await fetch('https://www.thesportsdb.com/api/v1/json/' + encodeURIComponent(key) + '/eventsday.php?d=' + day, { signal: AbortSignal.timeout(8000) }); if (!response.ok) throw new Error('provider_' + response.status); return response.json(); }));
  const events = responses.flatMap((data) => data.events || []).map((event) => ({ id: 'tsdb-' + event.idEvent, sport: sport(event), competition: event.strLeague || 'Competición', title: event.strEvent || event.strHomeTeam + ' — ' + event.strAwayTeam, start: event.strTimestamp || event.dateEvent + 'T' + (event.strTime || '00:00:00') + 'Z', status: status(event, now), broadcaster: event.strTVStation || 'Canal no confirmado', context: event.strStatus || event.strVenue || 'Consulta la fuente oficial', image: event.strThumb || event.strHomeTeamBadge || event.strLeagueBadge || null, source: 'TheSportsDB' })).filter((event) => new Date(event.start).getTime() >= now.getTime() - 10800000);
  return { meta: { mode: 'live', source: 'TheSportsDB', fetched_at: new Date().toISOString() }, events };
}
app.get('/api/health', (_, response) => response.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/events', async (request, response) => { try { if (!cache.value || Date.now() >= cache.expires) { cache.value = await realEvents(); cache.expires = Date.now() + 300000; } const selected = String(request.query.sport || '').toLowerCase(); const data = selected ? { ...cache.value, events: cache.value.events.filter((event) => event.sport.toLowerCase() === selected) } : cache.value; response.set('Cache-Control', 'public,max-age=60,stale-while-revalidate=240').json(data); } catch { response.status(503).json({ error: 'events_unavailable', message: 'La fuente deportiva no está disponible temporalmente.' }); } });
app.use(express.static('public', { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0, extensions: ['html'] }));
app.get('/{*splat}', (_, response) => response.sendFile(process.cwd() + '/public/index.html'));
app.listen(port, '0.0.0.0', () => console.log('Sports Radar :' + port));
