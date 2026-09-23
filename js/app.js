let marineChartInstance = null;

        function getCardinalDirection(angle) {
          const directions = ['Kuzey (N)', 'Kuzeydoğu (NE)', 'Doğu (E)', 'Güneydoğu (SE)', 'Güney (S)', 'Güneybatı (SW)', 'Batı (W)', 'Kuzeybatı (NW)'];
          return directions[Math.round(angle / 45) % 8];
        }

        async function fetchMarineData(spotKey) {
          try {
            const res = await fetch(`/api/marine/forecast?spot=${encodeURIComponent(spotKey)}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            document.getElementById('lbl-spot-title').innerText = data.spotName.toUpperCase();
            document.getElementById('val-wave-height').innerText = Number(data.waveHeight).toFixed(2);
            document.getElementById('val-wave-period').innerText = Number(data.wavePeriod).toFixed(1) + ' s';
            document.getElementById('val-wind-wave').innerText = Number(data.windWaveHeight).toFixed(2) + ' m';
            document.getElementById('val-wave-dir').innerText = data.waveDirection + '°';
            document.getElementById('val-wave-cardinal').innerText = getCardinalDirection(data.waveDirection);
            document.getElementById('val-coords').innerText = `${data.latitude.toFixed(2)}° / ${data.longitude.toFixed(2)}°`;
            document.getElementById('txt-condition').innerText = data.condition;
            document.getElementById('txt-marine-advice').innerText = data.activityAdvice;

            const badge = document.getElementById('box-condition-badge');
            if (data.conditionColor === 'emerald') {
              badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-emerald-100 text-emerald-800 border-emerald-300';
            } else if (data.conditionColor === 'teal') {
              badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-teal-100 text-teal-800 border-teal-300';
            } else if (data.conditionColor === 'amber') {
              badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-amber-100 text-amber-800 border-amber-300';
            } else {
              badge.className = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border shadow-2xs bg-rose-100 text-rose-800 border-rose-300';
            }

            renderMarineChart(data.hourly);
          } catch(err) {
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
            return `${d} ${h}`;
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
