### Onboarding Sections: How to add a new section, a new variant, and control visibility/skip

This guide explains how to extend the onboarding flow. It is copy‑paste friendly for Notion.

### Where things live
- **Section registry**: `src/onboarding/sectionCatalog.jsx`
- **Onboarding flow (steps, skip rules)**: `src/onboarding/OnboardingWizard.jsx`
- **Section components (UI)**: `src/sections/*`
- **Overrides and visibility API**: `src/context/BuilderOverridesContext.jsx`

---

### 1) Add a new section

1) Create the section component(s)
```jsx
// src/sections/Sponsors.jsx
export function SponsorsA({ preview }) {
  return <div data-section="sponsors">Sponsors A {preview ? '(preview)' : ''}</div>;
}
export function SponsorsB({ preview }) {
  return <div data-section="sponsors">Sponsors B {preview ? '(preview)' : ''}</div>;
}
```

2) Register the section in the catalog
```jsx
// src/onboarding/sectionCatalog.jsx
import { SponsorsA, SponsorsB } from "../sections/Sponsors.jsx";

export const SECTIONS = {
  // ...existing sections
  sponsors: {
    title: "Sponsors",
    variants: [
      { key: "A", label: "Sponsors A" },
      { key: "B", label: "Sponsors B" },
    ],
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <SponsorsB preview /> : <SponsorsA preview />}
      </ThumbFrame>
    ),
    skippable: true,
  },
};

// Optional: control the default order
export const SECTION_ORDER = ["hero", "extraPrizes", "winners", "sponsors", "feature"];
```

3) Add steps to the onboarding flow (choose + edit)
```jsx
// src/onboarding/OnboardingWizard.jsx
// Add to STEP_KEYS
"sponsors",       // choose
"sponsorsEdit",   // edit

// Add to STEP_CONFIG
const STEP_CONFIG = {
  // ...
  sponsors: {
    type: 'section-choice',
    sectionKey: 'sponsors',
    completionCheck: (overrides) => !!(overrides?.sponsors?.variant),
    prerequisites: ['winners'] // adjust as needed
  },
  sponsorsEdit: {
    type: 'section-edit',
    sectionKey: 'sponsors',
    completionCheck: (overrides) => !!(overrides?.sponsors?.variant),
    prerequisites: ['sponsors']
  },
};
```

---

### 2) Add a new variant to an existing section

1) Create the variant component
```jsx
// src/sections/ExtraPrizes.jsx
export function ExtraPrizesC({ preview }) {
  return <div>Extra Prizes C {preview ? '(preview)' : ''}</div>;
}
```

2) Register the variant in the section catalog
```jsx
// src/onboarding/sectionCatalog.jsx
import { ExtraPrizesA, ExtraPrizesB, ExtraPrizesC } from "../sections/ExtraPrizes.jsx";

extraPrizes: {
  title: "Extra Prizes",
  variants: [
    { key: "A", label: "Extra Prizes A" },
    { key: "B", label: "Extra Prizes B" },
    { key: "C", label: "Extra Prizes C" }, // new
  ],
  thumbnail: (key = "A") => (
    <ThumbFrame>
      {key === "B" ? <ExtraPrizesB preview />
       : key === "C" ? <ExtraPrizesC preview />
       : <ExtraPrizesA preview />}
    </ThumbFrame>
  ),
},
```

No other change is required. The picker reads variants from `sectionCatalog`.

---

### 3) Control default display (visible or not) in onboarding

Defaults are seeded on mount in `OnboardingWizard.jsx` using `setVisible(sectionKey, boolean)`.

```jsx
// src/onboarding/OnboardingWizard.jsx
["hero", "extraPrizes", "winners", "sponsors"].forEach((k) => {
  if (overridesBySection[k]?.visible === undefined) setVisible(k, true);
});

// Example: hide optional section by default
if (overridesBySection.WhoYouHelp?.visible === undefined) {
  setVisible("WhoYouHelp", false);
}
```

At runtime, Skip (see below) toggles visibility via `setVisible(sectionKey, false)`.

---

### 4) Make a section skippable (or not)

Current behavior (implemented in `OnboardingWizard.jsx`):
- The Skip button shows automatically for any step with `type: 'section-choice'`, **except** the Hero.
- When the user skips a section-choice step:
  - `setVisible(sectionKey, false)` is applied
  - The wizard jumps past the corresponding `<sectionKey>Edit` step in one go

To block skipping for a specific section (in addition to Hero), add it to the exclusion condition where `showSkip` is computed.

```jsx
// Example change in OnboardingWizard.jsx to block skipping for "sponsors"
const showSkip = (
  (STEP_CONFIG[stepKey]?.type === 'section-choice' &&
   STEP_CONFIG[stepKey]?.sectionKey !== 'hero' &&
   STEP_CONFIG[stepKey]?.sectionKey !== 'sponsors')
) || stepKey === "feature" || stepKey === "extraContentConfirmation" || stepKey === "addMoreSections";
```

If you want the `SECTIONS[sectionKey].skippable` flag in `sectionCatalog` to drive this automatically, we can wire that up later; for now the wizard logic controls it.

---

### 5) Useful APIs from `useBuilderOverrides()`
- `setVariant(sectionKey, variantKey)` – choose layout variant
- `setVisible(sectionKey, boolean)` – show/hide entire section
- `setDisplay(sectionKey, partId, boolean)` – show/hide specific parts
- `setCopy(sectionKey, field, value)` – set text content
- `setTheme(sectionKey, themeOverrides)` – per‑section theme overrides

The wizard persists:
- `onboarding_json.sectionOverrides` (all per‑section settings)
- `onboarding_json.charityInfo`
- `status` transitions (e.g. `in_progress`)
- `progress.stepIndex` to resume

---

### 6) Quick checklist for adding a new section
- Create components in `src/sections/YourSection.jsx` (A/B variants)
- Register in `sectionCatalog.jsx` (add to `SECTIONS`, provide `thumbnail`, and optionally `SECTION_ORDER`)
- Add steps to `OnboardingWizard.jsx` (`<sectionKey>` + `<sectionKey>Edit`)
- Set default `setVisible` behavior (optional)
- Decide skip behavior (default: skippable for section‑choice except Hero)


