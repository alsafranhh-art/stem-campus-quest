# STEM Campus Quest

An interactive STEM game for a STEM club. An aerial photo of the education centre is the map, each building is a STEM major, and tapping a building starts hands-on challenges (sliders, sorting, simulations, diagrams). A wrong answer keeps the player's answer, marks the mistakes red and shows the right answer as a see-through green ghost, with an explanation. Each run ends with an analysis, and a Day report shows progress per building.

- 8 buildings: Chemistry, Biology, Geology, Space Science, Mathematics, Art & Design, Engineering, Medicine
- 44 challenges, no multiple choice
- Kuwaiti Arabic (right-to-left) and English, with a switch in the top-right corner
- Plain HTML, CSS and JavaScript. No build step, no libraries.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8772
```

Add `?test` to the URL to run the built-in self-test (every challenge, in both languages). The result is logged in the browser console.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | The page: map, challenge flow, analysis, Day report, language switch, self-test |
| `questions.js` | Every challenge (English text, numbers, answers) |
| `questions.ar.js` | The Arabic text for each challenge, in the same order |
| `widgets.js` | The game engines (scale, gauge, order, bins, match, hotspot, simulations) |
| `i18n.js` | `tr(en, ar)` string picker and the saved language |
| `campus.jpg`, `art-scene.svg`, `cis-club.png` | Map photo, drawing for the colour game, CIS Club logo |

## Adding or changing a challenge

1. Add it to the building's list in `questions.js`.
2. Add its Arabic text at the same position in `questions.ar.js`.
3. Open `index.html?test` and check the console says `SELF-TEST PASSED`.
