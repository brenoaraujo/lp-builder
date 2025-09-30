// src/onboarding/OnboardingWizard.jsx
// [Onboarding] Full-screen wizard on route "#/onboarding".
// Uses shadcn/ui primitives. Minimal changes from your version; just cleanup + fixes.

import React, { useEffect, useState } from "react";

// [KEEP] Builder dependencies
import { SECTIONS, SECTION_ORDER } from "./sectionCatalog.jsx";
import { useBuilderOverrides } from "../context/BuilderOverridesContext.jsx";
import EditorForOnboarding from "./EditorForOnboarding.jsx";

import EditableSection from "../components/EditableSection.jsx";
import { HeroA, HeroB } from "../sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "../sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "../sections/Winners.jsx";   
import { WhoYouHelpA, WhoYouHelpB } from "../sections/WhoYouHelp.jsx";
import { FeatureA, FeatureB } from "../sections/Feature.jsx";

import AutoScaler from "../components/AutoScaler.jsx";

// [KEEP] theme helpers
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readBaselineColors, applySavedTheme, clearInlineColorVars } from "../theme-utils.js";

// ---- shadcn/ui imports (adjust paths if needed in your setup) ----
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

//--Icons --
import { ArrowRight, ArrowLeft } from "lucide-react";

/* =========================================================================
   Small utilities (colors + fonts)
   ========================================================================= */

// [KEEP] Simple color role picker used in Review step
function ColorRole({ label, value, onChange }) {
    return (
        <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-28 rounded-md border px-2 text-sm font-mono"
                />
            </div>
        </div>
    );
}

// [ADD] Helper to read the first family from a CSS token like: "Inter", ui-sans-serif, ...
const readFontToken = (cssVar) => {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
    if (!raw) return "";
    // Get first family and strip quotes
    const first = raw.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
    return first;
};

// [KEEP] Small curated list (safe + fast). Add more if you want.
const FONT_OPTIONS = [

    { label: "Inter", value: "Inter", gf: { family: "Inter", axis: "wght@400;600;700" } },
    { label: "Montserrat", value: "Montserrat", gf: { family: "Montserrat", axis: "wght@400;600" } },
    { label: "Poppins", value: "Poppins", gf: { family: "Poppins", axis: "wght@400;600" } },
    { label: "Roboto", value: "Roboto", gf: { family: "Roboto", axis: "wght@400;700" } },
    { label: "Oswald", value: "Oswald", gf: { family: "Oswald", axis: "wght@400;700" } },



];

/* =========================================================================
   Review Step (Design)
   ========================================================================= */

