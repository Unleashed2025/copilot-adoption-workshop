# Microsoft Copilot Adoption Workshop

A reusable, browser-based workshop app for capturing client goals, departments, attendees, Workshop Groups, confidence, opportunities, priorities and project recommendations.

## Data and privacy

Workshop data is stored only in the current browser's local storage. It is not sent to a backend or shared between browsers or devices. Use **New Workshop** to clear the locally saved workshop.

## Development

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Deployment

Pushes to `main` deploy the production build to GitHub Pages through `.github/workflows/deploy-pages.yml`.
