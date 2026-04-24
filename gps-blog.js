/* ================================================================
   GPS BLOG SCRIPTS
   ----------------------------------------------------------------
   Consolidated runtime scripts for blog post types.
   Loaded externally from Blog Posts Template page head.
   
   SCRIPTS IN THIS FILE
   --------------------
   A. VS title auto-coloring  — splits-colors H1s that contain " vs. "
   B. HowTo schema injection  — reads gps-step microdata, outputs JSON-LD
   C. Guide sidebar injection — builds sticky chapter nav for guide posts
   
   All three run after DOMContentLoaded and silently no-op if their
   target patterns aren't present on the current page.
   ================================================================ */

(function() {
  'use strict';

  // ================================================================
  // A. VS TITLE AUTO-COLORING
  // Detects "<X> vs. <Y> [rest]" in blog H1s and wraps the
  // X / "vs." / Y portions in spans so CSS can color each piece
  // differently (opt-a turquoise / opt-b crimson).
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

      // Limit coloring of partB to the distinctive term only — stop at
      // first "for", "in", ":", em-dash, or open-paren.
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
  // Reads gps-step blocks with schema.org/HowToStep microdata and
  // injects a JSON-LD <script> into the head for rich-snippet eligibility.
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
  // C. GUIDE SIDEBAR INJECTION
  // Detects pages with gps-chapter blocks, tags body.is-guide-post,
  // then builds a sticky sidebar chapter navigation from those
  // chapter IDs + H2 titles. Scroll-spy updates the active chapter
  // as the reader scrolls.
  // ================================================================
  function initGuideSidebar() {
    var chapters = document.querySelectorAll('article.gps-chapter');
    if (chapters.length === 0) return;

    // Mark the body so CSS can target guide-only styles (including
    // the sticky sidebar which is hidden by default via [body.is-guide-post] gate)
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
      // Strip "Chapter N — " prefix if present
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

    // Scroll-spy: update active chapter as user scrolls
    var links = sidebar.querySelectorAll('a');
    function updateActive() {
      var current = chapters[0].id;
      chapters.forEach(function(ch) {
        var rect = ch.getBoundingClientRect();
        if (rect.top < 180) current = ch.id;
      });
      links.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // ================================================================
  // BOOTSTRAP — run all three on DOMContentLoaded
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
