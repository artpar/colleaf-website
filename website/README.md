# Office product website

This is a standalone, static product website. Branding is supplied by
`office-site.json`; the application and its runtime data are not deployed.

The homepage introduces the complete suite through its actual workspace and
three visual routes into the apps. Detailed capabilities and screenshots live
on Workspace, Mail & contacts, and Calendar & booking pages. How it runs explains
deployment choices. There is no download funnel or invented public download URL.

`office-pages.json` registers the five pages and their metadata. The shared
`layout.template.html` owns navigation and the footer; `index.template.html`
and `pages/` contain the page bodies. The build emits flat HTML URLs, active
navigation, page-specific canonical metadata and a five-page sitemap. All
content and navigation work without JavaScript.

Build with Node 22 or newer (no dependencies required):

```sh
node scripts/build-office-website.mjs
python3 -m http.server 4178 --bind 127.0.0.1 --directory website/dist
```

The build writes only to ignored `website/dist/`. It includes the page, local
assets, canonical URL, sitemap, robots file and domain metadata. There are no
analytics, signup forms, external fonts or runtime services.

The 12 product screens were captured from the actual `release/Office` application
on 23 November 2026, using an isolated local workspace and a fictional Studio North
/ Ember Studio project. They show a formatted proposal, a calculated project budget,
project files and previews, client correspondence, contacts, calendar events,
appointment rules and the real guest booking page. These are application renders,
not HTML replicas or generated illustrations. No customer workspace data is used.

`office-screens.json` records each image's label, description and dimensions.
Captures are cropped to exclude a third-party browser extension at the right edge;
product content is not composited or retouched. Grayscale is applied through CSS.
Every image has a full-size viewer; below-the-fold images load lazily. Together,
the source PNGs total less than 1 MiB.

## Hosting

The app repository stays private. Its current GitHub plan does not support
Pages for private repositories, so the public website is hosted from the
website-only repository `artpar/office-website`. Only these reviewed paths are
copied there:

- `website/` source files (excluding generated `dist/`)
- `scripts/build-office-website.mjs`
- `.github/workflows/office-website.yml`

In the public repository, set the Actions variable `OFFICE_WEBSITE_PUBLISH` to
`true` and enable Pages with GitHub Actions as the publishing source. Pushes to
`main` rebuild and deploy the website. In the private app repository, the same
workflow builds an artifact without deploying; changes must be copied to the
website-only repository to publish them. Never mirror the app repository or
copy its Git history to the public repository.

The Pages custom domain must also be set in GitHub's repository settings;
Actions publishing does not use `CNAME` as its domain authority.

## DNS handoff

Canonical domain: `colleaf.com`. Configure these records at its DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | artpar.github.io |

Replace conflicting website records at `@` and `www`; retain unrelated mail
and verification records. With a proxy-capable DNS provider, use DNS-only
records during GitHub certificate provisioning. After propagation, enable
Enforce HTTPS in Pages settings when GitHub makes the certificate available.

Check `dig +short colleaf.com A`, `dig +short www.colleaf.com CNAME` and the
Pages DNS check before treating the custom domain as live. GitHub documents
that propagation and HTTPS availability can take up to 24 hours.

Source: [GitHub custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Copy direction and research

The page explains practical consequences for the person using the suite:
working continuity, finding and finishing work, keeping editable copies,
contact/calendar exchange, controlling appointment boundaries, and deciding
who operates the installation. Keep the feature detail tied to these needs.
Maintain grayscale, compact headings and directly visible content.

Calendar and Contacts copy names CalDAV and CardDAV explicitly and distinguishes
access to the same server-side records from one-time iCalendar/vCard exports.
The web adapters use those protocol resources; Address books exposes a CardDAV
path in Sync details. Do not infer compatibility with every named phone or desktop
client from protocol support, or describe a native client as independently verified
without its own evidence.

Research informing this framing:

- [Microsoft's workplace research](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday/) describes fragmented work and interruptions.
- [Microsoft's subscription guidance](https://support.microsoft.com/en-us/accounts-billing/subscriptions/what-happens-when-my-microsoft-365-subscription-expires) documents reduced editing functionality for affected subscriptions after expiry.
- [Microsoft's coauthoring guidance](https://support.microsoft.com/en-us/sharepoint/get-started-with-sharepoint/document-collaboration-and-co-authoring) describes offline edits and save conflicts.
- [Google's organization-export guidance](https://knowledge.workspace.google.com/admin/migrate/export-all-your-organizations-data) documents an administrator-led export process.
- [Google's appointment guidance](https://support.google.com/calendar/answer/11423292) explains buffers and booking notice controls.

These sources identify concerns to address in the writing. Product capability
claims come from this project's implementation and documentation. Pricing,
licensing guarantees, universal file compatibility, uninterrupted availability
and absolute privacy claims are not established by this research.
