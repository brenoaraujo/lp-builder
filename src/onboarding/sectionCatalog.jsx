// src/onboarding/sectionCatalog.js
// [Onboarding] NEW - central registry for sections, variants and editable fields.

import React from "react";
import AutoScaler from "../components/AutoScaler.jsx";
import { NavbarA, NavbarB } from "../sections/Navbar.jsx";
import { HeroA, HeroB } from "../sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "../sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "../sections/Winners.jsx";
import { WhoYouHelpA, WhoYouHelpB } from "../sections/WhoYouHelp.jsx";
import { FeatureA, FeatureB } from "../sections/Feature.jsx";

// [Onboarding] "Field descriptors" – keep these aligned with your data-* labels.
// You can expand them later as you add sections.
export const SECTION_ORDER = ["hero", "extraPrizes", "winners", "feature"];
export const THUMB_DESIGN_W = 1440;   // your section design width
export const THUMB_MIN_W = 320;    // keep small cards readable
export const THUMB_MAX_W = 900;    // optional safety cap
export const THUMB_MAX_H = 420;    // keep thumbs short

function useParentWidth() {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(THUMB_MIN_W);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      const px = ref.current?.clientWidth || THUMB_MIN_W;
      setW(Math.max(THUMB_MIN_W, Math.min(THUMB_MAX_W, px)));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function ThumbFrame({ children, maxH = THUMB_MAX_H }) {
  const [ref, w] = useParentWidth();
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl">
      <AutoScaler designWidth={THUMB_DESIGN_W} targetWidth={w} maxHeight={maxH}>
        {children}
      </AutoScaler>
    </div>
  );
}


export const SECTIONS = {

  Navbar: {
    id: "Navbar",
    label: "Navbar",
    variants: { A: NavbarA, B: NavbarB },
    defaultVariant: "A",
    hiddenInOnboarding: true,   // keep out of Onboarding
    hiddenInPicker: true,       // keep out of Add Section modal
    fixedPosition: "top",
  },

  howYouHelp: {
    title: "How You Help",
    variants: [
      { key: "A", label: "How You Help A" },
      { key: "B", label: "How You Help B" },
    ],
  },

  hero: {
    title: "Hero",
    variants: [
      { key: "A", label: "Hero A" },
      { key: "B", label: "Hero B" },
    ],
    // 👇 responsive thumbnail (fills the card)
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <HeroB preview /> : <HeroA preview />}
      </ThumbFrame>
    ),
    skippable: false,
  },

  extraPrizes: {
    title: "Extra Prizes",
    variants: [
      { key: "A", label: "Extra Prizes A" },
      { key: "B", label: "Extra Prizes B" },
    ],
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <ExtraPrizesB preview /> : <ExtraPrizesA preview />}
      </ThumbFrame>
    ),
    skippable: false,
  },

  winners: {
    title: "Winners",
    variants: [
      { key: "A", label: "Winners A" },
      { key: "B", label: "Winners B" },
    ],
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <WinnersB preview /> : <WinnersA preview />}
      </ThumbFrame>
    ),
    skippable: false,
  },
  WhoYouHelp: {
    title: "How You Help",
    variants: [
      { key: "A", label: "How You Help A" },
      { key: "B", label: "How You Help B" },
    ],
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <WhoYouHelpB preview /> : <WhoYouHelpA preview />}
      </ThumbFrame>
    ),
    skippable: true,
  },

  feature: {
    title: "Featured",
    variants: [
      { key: "A", label: "Featured A" },
      { key: "B", label: "Featured B" },
    ],
    thumbnail: (key = "A") => (
      <ThumbFrame>
        {key === "B" ? <FeatureB preview /> : <FeatureA preview />}
      </ThumbFrame>
    ),
    skippable: true,
  },
};