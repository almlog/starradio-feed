/**
 * スタラジ Web Player
 * episodes.json + characters.json を読み込んでエピソード一覧+音声プレーヤーを描画
 */

(function () {
  var BASE = '';
  var container = document.getElementById('episodes');
  var characters = {};

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

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function categoryClass(category) {
    if (category === 'メインMC') return 'mc';
    if (category === 'アシスタント') return 'assistant';
    return 'guest';
  }

  function buildCastChip(nickname) {
    var ch = characters[nickname];
    var borderStyle = ch && ch.color ? ' style="border-bottom: 2px solid ' + ch.color + '"' : '';

    return '<span class="cast-chip cast-chip--has-tooltip" data-nickname="' +
      escapeHtml(nickname) + '"' + borderStyle + '>' +
      escapeHtml(nickname) +
      '</span>';
  }

  // ---- Tooltip positioning ----
  var activeTooltip = null;

  function showTooltip(chipEl) {
    var nickname = chipEl.getAttribute('data-nickname');
    var ch = characters[nickname];

    hideTooltip();

    var tooltip = document.createElement('div');
    tooltip.className = 'cast-tooltip is-visible';

    if (ch) {
      tooltip.innerHTML =
        '<div class="cast-tooltip-header">' +
          '<span class="cast-tooltip-name">' + escapeHtml(ch.name) + '</span>' +
          '<span class="cast-tooltip-category cast-tooltip-category--' + categoryClass(ch.category) + '">' +
            escapeHtml(ch.category) +
          '</span>' +
        '</div>' +
        '<div class="cast-tooltip-role">' + escapeHtml(ch.role) + '</div>' +
        '<div class="cast-tooltip-desc">' + escapeHtml(ch.description) + '</div>';
    } else {
      tooltip.innerHTML =
        '<div class="cast-tooltip-header">' +
          '<span class="cast-tooltip-name">' + escapeHtml(nickname) + '</span>' +
        '</div>' +
        '<div class="cast-tooltip-desc cast-tooltip-desc--unknown">プロフィール未登録</div>';
    }

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    // Position calculation
    var chipRect = chipEl.getBoundingClientRect();
    var tipW = tooltip.offsetWidth;
    var tipH = tooltip.offsetHeight;
    var gap = 8;
    var margin = 12;

    // Horizontal: center on chip, clamp to viewport
    var idealLeft = chipRect.left + chipRect.width / 2 - tipW / 2;
    var left = Math.max(margin, Math.min(idealLeft, window.innerWidth - tipW - margin));

    // Arrow position relative to tooltip
    var chipCenter = chipRect.left + chipRect.width / 2;
    var arrowLeft = Math.max(16, Math.min(chipCenter - left, tipW - 16));
    tooltip.style.setProperty('--arrow-left', arrowLeft + 'px');

    // Vertical: prefer above, fall back to below
    var top = chipRect.top - tipH - gap;
    if (top < margin) {
      top = chipRect.bottom + gap;
      // Flip arrow to top
      tooltip.classList.add('cast-tooltip--below');
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hideTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  // Event delegation for tooltips
  document.addEventListener('mouseenter', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) showTooltip(chip);
  }, true);

  document.addEventListener('mouseleave', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) hideTooltip();
  }, true);

  // Touch support
  document.addEventListener('touchstart', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) {
      e.preventDefault();
      if (activeTooltip) { hideTooltip(); } else { showTooltip(chip); }
    } else {
      hideTooltip();
    }
  }, { passive: false });

  // ---- Episode card ----
  function createEpisodeCard(ep) {
    var card = document.createElement('article');
    card.className = 'episode-card';

    var modeLabel = ep.broadcastMode === 'weekly' ? '増刊号' : '日刊';
    var modeClass = 'mode-' + ep.broadcastMode;

    var castHtml = (ep.cast || [])
      .map(function (c) { return buildCastChip(c); })
      .join('');

    var segmentsHtml = (ep.segments || [])
      .map(function (seg) {
        return '<div class="segment-item" data-time="' + seg.startSec + '">' +
          '<span class="segment-time">' + formatTime(seg.startSec) + '</span>' +
          escapeHtml(seg.name) +
          '</div>';
      })
      .join('');

    var audioId = 'audio-' + ep.id;

    card.innerHTML =
      '<div class="episode-header">' +
        '<div class="episode-header-left">' +
          '<span class="episode-date">' + formatDate(ep.date) + '</span>' +
          '<span class="mode-badge ' + modeClass + '">' + modeLabel + '</span>' +
        '</div>' +
        '<span class="episode-duration">' + ep.durationFormatted + '</span>' +
      '</div>' +
      '<h2 class="episode-title">' + escapeHtml(ep.title) + '</h2>' +
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

  // characters.json と episodes.json を並行読み込み
  Promise.all([
    fetch(BASE + 'characters.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
    fetch(BASE + 'episodes.json').then(function (r) {
      if (!r.ok) throw new Error('Failed to load episodes.json');
      return r.json();
    })
  ])
    .then(function (results) {
      characters = results[0];
      renderEpisodes(results[1]);
    })
    .catch(function (err) {
      container.innerHTML = '<p class="empty">読み込みに失敗しました: ' + err.message + '</p>';
    });
})();
