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
// [KEEP] Feature (assumes ../sections/Feature.jsx exists)
import { FeatureA, FeatureB } from "../sections/Feature.jsx";

import AutoScaler from "../components/AutoScaler.jsx";

// [KEEP] theme helpers
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readBaselineColors, applySavedTheme } from "../theme-utils.js";

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
        setTimeout(() => {
            if (location.hash.includes("onboarding")) {
                window.location.replace("#/"); // robust hash nav
            }
        }, 0);
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
                        <p className="text-base text-slate-500">Select colors and fonts</p>
                    </div>
                </div>

                {/* Typography (unchanged UI, just uses handlePickFont) */}
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <div className="mb-4 text-md font-semibold">Typography</div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Body */}
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

                            {/* Heading */}
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

                            {/* Numbers */}
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
                    </div>

                    {/* Colors */}
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
    return (
        <div className="mx-auto">
            <SectionPreview k="hero" state={overrides.hero} />
            <SectionPreview k="extraPrizes" state={overrides.extraPrizes} />
            <SectionPreview k="winners" state={overrides.winners} />
            <SectionPreview k="feature" state={overrides.feature} />
        </div>
    );
}

// [FIX] include Feature resolver
function resolveByVariant(sectionKey, variant = "A") {
    if (sectionKey === "hero") return variant === "B" ? HeroB : HeroA;
    if (sectionKey === "extraPrizes") return variant === "B" ? ExtraPrizesB : ExtraPrizesA;
    if (sectionKey === "winners") return variant === "B" ? WinnersB : WinnersA;
    if (sectionKey === "feature") return variant === "B" ? FeatureB : FeatureA;
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
                <div className="text-xl font-bold">LP BUILDER</div>
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
    "feature",        // choose
    "featureEdit",    // edit
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
    } = useBuilderOverrides();

    const [stepIndex, setStepIndex] = useState(0);
    const stepKey = STEP_KEYS[stepIndex];

    const advance = (steps = 1) =>
        setStepIndex((i) => Math.min(i + steps, STEP_KEYS.length - 1));

    // [KEEP] ensure defaults so previews don't show as blank
    useEffect(() => {
        // show all sections by default on first mount
        SECTION_ORDER.forEach((k) => {
            if (overridesBySection[k]?.visible === undefined) setVisible(k, true);
        });
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
        window.location.hash = "/";
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
                                    We’ll pick a Hero layout, then turn sections on/off and tweak copy.
                                    Your live builder updates instantly and will be ready when you finish.
                                </p>
                                <div className="flex gap-3">
                                    <Button onClick={next}>
                                        Start
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" onClick={finish}>Skip for now</Button>
                                </div>
                            </div>
                            <Card>
                                <CardHeader><CardTitle>What you’ll do</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    <div>• Choose Hero A or B</div>
                                    <div>• Toggle Extra Prizes & Winners</div>
                                    <div>• Edit headline, CTAs, and labels</div>
                                    <div>• Review and finish</div>
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
                                    Select how your hero section will looks like
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
                                <h2 className="text-4xl font-medium">Edit Hero components</h2>
                                <p className="text-base text-slate-500">
                                    Customize your hero by removing and change components copy
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
                                    Select how your Extra Prizes section will looks like
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
                                <h2 className="text-4xl font-medium">Edit Extra Prizes Components</h2>
                                <p className="text-base text-slate-500">
                                    Customize your Extra Prizes by removing and change components copy
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
                                    Select how your Winners section will looks like
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
                                <h2 className="text-4xl font-medium">Edit Winners Components</h2>
                                <p className="text-base text-slate-500">
                                    Customize your Winners components by removing and change components copy
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

                    {stepKey === "feature" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Choose Feature Layout</h2>
                                <p className="text-base text-slate-500">Add custom content to your page</p>
                            </div>
                            <VariantCarousel sectionKey="feature" onPicked={() => advance(1)} />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setVisible("feature", false); // hide this section
                                    advance(2); // skip its edit step as well
                                }}
                            >
                                Skip this section
                            </Button>
                        </div>
                    )}

                    {stepKey === "featureEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                <h2 className="text-4xl font-medium">Edit Feature Components</h2>
                                <p className="text-base text-slate-500">
                                    Customize your section components by removing and change components copy
                                </p>
                            </div>
                            {/* [FIX] was using winners overrides by mistake */}
                            <EditorForOnboarding
                                sectionKey="feature"
                                variantKey={overridesBySection.feature?.variant || "A"}
                                overrides={overridesBySection.feature}
                                onTogglePart={(id, v) => setDisplay("feature", id, v)}
                                onCopyChange={(id, t) => setCopy("feature", id, t)}
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
    const def =
        SECTIONS[sectionKey] || { variants: [], thumbnail: () => null, title: sectionKey };
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
                    <CardContent className="py-3 text-center">
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