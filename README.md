# GPS Blog External Assets

External CSS + JS for Geek Powered Studios blog posts on Webflow.

## Why this exists

Webflow caps inline `<head>` custom code at 50,000 characters per page. As the blog post library grew across 5 post types (cost guide, ranked list, comparison, how-to, pillar guide), the CSS outgrew the cap. These files are loaded via CDN (jsDelivr) and linked from the Blog Posts Template with one-line `<link>` and `<script>` tags.

## Files

- **`gps-blog.css`** — all blog post styles, organized by section (see file header for table of contents)
- **`gps-blog.js`** — three runtime scripts: "vs." title coloring, HowTo schema injection, guide sidebar injection

## How to load them in Webflow

Paste this into **Blog Posts Template → Page Settings → Inside `<head>` tag**:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO@main/gps-blog.css">
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO@main/gps-blog.js" defer></script>
```

Replace `YOUR-USERNAME/YOUR-REPO` with the actual GitHub path.

## How to update

1. Edit the file in GitHub (directly via web UI or push from local)
2. Commit the change
3. jsDelivr auto-mirrors GitHub — typically within 5 minutes, sometimes up to 12 hours due to CDN caching
4. To force an instant refresh, append a version hash:
   - `gps-blog.css@abc1234` where `abc1234` is the commit SHA
   - Or use `@v1.0.1` if you start tagging releases

## Post types covered

| Post type | Key CSS patterns |
|---|---|
| **Cost guide** | `gps-table`, `gps-inline-image`, `gps-proscons`, `gps-steps` |
| **Ranked list** | `gps-toc`, `gps-list-item`, `gps-list-rank`, `gps-list-verdict` |
| **Comparison** | `gps-vs-intro`, `gps-vs-table`, `gps-vs-verdict`, `gps-scenarios`, `gps-callout` |
| **How-to** | `gps-prereq`, `gps-step`, `gps-tools`, `gps-step-note` + HowTo schema |
| **Guide (pillar)** | `gps-scope-answer`, `gps-chapter`, `gps-glossary`, `gps-cross-link`, `gps-tools-list` + sticky sidebar |

All patterns are inline HTML embedded in the Rich Text body of each CMS item. The CSS here styles them globally.

## Brand palette

- Midnight Blue `#12074e` — primary
- Gold `#f6d64a` — accent
- Dark Turquoise `#53bdc8` / Cadet Blue `#45a0aa` — link, option A, secondary accent
- Crimson `#df0651` — option B, pop accent
- Mint `#eef5f5`, Powder `#b3e2e7`, Light Cyan `#d1f4f6` — soft backgrounds

Fonts: Poppins (headings), Roboto (body)
