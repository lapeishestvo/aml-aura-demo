# AML Aura demo

Interactive AML company profile, documents and products prototype built with Angular 21 and Aura components.

Live demo: https://lapeishestvo.github.io/aml-aura-demo/

## Development

Use Node 22.12+ and pnpm 10.33.4. Aura packages require access to the company package registry; use your own authorized registry configuration. Do not commit credentials.

```sh
pnpm install --frozen-lockfile
pnpm start
```

Local preview: http://127.0.0.1:4400. Dependencies are installed locally for this project.

```sh
pnpm typecheck
pnpm build
```

## GitHub Pages

GitHub Pages publishes the committed `docs` directory from `main`. Rebuild it locally with authorized Aura dependencies before pushing changes:

```sh
npm run build:pages
```

The build uses `/aml-aura-demo/` as its base URL and includes local icons and fonts. No package registry credentials are required by the deployment.

## Prototype scope

- Company profile with people and Lexis Nexis detail modals.
- Documents page; actual document files are not attached.
- Products with collapsible groups, additional account rows and ID copying.
- All account information is demo data; no live financial services are connected.

Design reference: https://www.figma.com/design/EKjBlyuxlJ0LmZhU3CvNQ8/AML