export function ReviewStep({ onFinish, onBack, stepIndex }) {
    // --- tiny helpers ---

    const BASELINE_COLORS = {
        background: "#ffffff",
        primary: "#000000",
        secondary: "#F1F5F9",     // ← your “secondary” (previously “accent”)
        "alt-background": "#f0f0f9",
        border: "#e4e4e7",
    };



    const readThemeMode = () => {
        const el = document.documentElement;
        return el.dataset?.theme || (el.classList.contains("dark") ? "dark" : "light");
    };
    const getCSSVar = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();

    // pull builder overrides for the preview (as you had)
    const { overridesBySection } = useBuilderOverrides();


    const [themeMode, setThemeMode] = useState(readThemeMode());
    const [colors, setColors] = useState(() => ({
        ...BASELINE_COLORS,
        ...(JSON.parse(localStorage.getItem("theme.colors") || "{}")),
    }));


    // live-apply when colors/mode change
    useEffect(() => {
        const vars = buildThemeVars(colors, themeMode);
        setCSSVars(document.documentElement, "colors", vars);
    }, [colors, themeMode]);

    // keep in sync if user flips OS / app mode
    useEffect(() => {
        const id = setInterval(() => {
            const m = readThemeMode();
            if (m !== themeMode) setThemeMode(m);
        }, 500);
        return () => clearInterval(id);
    }, [themeMode]);

    // hex guard
    const setRole = (key) => (hex) => {
        const v = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex : colors[key];
        setColors((c) => ({ ...c, [key]: v }));
    };

    // fonts UI bits (unchanged from your version)
    const FONT_OPTIONS = [
        { label: "Inter", value: "Inter", gf: { family: "Inter", axis: "wght@400;600;700" } },
        { label: "Montserrat", value: "Montserrat", gf: { family: "Montserrat", axis: "wght@400;600" } },
        { label: "Poppins", value: "Poppins", gf: { family: "Poppins", axis: "wght@400;600" } },
        { label: "Roboto", value: "Roboto", gf: { family: "Roboto", axis: "wght@400;700" } },
        { label: "Oswald", value: "Oswald", gf: { family: "Oswald", axis: "wght@400;700" } },
    ];
    const readFontToken = (cssVar) => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        if (!raw) return "";
        return raw.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
    };
    const [bodyFontName, setBodyFontName] = useState(() => readFontToken("--font-primary"));
    const [headingFontName, setHeadingFontName] = useState(() => readFontToken("--font-headline"));
    const [numbersFontName, setNumbersFontName] = useState(() => readFontToken("--font-numbers"));
    const [openBody, setOpenBody] = useState(false);
    const [openHeading, setOpenHeading] = useState(false);
    const [openNumbers, setOpenNumbers] = useState(false);

    function handlePickFont(token, v) {
        const picked = FONT_OPTIONS.find((f) => f.value === v);
        if (picked?.gf) loadGoogleFont(picked.gf.family, picked.gf.axis);
        const chosen = v === "system" ? null : picked?.gf?.family || v;
        applyFonts({ [token]: chosen });
        if (token === "primary") setBodyFontName(chosen ?? readFontToken("--font-primary"));
        if (token === "headline") setHeadingFontName(chosen ?? readFontToken("--font-headline"));
        if (token === "numbers") setNumbersFontName(chosen ?? readFontToken("--font-numbers"));
    }

    // save + finish (unchanged logic, just uses our color map)
    const finalize = () => {
        try { localStorage.setItem("theme.colors", JSON.stringify(colors)); } catch { }
        setCSSVars(document.documentElement, "colors", buildThemeVars(colors, themeMode));
        applySavedTheme(themeMode);
        onFinish?.();
    };

    function resetReviewToDefaults() {
        try { localStorage.removeItem("theme.colors"); } catch { }

        // Update local state first so inputs reflect the baseline immediately
        setColors(BASELINE_COLORS);

        // Apply to document right now
        const mode = readThemeMode();
        const vars = buildThemeVars(BASELINE_COLORS, mode);
        setCSSVars(document.documentElement, "colors", vars);

        // Save baseline so Main app picks it up too
        try { localStorage.setItem("theme.colors", JSON.stringify(BASELINE_COLORS)); } catch { }

        // Optional: keep shadcn / app helpers in sync
        applySavedTheme(mode);
    }

    // **THE IMPORTANT PART**: hard-reset to original tokens.css (no blue)
    const handleResetToDefaults = () => {
        try { localStorage.removeItem("theme.colors"); } catch { }
        // nuke inline overrides so tokens.css values become visible again
        clearInlineColorVars();
        // fresh baseline captured on first load
        const base = readBaselineColors();
        setColors(base);
        // apply immediately in current mode
        const vars = buildThemeVars(base, readThemeMode());
        setCSSVars(document.documentElement, "colors", vars);
        // keep any shadcn components in sync
        applySavedTheme(readThemeMode());
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
            {/* Left column (controls) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Button variant="link" onClick={onBack} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back
                        </Button>
                        <h2 className="text-4xl font-medium">Design</h2>
                        <p className="text-base text-slate-500">Adjust colors to your brand. </p>
                    </div>
                </div>

                
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    {/* Typography (unchanged UI, just uses handlePickFont) -- DON'T REMOVE THIS FEATURE
                    <div className="mb-4">
                        <div className="mb-4 text-md font-semibold">Typography</div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            
                            <div className="space-y-2">
                                <Select open={openBody} onOpenChange={setOpenBody} onValueChange={(v) => handlePickFont("primary", v)}>
                                    <SelectTrigger className="rounded-2xl border px-4 py-3 outline-none items-left justify-between" onClick={() => setOpenBody(true)}>
                                        <div className="text-xs text-muted-foreground">Body</div>
                                        <div className="font-semibold tracking-wide">
                                            <SelectValue placeholder={(bodyFontName || "Select").toUpperCase()} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((f) => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            
                            <div className="space-y-2">
                                <Select open={openHeading} onOpenChange={setOpenHeading} onValueChange={(v) => handlePickFont("headline", v)}>
                                    <SelectTrigger className="rounded-2xl border px-4 py-3 outline-none flex items-center justify-between" onClick={() => setOpenHeading(true)}>
                                        <div className="text-xs text-muted-foreground">Heading</div>
                                        <div className="font-semibold tracking-wide">
                                            <SelectValue placeholder={(headingFontName || "Select").toUpperCase()} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((f) => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            
                            <div className="space-y-2">
                                <Select open={openNumbers} onOpenChange={setOpenNumbers} onValueChange={(v) => handlePickFont("numbers", v)}>
                                    <SelectTrigger className="rounded-2xl border px-4 py-3 outline-none flex items-center justify-between" onClick={() => setOpenNumbers(true)}>
                                        <div className="text-xs text-muted-foreground">Numbers</div>
                                        <div className="font-semibold tracking-wide">
                                            <SelectValue placeholder={(numbersFontName || "Select").toUpperCase()} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((f) => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>*/}

                    
                    <div className="mb-2">
                        <div className="mb-4 text-md font-semibold">Colors</div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <ColorRole label="Primary" value={colors.primary} onChange={setRole("primary")} />
                            <ColorRole label="Secondary" value={colors.secondary} onChange={setRole("secondary")} />
                            <ColorRole label="Background" value={colors.background} onChange={setRole("background")} />
                            <ColorRole label="Alternative" value={colors["alt-background"]} onChange={setRole("alt-background")} />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button onClick={finalize}>Finish &amp; save</Button>
                        <Button variant="outline" onClick={resetReviewToDefaults}>
                            Reset to defaults
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right column (preview) */}
            <div className="bg-white">
                <AutoScaler designWidth={1440} targetWidth={520} maxHeight={1820}>
                    <div className="pointer-events-none select-none">
                        <ComposedPreview overrides={overridesBySection} />
                    </div>
                </AutoScaler>
            </div>
        </div>
    );
}

