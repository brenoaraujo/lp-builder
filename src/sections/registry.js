// Single source of truth for section registry
import { HeroA, HeroB } from "./Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "./Winners.jsx";
import { FeatureA, FeatureB } from "./Feature.jsx";

export const SECTIONS = {
  hero: {
    label: "Hero",
    variants: [HeroA, HeroB],
    labels: ["Hero A", "Hero B"],
  },
  extraPrizes: {
    label: "Extra Prizes",
    variants: [ExtraPrizesA, ExtraPrizesB],
    labels: ["Extra Prizes A", "Extra Prizes B"],
  },
  winners: {
    label: "Winners",
    variants: [WinnersA, WinnersB],
    labels: ["Winners A", "Winners B"],
  },
  feature: {
    label: "Feature",
    variants: [FeatureA, FeatureB],     // or [SponsorsA] if only one
    labels: ["Feature A", "Feature B"],     // optional
  },
};