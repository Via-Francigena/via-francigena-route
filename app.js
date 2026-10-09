const dataUrl = 'data/stages.json';
const fmt = (n, unit = ' km') => n == null ? '—' : `${Number(n).toFixed(1)}${unit}`;
const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

function popup(stage) {
  const detailsUrl = `stage.html?id=${encodeURIComponent(stage.id)}`;
  return `<b>${escapeHtml(stage.title)}</b><br>${escapeHtml(stage.date)}<br><a href="${escapeHtml(detailsUrl)}">Open details</a>`;
}

async function start() {
  const response = await fetch(dataUrl);
  const stages = await response.json();
  const walks = stages.filter(stage => !stage.rest);
  document.querySelector('#stage-count').textContent = walks.length;
  document.querySelector('#rest-count').textContent = stages.filter(stage => stage.rest).length;

  const body = document.querySelector('#stages');
  body.innerHTML = stages.map(stage => {
    const distance = stage.distance == null
      ? '—'
      : `${fmt(stage.distance)}<br><small>${fmt(Number(stage.distance) / 1.609344, ' mi')}</small>`;
    return `<tr data-stage-id="${escapeHtml(stage.id)}"><td>${escapeHtml(stage.date)}</td><td><b>${escapeHtml(stage.title)}</b><br><small>${escapeHtml(stage.start)} → ${escapeHtml(stage.end)}</small></td><td>${distance}</td><td>${stage.difficulty == null ? '—' : escapeHtml(stage.difficulty)}</td><td><span class="pill ${stage.rest ? 'rest' : ''}">${stage.rest ? 'Rest day' : 'Stage'}</span></td></tr>`;
  }).join('');

  body.querySelectorAll('tr').forEach(row => row.addEventListener('click', () => {
    const detailsUrl = new URL('stage.html', location.href);
    detailsUrl.searchParams.set('id', row.dataset.stageId);
    location.href = detailsUrl;
  }));

  const map = L.map('map').setView([45.7, 8.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  const points = [];
  stages.forEach((stage, index) => {
    if (stage.lat == null) return;
    points.push([stage.lat, stage.lon]);
    const marker = L.circleMarker([stage.lat, stage.lon], {
      radius: stage.rest ? 9 : (index === 0 || stage.id === '50' ? 12 : 6),
      color: stage.rest ? '#c79227' : index === 0 ? '#26735b' : stage.id === '50' ? '#c45b3c' : '#2d6cdf',
      fillOpacity: .85,
      weight: 2
    }).addTo(map);
    marker.bindPopup(popup(stage));
  });
  if (points.length) map.fitBounds(points, {padding: [25, 25]});
}

start().catch(error => console.error(error));