/* =========================================================================
   Preview + Variants
   ========================================================================= */

function SectionPreview({ k, state }) {
    if (state?.visible === false) return null;
    const variant = state?.variant || "A";
    const Comp = resolveByVariant(k, variant);
    if (!Comp) return null;

    return (
        <div data-scope={k} className="mb-0 last:mb-0">
            <EditableSection
                discoverKey={`review:${k}:${variant}`}
                controls={state?.display || {}}
                copyValues={state?.copy || {}}
            >
                <Comp preview />
            </EditableSection>
        </div>
    );
}

function ComposedPreview({ overrides }) {
    // Get all extra content section keys
    const extraContentKeys = Object.keys(overrides).filter(key => key.startsWith('extraContent_'));
    
    return (
        <div className="mx-auto">
            <SectionPreview k="hero" state={overrides.hero} />
            <SectionPreview k="extraPrizes" state={overrides.extraPrizes} />
            <SectionPreview k="winners" state={overrides.winners} />
            {extraContentKeys.map(key => (
                <SectionPreview key={key} k={key} state={overrides[key]} />
            ))}
            <SectionPreview k="WhoYouHelp" state={overrides.WhoYouHelp} />
        </div>
    );
}

// [FIX] include Feature resolver
function resolveByVariant(sectionKey, variant = "A") {
    if (sectionKey === "hero") return variant === "B" ? HeroB : HeroA;
    if (sectionKey === "extraPrizes") return variant === "B" ? ExtraPrizesB : ExtraPrizesA;
    if (sectionKey === "winners") return variant === "B" ? WinnersB : WinnersA;
    if (sectionKey === "feature" || sectionKey.startsWith("extraContent_")) return variant === "B" ? FeatureB : FeatureA;
    if (sectionKey === "WhoYouHelp") return variant === "B" ? WhoYouHelpB : WhoYouHelpA;
    return null;
}

/* =========================================================================
   Wizard Shell
   ========================================================================= */

function StepHeader({ currentIndex }) {
    const pct = Math.round((currentIndex / (STEP_KEYS.length - 1)) * 100);
    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
            <div className="mx-auto max-w-[1100px] py-3 flex items-center gap-3 justify-between box-border">
                <div className="text-xl font-bold">Landing Page Builder</div>
                <div className="flex items-center gap-2">
                    <div className="w-48">
                        <Progress value={pct} />
                    </div>
                    <div className="text-xs text-muted-foreground w-12 text-right">
                        {pct}%
                    </div>
                </div>
            </div>
        </div>
    );
}

