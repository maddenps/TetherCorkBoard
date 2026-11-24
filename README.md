# Tether Cork Board

Plan big projects in 2D instead of a list. Pin notes, photos and sections to a cork board, tie them together with string, and zoom in to reveal deeper levels (sections inside sections inside notes). Offline-first: it runs from your browser with no account and no signal after the first load.

## Run it

```bash
npm install --ignore-scripts
npm run dev
```

Open http://localhost:3003. A demo "Weekend trip" board is created on first launch: zoom in on a place to reveal the groups and notes inside it.

## Getting around

- **Double-click** an item to zoom in. **Esc**, the Up button, the breadcrumb or a double-click on the bare board zooms out.
- **Right-click** (or press and hold on touch) to select an item. A frame appears with grips to resize it (corners, or the edges for one direction), a big move icon in the middle to drag it by, and a cog for its settings.
- Tie items together with **Connect** in an item's settings. Connectors can be string, line, dashed or arrow, with a colour and a label.
- Items can hold a link, photos (look through them from the picture-frame icon) and, for sections, a map image behind them.

## Customise it: types and packs

The **Types** button designs *item types*: a name, a look (note or section), a colour and any fields you like (text, number, link, checkbox, choice). Pick a type from **+ Type** when adding an item. That is how one app can be a trip planner, a research map, a project tracker or anything else.

A **pack** is a small shareable file of types. In **Types**:

- add a built-in pack: **Climbing trip** (area, boulder, route) or **Research web** (topic, claim, question, source)
- **Load pack file…** adds the types from a `.cork-pack.json` file (types you already have are never overwritten)
- **Save these types as a pack** exports your own, to share or to reuse on another board

Packs only hold types, never your items. The built-in ones are plain files in [`public/packs/`](public/packs/), and this is the whole format:

```json
{
  "format": "tethercorkpack",
  "version": 1,
  "name": "My pack",
  "description": "Optional. What it is for.",
  "types": [
    {
      "id": "type-task",
      "name": "Task",
      "kind": "note",
      "color": "#fff4a3",
      "fields": [
        { "id": "task-status", "name": "Status", "type": "select", "options": ["To do", "Doing", "Done"] },
        { "id": "task-link", "name": "Link", "type": "link" }
      ]
    }
  ]
}
```

`kind` is `"note"` or `"section"`. Field `type` is one of `text`, `longtext`, `number`, `link`, `checkbox` or `select` (which also takes `options`). Keep ids unique and stable: items remember their type and field values by id.

## Try a big linked board

[`public/examples/research-web.cork.json`](public/examples/research-web.cork.json) is a ready-made board, a web of linked ideas about how to keep a city cooler. It is split into topics (causes, effects, solutions, a reading list), each full of notes, with labelled arrows and dashed strings running between them. Import it with the **Import** button, then double-click a topic to zoom in and follow the strings. Use it as a model for your own map of connected things.

## Use it offline on a phone

```bash
npm run build
npx serve out -l 3003
```

Open the served site on the phone once while online, then "Add to Home Screen". It is cached by a service worker and boards are stored on the device. Use Export to keep a backup file.

Docs live in `Specs/` (start with `Specs/README.md`); agent rules are in `AGENTS.md`.
