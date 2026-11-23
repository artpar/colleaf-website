# Office product website

This is a standalone, static product website. Branding is supplied by
`office-site.json`; the application and its runtime data are not deployed.

Build with Node 22 or newer (no dependencies required):

```sh
node scripts/build-office-website.mjs
python3 -m http.server 4178 --bind 127.0.0.1 --directory website/dist
```

The build writes only to ignored `website/dist/`. It includes the page, local
assets, canonical URL, sitemap, robots file and domain metadata. There are no
analytics, signup forms, external fonts or runtime services.

Product screens use disposable sample data from the Home dashboard and Booking
availability evidence. The source PNGs are copied unchanged and presented in
grayscale through CSS.

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
