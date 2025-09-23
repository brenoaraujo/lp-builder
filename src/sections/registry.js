// Single source of truth for section registry
import { HeroA, HeroB } from "./Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "./Winners.jsx";
import { FeatureA, FeatureB } from "./Feature.jsx";
import { NavbarA, NavbarB } from "./Navbar.jsx";
import { FooterA, FooterB } from "./Footer.jsx";

export const SECTIONS = {
  Navbar: {
    id: "Navbar",
    label: "Navbar",
    variants: [NavbarA, NavbarB], // array, not object
    labels: ["Default", "Bordered"], // optional, for your VariantDock
    defaultVariant: 0,              // 0 = first item in the array
    hiddenInOnboarding: true,       // do not show in Onboarding
    hiddenInPicker: true,           // do not show in Add Section modal
    fixedPosition: "top",
  },
  Footer: {
    id: "Footer",
    label: "Footer",
    variants: [FooterA, FooterB],
    labels: ["Default", "Bordered"],
    defaultVariant: 0,
    hiddenInOnboarding: true,
    hiddenInPicker: true,
    fixedPosition: "bottom",
  },
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