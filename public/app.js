/**
 * スタラジ Web Player
 * episodes.json を読み込んでエピソード一覧+音声プレーヤーを描画
 */

(function () {
  var BASE = '';
  var container = document.getElementById('episodes');

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00+09:00');
    var days = ['日', '月', '火', '水', '木', '金', '土'];
    return d.getFullYear() + '年' +
      (d.getMonth() + 1) + '月' +
      d.getDate() + '日(' +
      days[d.getDay()] + ')';
  }

  function createEpisodeCard(ep) {
    var card = document.createElement('article');
    card.className = 'episode-card';

    var modeLabel = ep.broadcastMode === 'weekly' ? '増刊号' : '日刊';
    var modeClass = 'mode-' + ep.broadcastMode;
    var audioId = 'audio-' + ep.id;
    var sourcesId = 'sources-' + ep.id;

    // Cast chips
    var castHtml = (ep.cast || [])
      .map(function (c) { return '<span class="cast-chip">' + c + '</span>'; })
      .join('');

    // Segments (inline)
    var segmentsHtml = (ep.segments || [])
      .map(function (seg) {
        return '<span class="segment-item" data-time="' + seg.startSec + '">' +
          '<span class="segment-time">' + formatTime(seg.startSec) + '</span>' +
          seg.name +
          '</span>';
      })
      .join('');

    // Sources
    var sourcesHtml = '';
    if (ep.sources && ep.sources.length > 0) {
      var sourceItems = ep.sources.map(function (s) {
        return '<div class="source-item">' +
          '<span class="source-name">' + s.source + '</span>' +
          '<span class="source-title">' + s.title + '</span>' +
          '</div>';
      }).join('');

      sourcesHtml =
        '<div class="episode-sources">' +
          '<button class="sources-toggle" data-target="' + sourcesId + '">' +
            '📰 ニュースソース (' + ep.sources.length + '件)' +
          '</button>' +
          '<div class="sources-list" id="' + sourcesId + '">' +
            sourceItems +
          '</div>' +
        '</div>';
    }

    // Script download button
    var scriptBtn = '';
    if (ep.scriptFile) {
      scriptBtn = '<a class="action-btn" href="' + BASE + 'scripts/' + ep.scriptFile +
        '" download>📝 台本DL</a>';
    }

    card.innerHTML =
      '<div class="episode-header">' +
        '<span class="episode-date">' + formatDate(ep.date) +
          '<span class="mode-badge ' + modeClass + '">' + modeLabel + '</span>' +
        '</span>' +
        '<span class="episode-duration">' + ep.durationFormatted + '</span>' +
      '</div>' +
      '<div class="episode-title">' + ep.title + '</div>' +
      '<div class="episode-cast">' + castHtml + '</div>' +
      '<div class="episode-segments">' + segmentsHtml + '</div>' +
      '<audio id="' + audioId + '" controls preload="none">' +
        '<source src="' + BASE + 'audio/' + ep.audioFile + '" type="audio/mpeg">' +
      '</audio>' +
      '<div class="episode-actions">' + scriptBtn + '</div>' +
      sourcesHtml;

    // Segment click → seek
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

    // Sources toggle
    var toggle = card.querySelector('.sources-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var target = document.getElementById(this.getAttribute('data-target'));
        if (target) target.classList.toggle('open');
      });
    }

    return card;
  }

  fetch(BASE + 'episodes.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load episodes.json');
      return res.json();
    })
    .then(function (episodes) {
      container.innerHTML = '';

      if (episodes.length === 0) {
        container.innerHTML = '<p class="empty">エピソードはまだありません</p>';
        return;
      }

      episodes.forEach(function (ep) {
        container.appendChild(createEpisodeCard(ep));
      });
    })
    .catch(function (err) {
      container.innerHTML = '<p class="empty">読み込みに失敗しました: ' + err.message + '</p>';
    });
})();
