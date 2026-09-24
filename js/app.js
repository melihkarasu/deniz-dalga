let marineChartInstance = null;

const MARINE_SPOTS = {
  'alacati': { name: 'Alaçatı Sörf Koyu (İzmir)', lat: 38.25, lon: 26.38 },
  'bodrum': { name: 'Bodrum Yalıkavak (Muğla)', lat: 37.10, lon: 27.29 },
  'kas': { name: 'Kaş / Kaputaş (Antalya)', lat: 36.20, lon: 29.64 },
  'bozcaada': { name: 'Bozcaada Ayazma (Çanakkale)', lat: 39.81, lon: 26.03 },
  'sile': { name: 'Şile Kıyıları (Karadeniz)', lat: 41.18, lon: 29.61 },
  'antalya': { name: 'Antalya Konyaaltı Körfezi', lat: 36.88, lon: 30.70 },
  'datca': { name: 'Datça Palamutbükü', lat: 36.67, lon: 27.50 },
  'cesme': { name: 'Çeşme Ilıca Plajı', lat: 38.31, lon: 26.35 },
  'fethiye': { name: 'Fethiye Ölüdeniz', lat: 36.55, lon: 29.12 }
};

function getCardinalDirection(angle) {
  const directions = ['Kuzey (N)', 'Kuzeydoğu (NE)', 'Doğu (E)', 'Güneydoğu (SE)', 'Güney (S)', 'Güneybatı (SW)', 'Batı (W)', 'Kuzeybatı (NW)'];
  return directions[Math.round(angle / 45) % 8];
}

async function fetchMarineData(spotKey) {
  try {
    const spot = MARINE_SPOTS[spotKey] || MARINE_SPOTS['alacati'];
    const lat = spot.lat;
    const lon = spot.lon;
    const spotName = spot.name;

    const url = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + lat + '&longitude=' + lon + '&current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction&hourly=wave_height,wave_period&forecast_days=2';
    
    const res = await fetch(url, { headers: { 'User-Agent': 'MaviRota/1.0' } });
    if (!res.ok) throw new Error('Open-Meteo Marine API yanıt vermedi');
    const data = await res.json();

    const cur = data.current || {};
    const waveHeight = cur.wave_height !== undefined ? cur.wave_height : 0.4;
    const wavePeriod = cur.wave_period !== undefined ? cur.wave_period : 3.2;
    const waveDir = cur.wave_direction !== undefined ? cur.wave_direction : 180;
    const windWaveHeight = cur.wind_wave_height !== undefined ? cur.wind_wave_height : 0.1;

    // Yüzme ve sörf durumu değerlendirmesi
    let condition = 'Sakin & Durgun';
    let conditionColor = 'emerald';
    let activityAdvice = 'Deniz çarşaf gibi. Yüzme, kano, SUP ve aile aktiviteleri için son derece ideal.';

    if (waveHeight >= 2.0) {
      condition = 'Çok Dalgalı / Fırtınalı';
      conditionColor = 'rose';
      activityAdvice = 'Dikkat! Denize girmek ve yüzmek tehlikelidir. Yalnızca profesyonel sörfçüler için uygundur.';
    } else if (waveHeight >= 1.2) {
      condition = 'Orta Dalgalı (Sörf Uygun)';
      conditionColor = 'amber';
      activityAdvice = 'Rüzgar sörfü, kitesurf ve dalga sörfü için harika koşullar. Acemi yüzücüler dikkatli olmalıdır.';
    } else if (waveHeight >= 0.6) {
      condition = 'Hafif Çalkantılı';
      conditionColor = 'teal';
      activityAdvice = 'Hafif kıpırtılı deniz. Yüzme ve yelkenli seyri için keyifli koşullar.';
    }

    document.getElementById('lbl-spot-title').innerText = spotName.toUpperCase();
    document.getElementById('val-wave-height').innerText = Number(waveHeight).toFixed(2);
    document.getElementById('val-wave-period').innerText = Number(wavePeriod).toFixed(1) + ' s';
    document.getElementById('val-wind-wave').innerText = Number(windWaveHeight).toFixed(2) + ' m';
    document.getElementById('val-wave-dir').innerText = waveDir + '°';
    document.getElementById('val-wave-cardinal').innerText = getCardinalDirection(waveDir);
    document.getElementById('val-coords').innerText = lat.toFixed(2) + '° / ' + lon.toFixed(2) + '°';
    document.getElementById('txt-condition').innerText = condition;
    document.getElementById('txt-marine-advice').innerText = activityAdvice;

    const badge = document.getElementById('box-condition-badge');
    if (conditionColor === 'emerald') {
      badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (conditionColor === 'teal') {
      badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-teal-100 text-teal-800 border-teal-300';
    } else if (conditionColor === 'amber') {
      badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-amber-100 text-amber-800 border-amber-300';
    } else {
      badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-rose-100 text-rose-800 border-rose-300';
    }

    renderMarineChart(data.hourly);
  } catch(err) {
    console.error('fetchMarineData error:', err);
    alert('Deniz telemetrisi alınamadı: ' + err.message);
  }
}

function onSpotChange() {
  const val = document.getElementById('select-spot').value;
  fetchMarineData(val);
}

function setSpot(key) {
  document.getElementById('select-spot').value = key;
  fetchMarineData(key);
}

function refreshMarineData() {
  const val = document.getElementById('select-spot').value;
  fetchMarineData(val);
}

function renderMarineChart(hourly) {
  const times = (hourly.time || []).slice(0, 48).map(t => {
    const parts = t.split('T');
    const d = parts[0].split('-').slice(1).join('/');
    const h = parts[1] || '00:00';
    return d + ' ' + h;
  });
  const heights = (hourly.wave_height || []).slice(0, 48);

  const ctx = document.getElementById('chart-marine').getContext('2d');
  if (marineChartInstance) marineChartInstance.destroy();

  marineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: times,
      datasets: [
        {
          label: 'Dalga Yüksekliği (m)',
          data: heights,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 10 } } },
        y: { grid: { color: '#f0f2f5' }, title: { display: true, text: 'Metre (m)', font: { size: 11 } } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMarineData('alacati');
});

// Window globals for inline onclicks
window.onSpotChange = onSpotChange;
window.setSpot = setSpot;
window.refreshMarineData = refreshMarineData;