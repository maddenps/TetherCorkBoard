# Tether Cork Board

Plan big projects in 2D instead of a list. Pin notes, photos and sections to a cork board, tie them together with string, and zoom in to reveal deeper levels (area, then boulder, then route). Offline-first: it runs from your browser with no account and no signal after the first load.

## Run it

```bash
npm install --ignore-scripts
npm run dev
```

Open http://localhost:3003. A demo "Bouldering trip" board is created on first launch: zoom in on an area to reveal boulders, then routes.

## Use it offline on a phone

```bash
npm run build
npx serve out -l 3003
```

Open the served site on the phone once while online, then "Add to Home Screen". It is cached by a service worker and boards are stored on the device. Use Export to keep a backup file.

Docs live in `Specs/` (start with `Specs/README.md`); agent rules are in `AGENTS.md`.
