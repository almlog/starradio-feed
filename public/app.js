/**
 * スタラジ Web Player
 * episodes.json を読み込んでエピソード一覧+音声プレーヤーを描画
 */

(function () {
  const BASE = '';
  const container = document.getElementById('episodes');

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00+09:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return d.getFullYear() + '年' +
      (d.getMonth() + 1) + '月' +
      d.getDate() + '日(' +
      days[d.getDay()] + ')';
  }

  function createEpisodeCard(ep) {
    const card = document.createElement('article');
    card.className = 'episode-card';

    const modeLabel = ep.broadcastMode === 'weekly' ? '増刊号' : '日刊';
    const modeClass = 'mode-' + ep.broadcastMode;

    const castHtml = (ep.cast || [])
      .map(function (c) { return '<span class="cast-chip">' + c + '</span>'; })
      .join('');

    const segmentsHtml = (ep.segments || [])
      .map(function (seg) {
        return '<div class="segment-item" data-time="' + seg.startSec + '">' +
          '<span class="segment-time">' + formatTime(seg.startSec) + '</span>' +
          seg.name +
          '</div>';
      })
      .join('');

    const audioId = 'audio-' + ep.id;

    card.innerHTML =
      '<div class="episode-header">' +
        '<div class="episode-header-left">' +
          '<span class="episode-date">' + formatDate(ep.date) + '</span>' +
          '<span class="mode-badge ' + modeClass + '">' + modeLabel + '</span>' +
        '</div>' +
        '<span class="episode-duration">' + ep.durationFormatted + '</span>' +
      '</div>' +
      '<h2 class="episode-title">' + ep.title + '</h2>' +
      '<div class="episode-cast">' + castHtml + '</div>' +
      '<div class="episode-segments">' + segmentsHtml + '</div>' +
      '<div class="audio-wrapper">' +
        '<audio id="' + audioId + '" controls preload="none">' +
          '<source src="' + BASE + 'audio/' + ep.audioFile + '" type="audio/mpeg">' +
        '</audio>' +
      '</div>';

    // セグメントクリックでシーク
    var segmentItems = card.querySelectorAll('.segment-item');
    for (var i = 0; i < segmentItems.length; i++) {
      segmentItems[i].addEventListener('click', (function (id) {
        return function (e) {
          var time = parseFloat(e.currentTarget.getAttribute('data-time'));
          var audio = document.getElementById(id);
          if (audio) {
            audio.currentTime = time;
            audio.play();
          }
        };
      })(audioId));
    }

    return card;
  }

  function renderEpisodes(episodes) {
    container.innerHTML = '';

    if (episodes.length === 0) {
      container.innerHTML = '<p class="empty">エピソードはまだありません</p>';
      return;
    }

    episodes.forEach(function (ep, index) {
      var card = createEpisodeCard(ep);
      card.style.animationDelay = (index * 0.06) + 's';
      container.appendChild(card);
    });
  }

  fetch(BASE + 'episodes.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load episodes.json');
      return res.json();
    })
    .then(function (episodes) {
      renderEpisodes(episodes);
    })
    .catch(function (err) {
      container.innerHTML = '<p class="empty">読み込みに失敗しました: ' + err.message + '</p>';
    });
})();
