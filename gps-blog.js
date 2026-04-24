/* ================================================================
   GPS BLOG SCRIPTS  (v1.3 — adds author box component)
   ----------------------------------------------------------------
   v1.3 change: injects author box component at the end of the
   content column, pulling author data from a config block.
   v1.2 — inline sticky TOC sidebar for guide posts
   v1.1 — fixed-position floating TOC (deprecated)
   v1.0 — initial consolidated release
   ================================================================ */

(function() {
  'use strict';

  // ================================================================
  // AUTHOR DATA — hardcoded for Chris Johnson (MVP)
  // For multi-author support, this config can be driven by a
  // data attribute on the body or a CMS field binding.
  // ================================================================
  var AUTHOR_DATA = {
    name: 'Chris Johnson',
    title: 'Senior Digital Marketing Strategist at Geek Powered Studios',
    photo: 'https://cdn.prod.website-files.com/69e8f51d3ddd473d72d9ec7a/69ebd794835f8cb39b24629e_photo-1560250097-0b93528c311a.jpeg',
    credentials: [
      'Google Ads Certified',
      'Google Analytics Certified',
      '15+ years in digital marketing',
      'Home Services SEO Specialist'
    ],
    bio: 'Chris Johnson leads digital marketing strategy at Geek Powered Studios, where he has helped hundreds of home services contractors across Texas grow their businesses through SEO, paid media, and AI-powered lead automation. He specializes in translating complex search-engine changes into practical playbooks that actually move the needle for plumbers, roofers, HVAC, and electrical contractors.',
    linkedin: 'https://www.linkedin.com/in/chrisjohnson/'
  };

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
  // C. AUTHOR BOX INJECTION (v1.3)
  // Renders a "Written by" box at the end of the blog content column
  // on every blog post page. Uses AUTHOR_DATA config above.
  // ================================================================
  function injectAuthorBox() {
    var contentCol = document.querySelector('.blog-content-col');
    if (!contentCol) return;

    // Don't inject twice
    if (contentCol.querySelector('.gps-author-box')) return;

    var credentialChips = AUTHOR_DATA.credentials.map(function(c) {
      return '<span class="gps-author-credential">' + c + '</span>';
    }).join('');

    var html =
      '<div class="gps-author-box" itemscope itemtype="https://schema.org/Person">' +
        '<div class="gps-author-box-label">Written by</div>' +
        '<div class="gps-author-box-main">' +
          '<img class="gps-author-photo" src="' + AUTHOR_DATA.photo + '" alt="' + AUTHOR_DATA.name + ', ' + AUTHOR_DATA.title + '" itemprop="image" />' +
          '<div class="gps-author-body">' +
            '<div class="gps-author-name" itemprop="name">' + AUTHOR_DATA.name + '</div>' +
            '<div class="gps-author-title" itemprop="jobTitle">' + AUTHOR_DATA.title + '</div>' +
            '<div class="gps-author-credentials">' + credentialChips + '</div>' +
            '<p class="gps-author-bio" itemprop="description">' + AUTHOR_DATA.bio + '</p>' +
            '<a class="gps-author-link" href="' + AUTHOR_DATA.linkedin + '" target="_blank" rel="noopener" itemprop="sameAs">Connect on LinkedIn \u2192</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Inject as last child of the blog content column
    contentCol.insertAdjacentHTML('beforeend', html);

    // Also inject Person schema in JSON-LD for AI search engines
    var personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': AUTHOR_DATA.name,
      'jobTitle': AUTHOR_DATA.title,
      'image': AUTHOR_DATA.photo,
      'description': AUTHOR_DATA.bio,
      'sameAs': [AUTHOR_DATA.linkedin],
      'knowsAbout': AUTHOR_DATA.credentials
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(personSchema);
    document.head.appendChild(script);
  }

  // ================================================================
  // D. GUIDE SIDEBAR INJECTION (v1.2 — inserted into right column)
  // ================================================================
  function initGuideSidebar() {
    var chapters = document.querySelectorAll('article.gps-chapter');
    if (chapters.length === 0) return;

    document.body.classList.add('is-guide-post');

    var morePostsAnchor = null;
    var allHeadings = document.querySelectorAll('h2, h3, h4, h5');
    for (var i = 0; i < allHeadings.length; i++) {
      if (allHeadings[i].textContent.trim().toLowerCase() === 'more posts') {
        morePostsAnchor = allHeadings[i];
        break;
      }
    }

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

    if (morePostsAnchor) {
      var container = morePostsAnchor;
      for (var j = 0; j < 4; j++) {
        if (!container.parentElement) break;
        container = container.parentElement;
        var cls = (container.className || '').toString().toLowerCase();
        if (cls.indexOf('col') !== -1 || cls.indexOf('sidebar') !== -1 ||
            cls.indexOf('w-col') !== -1 || cls.indexOf('blog-side') !== -1) {
          container.appendChild(toc);
          break;
        }
        if (j === 3) {
          if (container.parentNode) {
            container.parentNode.insertBefore(toc, container.nextSibling);
          }
          break;
        }
      }
    } else {
      document.body.appendChild(toc);
    }

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
    injectAuthorBox();
    initGuideSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
