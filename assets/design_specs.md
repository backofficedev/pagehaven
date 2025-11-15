Here’s a compact spec sheet you can hand to another LLM.

---

### Brand Color Tokens

**Primary**

* `primary`

  * Hex: `#4F46E5`
  * Tailwind: `indigo-600`

* `primary-light`

  * Hex: `#A5B4FC`
  * Tailwind: `indigo-300`

* `primary-bg` (soft background tint)

  * Hex: `#EEF2FF`
  * Tailwind: `indigo-50`

**Neutrals / Text**

* `text-main`

  * Hex: `#0F172A`
  * Tailwind: `slate-900`

* `text-muted`

  * Hex: `#6B7280`
  * Tailwind: `gray-500`

---

### JSON-style Design Spec (for the LLM)

```json
{
  "colors": {
    "primary": { "hex": "#4F46E5", "tailwind": "indigo-600" },
    "primaryLight": { "hex": "#A5B4FC", "tailwind": "indigo-300" },
    "primaryBg": { "hex": "#EEF2FF", "tailwind": "indigo-50" },
    "textMain": { "hex": "#0F172A", "tailwind": "slate-900" },
    "textMuted": { "hex": "#6B7280", "tailwind": "gray-500" }
  }
}
```
