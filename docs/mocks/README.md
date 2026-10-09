# Zamaro mock concepts

Each folder is a self-contained design concept for the same two pages
(**Discover** and **Artist profile**), with the same cast and the same states, so
concepts can be compared like for like. Open each concept's `index.html` from disk.

| Concept | Idea | Gallery |
|---|---|---|
| Vespers | Evening prayer: dusk violet, candle gold, parchment, serif headings | [vespers/index.html](vespers/index.html) |

To add a concept, copy the `vespers/` cast and states, change the tokens and kit, then run:

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/<concept> --write
```
