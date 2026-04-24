/* ================================================================
   GPS BLOG SCRIPTS  (v1.1 — sidebar visibility fix)
   ----------------------------------------------------------------
   Consolidated runtime scripts for blog post types.
   Loaded externally from Blog Posts Template page head.

   SCRIPTS IN THIS FILE
   --------------------
   A. VS title auto-coloring  — splits-colors H1s that contain " vs. "
   B. HowTo schema injection  — reads gps-step microdata, outputs JSON-LD
   C. Guide sidebar injection — builds sticky chapter nav for guide posts
                                + fades in only when chapters are on-screen
   ================================================================ */

(function() {
  'use strict';

  // ================================================================
  // A. VS TITLE AUTO-COLORING
  // ================================================================
  function colorVsTitles() {
    var titles = document.querySelectorAll('.blog-content-col h1, .blog-header h1, h1[class*="blog"]');
    titles.forEach(function(h1) {
      var text = h1.textContent.trim();
      var match = text.match(/^(.+?)\s+(vs\.?)\s+(.+)$/i);
      if (!match) return;

      var partA = match[1];
      var divider = match[2];
      var partB = match[3];

      var partBMatch = partB.match(/^([^:—(]+?)(\s+(?:for|in|:|—|\()|\s*$)/);
      var partBColored = partBMatch
        ? partBMatch[1].trim()
        : partB.split(' ').slice(0, 2).join(' ');
      var partBRest = partB.substring(partBColored.length);

      h1.innerHTML =
        '<span class="vs-a">' + partA + '</span>' +
        ' <span class="vs-divider">' + divider + '</span> ' +
        '<span class="vs-b">' + partBColored + '</span>' +
        partBRest;
    });
  }

  // ================================================================
  // B. HOWTO SCHEMA INJECTION
  // ================================================================
  function injectHowToSchema() {
    var steps = document.querySelectorAll('.gps-step[itemtype*="HowToStep"]');
    if (steps.length === 0) return;

    var titleEl = document.querySelector('h1');
    var title = titleEl ? titleEl.textContent.trim() : '';

    var stepItems = Array.prototype.map.call(steps, function(step, i) {
      var nameEl = step.querySelector('[itemprop="name"]');
      var textEl = step.querySelector('[itemprop="text"]');
      var name = nameEl ? nameEl.textContent.trim() : 'Step ' + (i + 1);
      var text = textEl ? textEl.textContent.trim().substring(0, 500) : '';
      var url = window.location.href.split('#')[0] + '#' + step.id;
      return {
        '@type': 'HowToStep',
        'name': name,
        'text': text,
        'url': url,
        'position': i + 1
      };
    });

    var schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': title,
      'step': stepItems
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // ================================================================
  // C. GUIDE SIDEBAR INJECTION (v1.1 — visibility gating)
  // The sidebar is built immediately, but hidden by default.
  // It only becomes visible once the first chapter enters the viewport
  // (i.e. the reader has scrolled past the hero + quick-answer + KT sections).
  // It hides again when the last chapter leaves the viewport.
  // ================================================================
  function initGuideSidebar() {
    var chapters = document.querySelectorAll('article.gps-chapter');
    if (chapters.length === 0) return;

    document.body.classList.add('is-guide-post');

    // Build sidebar structure
    var sidebar = document.createElement('aside');
    sidebar.className = 'gps-guide-sidebar';
    sidebar.setAttribute('aria-label', 'Chapter navigation');

    var label = document.createElement('div');
    label.className = 'gps-guide-sidebar-label';
    label.textContent = 'Chapters';
    sidebar.appendChild(label);

    var ol = document.createElement('ol');
    chapters.forEach(function(ch, i) {
      var id = ch.id || ('ch-' + (i + 1));
      var h2 = ch.querySelector('h2');
      var title = h2 ? h2.textContent.trim() : 'Chapter ' + (i + 1);
      var shortTitle = title.replace(/^Chapter\s+\d+\s*[—–-]\s*/i, '');

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + id;
      if (i === 0) a.className = 'active';

      var num = document.createElement('span');
      num.className = 'ch-num';
      num.textContent = (i + 1);
      a.appendChild(num);
      a.appendChild(document.createTextNode(shortTitle));

      li.appendChild(a);
      ol.appendChild(li);
    });
    sidebar.appendChild(ol);
    document.body.appendChild(sidebar);

    var links = sidebar.querySelectorAll('a');
    var firstChapter = chapters[0];
    var lastChapter = chapters[chapters.length - 1];

    function updateVisibility() {
      // Show sidebar when:
      //   firstChapter top has scrolled above 200px (reader passed the hero)
      //   AND lastChapter bottom is still below 200px (chapters still on screen)
      var firstTop = firstChapter.getBoundingClientRect().top;
      var lastBottom = lastChapter.getBoundingClientRect().bottom;
      var shouldShow = firstTop < 200 && lastBottom > 200;
      sidebar.classList.toggle('is-visible', shouldShow);
    }

    function updateActive() {
      var current = chapters[0].id;
      chapters.forEach(function(ch) {
        var rect = ch.getBoundingClientRect();
        if (rect.top < 200) current = ch.id;
      });
      links.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }

    function onScroll() {
      updateVisibility();
      updateActive();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  // ================================================================
  // BOOTSTRAP
  // ================================================================
  function init() {
    colorVsTitles();
    injectHowToSchema();
    initGuideSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
