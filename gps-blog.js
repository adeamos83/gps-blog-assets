/* ================================================================
   GPS BLOG SCRIPTS  (v1.4 — author box reads from Webflow CMS)
   ----------------------------------------------------------------
   v1.4 change: author box now pulls data from the post's linked
   Webflow author item (via hidden CMS-bound DOM elements in the
   blog post template) instead of a hardcoded config. Falls back
   to AUTHOR_DATA_FALLBACK when the DOM bindings aren't present
   so legacy templates still render an author box.

   v1.3 — author box component
   v1.2 — inline sticky TOC sidebar for guide posts
   v1.1 — fixed-position floating TOC (deprecated)
   v1.0 — initial consolidated release

   ----------------------------------------------------------------
   WEBFLOW TEMPLATE REQUIREMENT (one-time setup)
   ----------------------------------------------------------------
   On the Blog Posts collection page template in Webflow Designer,
   add a div with class "gps-author-cms-data", set its display to
   none (Style panel → Display → None), and inside it add these
   child elements, each bound to the linked author's field:

     <div class="gps-author-cms-data" style="display:none">
       <div class="gps-author-cms-name">      {{ Author > Name }}        </div>
       <div class="gps-author-cms-title">     {{ Author > Title }}       </div>
       <img class="gps-author-cms-photo"      src="{{ Author > Photo }}" />
       <div class="gps-author-cms-credentials">{{ Author > Credentials }}</div>
       <div class="gps-author-cms-bio">       {{ Author > Bio }}         </div>
       <a   class="gps-author-cms-linkedin"   href="{{ Author > LinkedIn URL }}"></a>
     </div>

   Each binding is set in Webflow Designer via the field-binding
   icon next to text content / image source / link URL.
   ================================================================ */

(function() {
  'use strict';

  // ================================================================
  // FALLBACK author data — used only when the Webflow CMS bindings
  // are missing from the page template (e.g. an old template that
  // hasn't been updated yet). Chris Johnson stays as the safety net
  // so we never render a broken / empty author box.
  // ================================================================
  var AUTHOR_DATA_FALLBACK = {
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

  // Read author data from the hidden CMS-bound block. Returns null
  // when the block (or the essential `name` field) is missing — caller
  // should fall back to AUTHOR_DATA_FALLBACK in that case.
  function readAuthorFromCMS() {
    var root = document.querySelector('.gps-author-cms-data');
    if (!root) return null;

    function text(sel) {
      var el = root.querySelector(sel);
      return el ? (el.textContent || '').trim() : '';
    }
    function attr(sel, name) {
      var el = root.querySelector(sel);
      return el ? (el.getAttribute(name) || '').trim() : '';
    }

    var name = text('.gps-author-cms-name');
    if (!name) return null; // bindings absent or author has no name — bail

    var credentialsRaw = text('.gps-author-cms-credentials');
    var credentials = credentialsRaw
      ? credentialsRaw.split(',').map(function(c) { return c.trim(); }).filter(Boolean)
      : [];

    return {
      name: name,
      title: text('.gps-author-cms-title'),
      photo: attr('.gps-author-cms-photo', 'src'),
      credentials: credentials,
      bio: text('.gps-author-cms-bio'),
      linkedin: attr('.gps-author-cms-linkedin', 'href')
    };
  }

  function getAuthorData() {
    return readAuthorFromCMS() || AUTHOR_DATA_FALLBACK;
  }

  // Tiny escape helper — author fields are author-controlled inside
  // Webflow CMS, but escaping HTML keeps the output safe regardless.
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
  // C. AUTHOR BOX INJECTION (v1.4 — CMS-driven)
  // Renders a "Written by" box at the end of the blog content column
  // on every blog post page. Pulls from .gps-author-cms-data first,
  // falls back to AUTHOR_DATA_FALLBACK if the bindings aren't there.
  // ================================================================
  function injectAuthorBox() {
    var contentCol = document.querySelector('.blog-content-col');
    if (!contentCol) return;

    // Don't inject twice
    if (contentCol.querySelector('.gps-author-box')) return;

    var data = getAuthorData();

    var credentialChips = (data.credentials || []).map(function(c) {
      return '<span class="gps-author-credential">' + escapeHtml(c) + '</span>';
    }).join('');
    var credentialsHtml = credentialChips
      ? '<div class="gps-author-credentials">' + credentialChips + '</div>'
      : '';

    var photoHtml = data.photo
      ? '<img class="gps-author-photo" src="' + escapeHtml(data.photo) + '" alt="' + escapeHtml(data.name + (data.title ? ', ' + data.title : '')) + '" itemprop="image" />'
      : '';

    var titleHtml = data.title
      ? '<div class="gps-author-title" itemprop="jobTitle">' + escapeHtml(data.title) + '</div>'
      : '';

    var bioHtml = data.bio
      ? '<p class="gps-author-bio" itemprop="description">' + escapeHtml(data.bio) + '</p>'
      : '';

    var linkedinHtml = data.linkedin
      ? '<a class="gps-author-link" href="' + escapeHtml(data.linkedin) + '" target="_blank" rel="noopener" itemprop="sameAs">Connect on LinkedIn →</a>'
      : '';

    var html =
      '<div class="gps-author-box" itemscope itemtype="https://schema.org/Person">' +
        '<div class="gps-author-box-label">Written by</div>' +
        '<div class="gps-author-box-main">' +
          photoHtml +
          '<div class="gps-author-body">' +
            '<div class="gps-author-name" itemprop="name">' + escapeHtml(data.name) + '</div>' +
            titleHtml +
            credentialsHtml +
            bioHtml +
            linkedinHtml +
          '</div>' +
        '</div>' +
      '</div>';

    contentCol.insertAdjacentHTML('beforeend', html);

    // Also inject Person schema in JSON-LD for AI search engines.
    var sameAs = data.linkedin ? [data.linkedin] : [];
    var personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': data.name,
      'jobTitle': data.title || undefined,
      'image': data.photo || undefined,
      'description': data.bio || undefined,
      'sameAs': sameAs.length ? sameAs : undefined,
      'knowsAbout': (data.credentials && data.credentials.length) ? data.credentials : undefined
    };
    // Strip undefined keys so the JSON-LD stays clean.
    Object.keys(personSchema).forEach(function(k) {
      if (personSchema[k] === undefined) delete personSchema[k];
    });

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