// [KEEP] Step keys + helpers
const STEP_KEYS = [
    "welcome",
    "hero",           // choose
    "heroEdit",       // edit
    "extraPrizes",    // choose
    "extraPrizesEdit",// edit
    "winners",        // choose
    "winnersEdit",    // edit
    "extraContentConfirmation", // new confirmation step
    "feature",        // choose
    "featureEdit",    // edit
    "addMoreSections", // option to add more sections
    "WhoYouHelp",     // choose (optional)
    "WhoYouHelpEdit", // edit (optional)
    "review",         // review
];

// [KEEP] tiny helpers
const toArray = (x) =>
    Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : [];

const slugify = (s = "") =>
    String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalizeCopyParts = (list) =>
    toArray(list)
        .map((p) => {
            const id = p.id ?? p.copyId ?? p.key ?? slugify(p.label);
            return id ? { ...p, id } : null;
        })
        .filter(Boolean);

/* =========================================================================
   Main: OnboardingWizard
   ========================================================================= */

export default function OnboardingWizard() {
    const {
        overridesBySection,
        setVisible,
        setVariant,
        setDisplay,
        setCopy,
        addExtraContentSection,
        getExtraContentSections,
    } = useBuilderOverrides();

    const [stepIndex, setStepIndex] = useState(0);
    const [currentExtraContentKey, setCurrentExtraContentKey] = useState(null);
    const stepKey = STEP_KEYS[stepIndex];

    const advance = (steps = 1) =>
        setStepIndex((i) => Math.min(i + steps, STEP_KEYS.length - 1));

    // [KEEP] ensure defaults so previews don't show as blank
    useEffect(() => {
        // Reset colors and fonts to defaults when onboarding starts
        try { 
            localStorage.removeItem("theme.colors"); 
            localStorage.removeItem("theme.fonts"); 
        } catch { }
        
        // nuke inline overrides so tokens.css values become visible again
        clearInlineColorVars();
        
        // show core sections by default on first mount
        ["hero", "extraPrizes", "winners"].forEach((k) => {
            if (overridesBySection[k]?.visible === undefined) setVisible(k, true);
        });
        
        // hide optional sections by default
        if (overridesBySection.WhoYouHelp?.visible === undefined) setVisible("WhoYouHelp", false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function next() {
        setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
    }
    function back() {
        setStepIndex((i) => Math.max(i - 1, 0));
    }
    function finish() {
        try {
            localStorage.setItem("onboardingCompleted", "1");
        } catch { }
        const url = new URL(window.location.href);
        url.searchParams.delete("wizard");
        history.replaceState(null, "", url.toString());
        location.replace("#/");
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-foreground onboarding">
            <StepHeader currentIndex={stepIndex} />
            <div className="flex-1 min-h-0 p-4 flex justify-center box-border">
                <div className="w-full max-w-[1100px] h-full box-border ">
                    {/* ============ STEP CONTENT ============ */}
                    {stepKey === "welcome" && (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-bold">Welcome! Let’s set up your page.</h1>
                                <p className="text-muted-foreground">
                                By walking through this document you'll be able to choose which components to include on your site, customize text, images, colours and more!
                                </p>
                                <div className="flex gap-3">
                                    <Button onClick={next}>
                                        Start
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                   {/*  <Button variant="ghost" onClick={finish}>Skip for now</Button> */}
                                </div>
                            </div>
                            <Card>
                                <CardHeader><CardTitle>What you’ll do</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    <div>• Provide charity information</div>
                                    <div>• Select site components</div>
                                    <div>• Customize language</div>
                                    <div>• Upload images and documents</div>
                                    <div>• Customize site colours</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {stepKey === "hero" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose Hero Layout</h2>
                                <p className="text-base text-slate-500">
                                Select your preferred hero format
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="hero"
                                onPicked={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "heroEdit" && (
                        <div className="space-y-12 h-full min-h-0">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit Hero Sections</h2>
                                <p className="text-base text-slate-500">
                                Customize your hero section by enabling desired components and adjusting copy.
                                </p>
                            </div>
                            <div className="h-full min-h-0">
                                <EditorForOnboarding
                                    sectionKey="hero"
                                    variantKey={overridesBySection.hero?.variant || "A"}
                                    overrides={overridesBySection.hero}
                                    onTogglePart={(id, visible) => setDisplay("hero", id, visible)}
                                    onCopyChange={(id, text) => setCopy("hero", id, text)}
                                    onSaveNext={() =>
                                        setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {stepKey === "extraPrizes" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose Extra Prizes Layout</h2>
                                <p className="text-base text-slate-500">
                                The extra prizes section will highlight early bird and consolation prize details.
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="extraPrizes"
                                onPicked={() => setStepIndex((i) => i + 1)}
                            />
                        </div>
                    )}

                    {stepKey === "extraPrizesEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit Extra Prizes Sections</h2>
                                <p className="text-base text-slate-500">
                                Customize your extra prizes section by enabling desired components and adjusting copy.
                                </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="extraPrizes"
                                variantKey={overridesBySection.extraPrizes?.variant || "A"}
                                overrides={overridesBySection.extraPrizes}
                                onTogglePart={(id, v) => setDisplay("extraPrizes", id, v)}
                                onCopyChange={(id, t) => setCopy("extraPrizes", id, t)}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "winners" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose Winners Layout</h2>
                                <p className="text-base text-slate-500">
                                Select your preferred winners format.
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="winners"
                                onPicked={() => setStepIndex((i) => i + 1)}
                            />
                        </div>
                    )}

                    {stepKey === "winnersEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit Winners Section</h2>
                                <p className="text-base text-slate-500">
                                Customize your winners section by enabling desired components and adjusting copy.
                                </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="winners"
                                variantKey={overridesBySection.winners?.variant || "A"}
                                overrides={overridesBySection.winners}
                                onTogglePart={(id, v) => setDisplay("winners", id, v)}
                                onCopyChange={(id, t) => setCopy("winners", id, t)}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "extraContentConfirmation" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Would you like to add an extra content sections?</h2>
                                <p className="text-base text-slate-500">
                                Extra content sections allow you to further personalize your site, her are some exampled of how extra content sections can be used:
                                </p>
                            </div>
                            
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="p-6">
                                    <div className="space-y-3">
                                        <div className="text-lg font-semibold">How You Help</div>
                                        <p className="text-sm text-slate-600">
                                        Highlight information about the benefitting charity or how the raffle proceeds will be utilized
                                        </p>
                                    </div>
                                </Card>
                                
                                <Card className="p-6">
                                    <div className="space-y-3">
                                        <div className="text-lg font-semibold">Raffle Sponsors</div>
                                        <p className="text-sm text-slate-600">
                                        Highlight raffle sponsors
                                        </p>
                                    </div>
                                </Card>
                                
                                <Card className="p-6">
                                    <div className="space-y-3">
                                        <div className="text-lg font-semibold">Extra Raffle Information</div>
                                        <p className="text-sm text-slate-600">
                                        Communicate more information about the raffle such as details about features like memberships
                                        </p>
                                    </div>
                                </Card>
                            </div>
                            
                            <div className="flex gap-4">
                                <Button 
                                    onClick={() => {
                                        // User wants to add extra content section, create the first one
                                        const newSectionKey = addExtraContentSection();
                                        // Store the current section key for the next steps
                                        setCurrentExtraContentKey(newSectionKey);
                                        advance(1);
                                    }}
                                    className="flex-1"
                                >
                                    Yes, add Extra Content section
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        // User doesn't want extra content section, skip to review
                                        setStepIndex(STEP_KEYS.indexOf("review")); // jump to review
                                    }}
                                    className="flex-1"
                                >
                                    No, skip Extra Content section
                                </Button>
                            </div>
                        </div>
                    )}

                    {stepKey === "feature" && currentExtraContentKey && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose Extra Content Layout</h2>
                                <p className="text-base text-slate-500">Select your preferred extra content format.</p>
                            </div>
                            <VariantCarousel sectionKey={currentExtraContentKey} onPicked={() => advance(1)} />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setVisible(currentExtraContentKey, false); // hide this section
                                    advance(2); // skip its edit step as well
                                }}
                            >
                                Skip this section
                            </Button>
                        </div>
                    )}

                    {stepKey === "featureEdit" && currentExtraContentKey && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit Extra Content Section</h2>
                                <p className="text-base text-slate-500">
                                    Customize your extra content section by enabling desired components and adjusting copy.
                                </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey={currentExtraContentKey}
                                variantKey={overridesBySection[currentExtraContentKey]?.variant || "A"}
                                overrides={overridesBySection[currentExtraContentKey]}
                                onTogglePart={(id, v) => setDisplay(currentExtraContentKey, id, v)}
                                onCopyChange={(id, t) => setCopy(currentExtraContentKey, id, t)}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "addMoreSections" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Add more sections?</h2>
                                <p className="text-base text-slate-500">
                                    You can add additional content sections to make your page even more engaging
                                </p>
                            </div>
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                                    <div className="space-y-3 text-center">
                                        <div className="text-lg font-semibold">Extra Content Section</div>
                                        <p className="text-sm text-slate-600">
                                            Add another extra content section to highlight additional content, features, or information.
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            className="w-full"
                                            onClick={() => {
                                                // Create a new extra content section and go to its selection
                                                const newSectionKey = addExtraContentSection();
                                                setCurrentExtraContentKey(newSectionKey);
                                                setStepIndex(STEP_KEYS.indexOf("feature"));
                                            }}
                                        >
                                            Add Another Extra Content Section
                                        </Button>
                                    </div>
                                </Card>
                                
                                <Card className="p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                                    <div className="space-y-3 text-center">
                                        <div className="text-lg font-semibold">How You Help Section</div>
                                        <p className="text-sm text-slate-600">
                                            Highlight information about the benefitting charity or how the raffle proceeds will be utilized.
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            className="w-full"
                                            onClick={() => {
                                                // Add WhoYouHelp section and go to its selection
                                                setVisible("WhoYouHelp", true);
                                                setStepIndex(STEP_KEYS.indexOf("WhoYouHelp"));
                                            }}
                                        >
                                            Add How You Help Section
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                            
                            <div className="flex gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        // User is done adding sections, go to review
                                        setStepIndex(STEP_KEYS.indexOf("review"));
                                    }}
                                    className="flex-1"
                                >
                                    I'm done, go to review
                                </Button>
                            </div>
                        </div>
                    )}

                    {stepKey === "WhoYouHelp" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose How You Help Layout</h2>
                                <p className="text-base text-slate-500">Add custom content to your page</p>
                            </div>
                            <VariantCarousel sectionKey="WhoYouHelp" onPicked={() => advance(1)} />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setVisible("WhoYouHelp", false); // hide this section
                                    advance(2); // skip its edit step as well
                                }}
                            >
                                Skip this section
                            </Button>
                        </div>
                    )}

                    {stepKey === "WhoYouHelpEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit How You Help Components</h2>
                                <p className="text-base text-slate-500">
                                    Customize your section components by removing and change components copy
                                </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="WhoYouHelp"
                                variantKey={overridesBySection.WhoYouHelp?.variant || "A"}
                                overrides={overridesBySection.WhoYouHelp}
                                onTogglePart={(id, v) => setDisplay("WhoYouHelp", id, v)}
                                onCopyChange={(id, t) => setCopy("WhoYouHelp", id, t)}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "review" && (
                        <ReviewStep onFinish={finish} onBack={back} stepIndex={stepIndex} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   Variant Carousel (compact)
   ========================================================================= */

function VariantCarousel({ sectionKey, onPicked }) {
    const { overridesBySection, setVariant } = useBuilderOverrides();
    
    // For dynamic extra content sections, use the feature section definition
    let def;
    if (sectionKey.startsWith('extraContent_')) {
        def = SECTIONS.feature || { variants: [], thumbnail: () => null, title: "Extra Content" };
    } else {
        def = SECTIONS[sectionKey] || { variants: [], thumbnail: () => null, title: sectionKey };
    }
    
    const state = overridesBySection?.[sectionKey] || {};
    const variants = Array.isArray(def.variants) ? def.variants : [];
    const active = state.variant ?? null;

    if (variants.length === 0) return null;

    const choose = (key) => {
        setVariant(sectionKey, key);
        onPicked?.(key);
    };

    return (
        <div className="flex gap-3 p-1">
            {variants.map((v) => (
                <Card
                    key={v.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => choose(v.key)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choose(v.key)}
                    className={[
                        "w-full cursor-pointer transition shadow-lg duration-200 hover:-translate-y-1 hover:shadow-xl",
                        active === v.key ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-500",
                    ].join(" ")}
                >
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm border-b py-2">{v.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 ">
                        {typeof def.thumbnail === "function"
                            ? def.thumbnail(v.key, state)
                            : v.render
                                ? v.render(state)
                                : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}