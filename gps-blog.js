/* ================================================================
   GPS BLOG SCRIPTS  (v1.2 — TOC inserted into right sidebar column)
   ----------------------------------------------------------------
   v1.2 change: sidebar is no longer floating/fixed. It's inserted
   as a sticky block into the existing right column (under the
   "More Posts" card), where it scrolls naturally with the page and
   pins to the top as the reader moves through chapters.
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
  // C. GUIDE SIDEBAR INJECTION (v1.2 — inserted into right column)
  //
  // Strategy:
  //   1. Find the existing "More Posts" block on the right side.
  //   2. Build the chapters TOC.
  //   3. Insert it immediately AFTER the More Posts block so it
  //      becomes a natural part of that column's vertical flow.
  //   4. CSS pins it with `position: sticky` once it hits the top.
  // ================================================================
  function initGuideSidebar() {
    var chapters = document.querySelectorAll('article.gps-chapter');
    if (chapters.length === 0) return;

    document.body.classList.add('is-guide-post');

    // Find the "More Posts" section. The blog template uses an H2 or
    // H3 with "More Posts" text. We walk up to find the enclosing card.
    var morePostsAnchor = null;
    var allHeadings = document.querySelectorAll('h2, h3, h4, h5');
    for (var i = 0; i < allHeadings.length; i++) {
      if (allHeadings[i].textContent.trim().toLowerCase() === 'more posts') {
        morePostsAnchor = allHeadings[i];
        break;
      }
    }

    // Build the TOC block
    var toc = document.createElement('aside');
    toc.className = 'gps-guide-sidebar gps-guide-sidebar-inline';
    toc.setAttribute('aria-label', 'Chapter navigation');

    var label = document.createElement('div');
    label.className = 'gps-guide-sidebar-label';
    label.textContent = 'Chapters';
    toc.appendChild(label);

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
    toc.appendChild(ol);

    // Insert the TOC into the DOM:
    // Prefer to insert right AFTER the "More Posts" enclosing block.
    // Walk up from the heading until we find a reasonable container
    // (usually a .w-dyn-list or a card wrapper).
    if (morePostsAnchor) {
      // Walk up at most 4 levels looking for a large enough container
      var container = morePostsAnchor;
      for (var j = 0; j < 4; j++) {
        if (!container.parentElement) break;
        container = container.parentElement;
        // Stop when we're a direct child of a column (a few common markers)
        var cls = (container.className || '').toString().toLowerCase();
        if (cls.indexOf('col') !== -1 || cls.indexOf('sidebar') !== -1 ||
            cls.indexOf('w-col') !== -1 || cls.indexOf('blog-side') !== -1) {
          // The container IS the column — insert as its last child
          container.appendChild(toc);
          break;
        }
        // Heuristic: if we walked 3 levels up and found a w-dyn-list or similar, use it
        if (j === 3) {
          // Fallback — insert right after the walked-to container
          if (container.parentNode) {
            container.parentNode.insertBefore(toc, container.nextSibling);
          }
          break;
        }
      }
    } else {
      // If we couldn't find "More Posts", fall back to body append
      // (won't happen on guide blog template but keeps us safe)
      document.body.appendChild(toc);
    }

    // Scroll-spy: highlight the current chapter as user scrolls
    var links = toc.querySelectorAll('a');
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
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
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
