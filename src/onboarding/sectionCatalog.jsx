// src/onboarding/sectionCatalog.js
// [Onboarding] NEW - central registry for sections, variants and editable fields.

import React from "react";
import AutoScaler from "../components/AutoScaler.jsx";
import { HeroA, HeroB } from "../sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "../sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "../sections/Winners.jsx";

// [Onboarding] "Field descriptors" – keep these aligned with your data-* labels.
// You can expand them later as you add sections.
export const SECTION_ORDER = ["hero", "extraPrizes", "winners"];

export const SECTIONS = {
  hero: {
    title: "Hero",
    // Two layouts you already use: A and B
    variants: [
      { key: "A", label: "Hero A", render: (props) => <HeroA {...props} /> },
      { key: "B", label: "Hero B", render: (props) => <HeroB {...props} /> },
    ],
    copyFields: ["Headline", "Subheadline", "CTA Label"],     // <-- must be an array
    displayFields: ["Buy Now Button", "Legal Copy"],    
    thumbnail: (variantKey, overrides) => (
      <AutoScaler designWidth={1440} targetWidth={360} maxHeight={9999}>
        <div className="w-[1440px]">
          {variantKey === "B" ? <HeroB overrides={overrides} /> : <HeroA overrides={overrides} />}
        </div>
      </AutoScaler>
    ),

  },

  extraPrizes: {
    title: "Extra Prizes",
    variants: [
      { key: "A", label: "Layout A", render: (p) => <ExtraPrizesA {...p} /> },
      { key: "B", label: "Layout B", render: (p) => <ExtraPrizesB {...p} /> },
    ],
    copyFields: ["Section Label", "Headline"],                 // <-- array
    displayFields: ["Show Countdown", "Show CTA"],  
    
    thumbnail: (key, ov) => (
      <AutoScaler designWidth={1440} targetWidth={360} maxHeight={9999}>
        <div className="w-[1440px]">
          {key === "B" ? <ExtraPrizesB overrides={ov} /> : <ExtraPrizesA overrides={ov} />}
        </div>
      </AutoScaler>
    ),
  },

  winners: {
    title: "Winners",
    variants: [
      { key: "A", label: "Layout A", render: (p) => <WinnersA {...p} /> },
      { key: "B", label: "Layout B", render: (p) => <WinnersB {...p} /> },
    ],
    copyFields: ["Section Label", "Headline"],                 // <-- array
    displayFields: ["Show Table", "Show CTA"], 
    thumbnail: (key, ov) => (
      <AutoScaler designWidth={1440} targetWidth={360} maxHeight={9999}>
        <div className="w-[1440px]">
          {key === "B" ? <WinnersB overrides={ov} /> : <WinnersA overrides={ov} />}
        </div>
      </AutoScaler>
    ),
  },
};