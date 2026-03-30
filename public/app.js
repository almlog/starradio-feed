/**
 * スタラジ Web Player
 * episodes.json + characters.json を読み込み
 * カレンダー + 折りたたみカード + 音声プレーヤーを描画
 */

(function () {
  var BASE = '';
  var container = document.getElementById('episodes');
  var calendarContainer = document.getElementById('calendar');
  var characters = {};
  var allEpisodes = [];

  // ---- Utilities ----
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
      escapeHtml(nickname) + '</span>';
  }

  // ---- Tooltip ----
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
            escapeHtml(ch.category) + '</span>' +
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

    var chipRect = chipEl.getBoundingClientRect();
    var tipW = tooltip.offsetWidth;
    var tipH = tooltip.offsetHeight;
    var gap = 8, margin = 12;

    var idealLeft = chipRect.left + chipRect.width / 2 - tipW / 2;
    var left = Math.max(margin, Math.min(idealLeft, window.innerWidth - tipW - margin));
    var chipCenter = chipRect.left + chipRect.width / 2;
    var arrowLeft = Math.max(16, Math.min(chipCenter - left, tipW - 16));
    tooltip.style.setProperty('--arrow-left', arrowLeft + 'px');

    var top = chipRect.top - tipH - gap;
    if (top < margin) {
      top = chipRect.bottom + gap;
      tooltip.classList.add('cast-tooltip--below');
    }
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hideTooltip() {
    if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
  }

  document.addEventListener('mouseenter', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) showTooltip(chip);
  }, true);
  document.addEventListener('mouseleave', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) hideTooltip();
  }, true);
  document.addEventListener('touchstart', function (e) {
    var chip = e.target.closest('.cast-chip--has-tooltip');
    if (chip) { e.preventDefault(); activeTooltip ? hideTooltip() : showTooltip(chip); }
    else { hideTooltip(); }
  }, { passive: false });

  // ---- Collapsible Episode Card ----
  function createEpisodeCard(ep, expanded) {
    var card = document.createElement('article');
    card.className = 'episode-card' + (expanded ? ' is-expanded' : '');
    card.setAttribute('data-date', ep.date);

    var modeLabel = ep.broadcastMode === 'weekly' ? '増刊号' : '日刊';
    var modeClass = 'mode-' + ep.broadcastMode;

    var castHtml = (ep.cast || []).map(buildCastChip).join('');

    var segmentsHtml = (ep.segments || []).map(function (seg) {
      return '<div class="segment-item" data-time="' + seg.startSec + '">' +
        '<span class="segment-time">' + formatTime(seg.startSec) + '</span>' +
        escapeHtml(seg.name) + '</div>';
    }).join('');

    var audioId = 'audio-' + ep.id;

    // Header (always visible, clickable)
    var headerHtml =
      '<div class="episode-card-toggle">' +
        '<div class="episode-header">' +
          '<div class="episode-header-left">' +
            '<span class="episode-date">' + formatDate(ep.date) + '</span>' +
            '<span class="mode-badge ' + modeClass + '">' + modeLabel + '</span>' +
          '</div>' +
          '<div class="episode-header-right">' +
            '<span class="episode-duration">' + ep.durationFormatted + '</span>' +
            '<span class="episode-chevron"></span>' +
          '</div>' +
        '</div>' +
        '<h2 class="episode-title">' + escapeHtml(ep.title) + '</h2>' +
      '</div>';

    // Body (collapsible)
    var bodyHtml =
      '<div class="episode-card-body">' +
        '<div class="episode-cast">' + castHtml + '</div>' +
        '<div class="episode-segments">' + segmentsHtml + '</div>' +
        '<div class="audio-wrapper">' +
          '<audio id="' + audioId + '" controls preload="none">' +
            '<source src="' + BASE + 'audio/' + ep.audioFile + '" type="audio/mpeg">' +
          '</audio>' +
        '</div>' +
      '</div>';

    card.innerHTML = headerHtml + bodyHtml;

    // Toggle collapse
    card.querySelector('.episode-card-toggle').addEventListener('click', function () {
      card.classList.toggle('is-expanded');
    });

    // Segment seek
    var segmentItems = card.querySelectorAll('.segment-item');
    for (var i = 0; i < segmentItems.length; i++) {
      segmentItems[i].addEventListener('click', (function (id) {
        return function (e) {
          e.stopPropagation();
          var time = parseFloat(e.currentTarget.getAttribute('data-time'));
          var audio = document.getElementById(id);
          if (audio) { audio.currentTime = time; audio.play(); }
        };
      })(audioId));
    }

    return card;
  }

  // ---- Calendar ----
  function buildCalendar(episodes) {
    if (!calendarContainer || episodes.length === 0) return;

    // Build date set
    var episodeDates = {};
    episodes.forEach(function (ep) { episodeDates[ep.date] = ep; });

    // Determine month range (latest episode's month)
    var latestDate = new Date(episodes[0].date + 'T00:00:00+09:00');
    var year = latestDate.getFullYear();
    var month = latestDate.getMonth(); // 0-indexed

    calendarContainer.innerHTML = '';
    calendarContainer.appendChild(buildMonthGrid(year, month, episodeDates));
  }

  function buildMonthGrid(year, month, episodeDates) {
    var wrapper = document.createElement('div');
    wrapper.className = 'calendar';

    var monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                      '7月', '8月', '9月', '10月', '11月', '12月'];
    var dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // Header with nav
    var headerHtml =
      '<div class="calendar-header">' +
        '<button class="calendar-nav calendar-prev" data-year="' + year + '" data-month="' + month + '">&lt;</button>' +
        '<span class="calendar-title">' + year + '年 ' + monthNames[month] + '</span>' +
        '<button class="calendar-nav calendar-next" data-year="' + year + '" data-month="' + month + '">&gt;</button>' +
      '</div>';

    // Day names row
    var daysRowHtml = '<div class="calendar-days">' +
      dayNames.map(function (d) { return '<span class="calendar-day-name">' + d + '</span>'; }).join('') +
      '</div>';

    // Build grid
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var cellsHtml = '';
    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
      cellsHtml += '<span class="calendar-cell calendar-cell--empty"></span>';
    }
    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var hasEp = episodeDates[dateStr];
      var isToday = dateStr === todayStr;
      var cls = 'calendar-cell';
      if (hasEp) cls += ' calendar-cell--has-episode';
      if (isToday) cls += ' calendar-cell--today';

      cellsHtml += '<span class="' + cls + '" data-date="' + dateStr + '">' +
        '<span class="calendar-cell-num">' + d + '</span>' +
        (hasEp ? '<span class="calendar-cell-dot"></span>' : '') +
        '</span>';
    }

    wrapper.innerHTML = headerHtml + daysRowHtml +
      '<div class="calendar-grid">' + cellsHtml + '</div>';

    // Click handlers
    wrapper.addEventListener('click', function (e) {
      var cell = e.target.closest('.calendar-cell--has-episode');
      if (cell) {
        var date = cell.getAttribute('data-date');
        scrollToEpisode(date);
        return;
      }
      var prev = e.target.closest('.calendar-prev');
      if (prev) {
        var py = parseInt(prev.getAttribute('data-year'));
        var pm = parseInt(prev.getAttribute('data-month'));
        pm--;
        if (pm < 0) { pm = 11; py--; }
        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(buildMonthGrid(py, pm, episodeDates));
        return;
      }
      var next = e.target.closest('.calendar-next');
      if (next) {
        var ny = parseInt(next.getAttribute('data-year'));
        var nm = parseInt(next.getAttribute('data-month'));
        nm++;
        if (nm > 11) { nm = 0; ny++; }
        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(buildMonthGrid(ny, nm, episodeDates));
      }
    });

    return wrapper;
  }

  function scrollToEpisode(dateStr) {
    var card = document.querySelector('.episode-card[data-date="' + dateStr + '"]');
    if (!card) return;
    // Expand if collapsed
    if (!card.classList.contains('is-expanded')) {
      card.classList.add('is-expanded');
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Flash highlight
    card.classList.add('is-highlighted');
    setTimeout(function () { card.classList.remove('is-highlighted'); }, 1500);
  }

  // ---- Render ----
  function renderEpisodes(episodes) {
    container.innerHTML = '';
    allEpisodes = episodes;

    if (episodes.length === 0) {
      container.innerHTML = '<p class="empty">エピソードはまだありません</p>';
      return;
    }

    episodes.forEach(function (ep, index) {
      var expanded = index === 0; // Latest episode expanded by default
      var card = createEpisodeCard(ep, expanded);
      card.style.animationDelay = (index * 0.06) + 's';
      container.appendChild(card);
    });

    buildCalendar(episodes);
  }

  // ---- Init ----
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
