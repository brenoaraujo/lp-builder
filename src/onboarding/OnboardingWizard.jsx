// src/onboarding/OnboardingWizard.jsx
// [Onboarding] Full-screen wizard on route "#/onboarding".
// Uses shadcn/ui primitives. Minimal changes from your version; just cleanup + fixes.

import React, { useEffect, useState, useRef, useCallback } from "react";

// [KEEP] Builder dependencies
import { SECTIONS, SECTION_ORDER } from "./sectionCatalog.jsx";
import { useBuilderOverrides } from "../context/BuilderOverridesContext.jsx";
import { useImageManager } from "../hooks/useImageManager.js";
// Removed useInviteRow import - now using props instead
import EditorForOnboarding from "./EditorForOnboarding.jsx";
import OnboardingActionBar from "./components/OnboardingActionBar.jsx";

import EditableSection from "../components/EditableSection.jsx";
import { HeroA, HeroB } from "../sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "../sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "../sections/Winners.jsx";
import { FeatureA, FeatureB, FeatureC } from "../sections/Feature.jsx";

import AutoScaler from "../components/AutoScaler.jsx";
import LogoUpload from "../components/LogoUpload.jsx";
import ImageManager from "../components/ImageManager.jsx";

// [KEEP] theme helpers
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readBaselineColors, applySavedTheme, clearInlineColorVars, applyAllColors } from "../theme-utils.js";

// ---- shadcn/ui imports (adjust paths if needed in your setup) ----
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

//--Icons --
import { ArrowRight, ArrowLeft, Search, Building2, Globe, User, HandHeart, Users, Rocket } from "lucide-react";

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

export function ReviewStep({ onFinish, onBack, stepIndex, inviteToken, inviteRow, onUpdateInvite }) {
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
    
    // Get images for the preview
    const { images, updateImage } = useImageManager(inviteRow, onUpdateInvite);


    const [themeMode, setThemeMode] = useState(readThemeMode());
    const [colors, setColors] = useState(() => {
        // Load from database first, then baseline
        if (inviteRow?.theme_json?.colors && Object.keys(inviteRow.theme_json.colors).length > 0) {
            return { ...BASELINE_COLORS, ...inviteRow.theme_json.colors };
        }
        return { ...BASELINE_COLORS };
    });

    // Debounced save to database
    const saveTimeoutRef = useRef(null);
    const lastSavedHashRef = useRef(null);
    
    const debouncedSave = useCallback((newColors) => {
        if (!inviteToken || !onUpdateInvite) return;
        
        // Create hash of the new colors to check if content actually changed
        const newHash = JSON.stringify(newColors);
        if (lastSavedHashRef.current === newHash) {
            return; // Skip save if content hasn't changed
        }
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await onUpdateInvite({
                    theme_json: {
                        colors: newColors,
                        fonts: inviteRow?.theme_json?.fonts || {}
                    }
                });
                lastSavedHashRef.current = newHash; // Update hash after successful save
            } catch (error) {
                console.error('Failed to save theme colors:', error);
            }
        }, 1000); // 1 second debounce
    }, [inviteToken, onUpdateInvite, inviteRow?.theme_json?.fonts]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);


    // live-apply when colors/mode change (unified resolver path)
    useEffect(() => {
        applyAllColors(colors || {}, overridesBySection || {});
    }, [colors, themeMode, overridesBySection]);

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
        setColors((c) => {
            const newColors = { ...c, [key]: v };
            debouncedSave(newColors); // Save to database
            return newColors;
        });
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
    const [bodyFontName, setBodyFontName] = useState(() => readFontToken("--font-primary") || "Inter");
    const [headingFontName, setHeadingFontName] = useState(() => readFontToken("--font-headline") || "Inter");
    const [numbersFontName, setNumbersFontName] = useState(() => readFontToken("--font-numbers") || "Inter");
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

    // save + finish (save to database)
    const finalize = async () => {
        // Save to database
        if (inviteToken && onUpdateInvite) {
            try {
                await onUpdateInvite({
                    theme_json: {
                        colors: colors,
                        fonts: inviteRow?.theme_json?.fonts || {}
                    }
                });
            } catch (error) {
                console.error('Failed to save theme colors on finish:', error);
            }
        }
        // Apply for immediate preview
        applyAllColors(colors || {}, overridesBySection || {});
        onFinish?.();
    };

    function resetReviewToDefaults() {
        // Update local state first so inputs reflect the baseline immediately
        setColors(BASELINE_COLORS);
        // Apply unified path
        applyAllColors(BASELINE_COLORS, overridesBySection || {});
    }

    // **THE IMPORTANT PART**: hard-reset to original tokens.css (no blue)
    const handleResetToDefaults = () => {
        // nuke inline overrides so tokens.css values become visible again
        clearInlineColorVars();
        const base = readBaselineColors();
        setColors(base);
        applyAllColors(base, overridesBySection || {});
    };

    return (
        <div className="flex flex-col lg:grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
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
            <div className="bg-white h-96 lg:h-auto">
                <AutoScaler designWidth={1440} targetWidth={520} maxHeight={1820}>
                    <div className="pointer-events-none select-none">
                        <ImageManager
                            sectionId="review-preview"
                            images={images}
                            onImageChange={updateImage}
                            compact={false}
                            hideControls={true}
                        >
                            <ComposedPreview overrides={overridesBySection} />
                        </ImageManager>
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
                <Comp 
                    preview 
                    {...(k.startsWith('extraContent_') ? { blockType: k } : {})}
                />
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
        </div>
    );
}

// [FIX] include Feature resolver
function resolveByVariant(sectionKey, variant = "A") {
    if (sectionKey === "hero") return variant === "B" ? HeroB : HeroA;
    if (sectionKey === "extraPrizes") return variant === "B" ? ExtraPrizesB : ExtraPrizesA;
    if (sectionKey === "winners") return variant === "B" ? WinnersB : WinnersA;
    if (sectionKey === "feature" || sectionKey.startsWith("extraContent_")) return variant === "B" ? FeatureB : variant === "C" 
    ? FeatureC 
    : FeatureA;
    return null;
}

/* =========================================================================
   Wizard Shell
   ========================================================================= */

function StepHeader({ currentIndex, isSaving }) {
    const pct = Math.round((currentIndex / (STEP_KEYS.length - 1)) * 100);
    return (
        <div className="bg-background/80 backdrop-blur border-b">
            <div className="mx-auto max-w-[1100px] py-3 flex items-center gap-2 sm:gap-3 justify-between box-border">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <img src="https://cdn.brandfetch.io/idOQ3T8fjd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1689300855088" alt="Logo" className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <div className="text-sm sm:text-lg font-semibold truncate">Landing Page Builder</div>
                    {isSaving && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <div className="w-24 sm:w-48">
                        <Progress value={pct}  />
                    </div>
                    <div className="text-xs text-muted-foreground w-8 sm:w-12 text-right ">
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
    "charityInfo",    // charity information collection
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
    "footerEdit",     // edit footer before review
    "review",         // review
];

// Scalable step configuration - defines completion requirements for each step
const STEP_CONFIG = {
    welcome: {
        type: 'info',
        completionCheck: () => true, // Always completed if we're here
        prerequisites: []
    },
    charityInfo: {
        type: 'form',
        completionCheck: (charityInfo) => !!(charityInfo?.charityName && charityInfo?.raffleType),
        prerequisites: []
    },
    hero: {
        type: 'section-choice',
        sectionKey: 'hero',
        completionCheck: (overrides) => !!(overrides?.hero?.variant),
        prerequisites: ['charityInfo']
    },
    heroEdit: {
        type: 'section-edit',
        sectionKey: 'hero',
        completionCheck: (overrides) => !!(overrides?.hero?.variant),
        prerequisites: ['hero']
    },
    extraPrizes: {
        type: 'section-choice',
        sectionKey: 'extraPrizes',
        completionCheck: (overrides) => !!(overrides?.extraPrizes?.variant),
        prerequisites: ['hero']
    },
    extraPrizesEdit: {
        type: 'section-edit',
        sectionKey: 'extraPrizes',
        completionCheck: (overrides) => !!(overrides?.extraPrizes?.variant),
        prerequisites: ['extraPrizes']
    },
    winners: {
        type: 'section-choice',
        sectionKey: 'winners',
        completionCheck: (overrides) => !!(overrides?.winners?.variant),
        prerequisites: ['extraPrizes']
    },
    winnersEdit: {
        type: 'section-edit',
        sectionKey: 'winners',
        completionCheck: (overrides) => !!(overrides?.winners?.variant),
        prerequisites: ['winners']
    },
    extraContentConfirmation: {
        type: 'info',
        completionCheck: () => true,
        prerequisites: ['winners']
    },
    feature: {
        type: 'section-choice',
        sectionKey: 'feature',
        completionCheck: (overrides) => !!(overrides?.feature?.variant),
        prerequisites: ['extraContentConfirmation']
    },
    featureEdit: {
        type: 'section-edit',
        sectionKey: 'feature',
        completionCheck: (overrides) => !!(overrides?.feature?.variant),
        prerequisites: ['feature']
    },
    addMoreSections: {
        type: 'info',
        completionCheck: () => true,
        prerequisites: ['feature']
    },
    footerEdit: {
        type: 'section-edit',
        sectionKey: 'Footer',
        completionCheck: () => true,
        prerequisites: ['addMoreSections']
    },
    review: {
        type: 'info',
        completionCheck: () => true,
      prerequisites: ['footerEdit']
    }
};

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

export default function OnboardingWizard({ inviteToken, inviteRow, onUpdateInvite }) {
    // Use the props instead of the hook to avoid conflicts
    const row = inviteRow;
    const updateInvite = onUpdateInvite;
    const {
        overridesBySection,
        setVisible,
        setVariant,
        setDisplay,
        setCopy,
        addExtraContentSection,
        getExtraContentSections,
    } = useBuilderOverrides();
    const { images, updateImage } = useImageManager(row, updateInvite);

    // Scalable function to check if prerequisites are met for a step
    const arePrerequisitesMet = useCallback((stepKey, savedOverrides, savedCharityInfo) => {
        const config = STEP_CONFIG[stepKey];
        if (!config || !config.prerequisites.length) return true;
        
        return config.prerequisites.every(prereqStep => {
            const prereqConfig = STEP_CONFIG[prereqStep];
            if (!prereqConfig) return true;
            
            if (prereqConfig.type === 'form') {
                return prereqConfig.completionCheck(savedCharityInfo);
            } else if (prereqConfig.type === 'section-choice' || prereqConfig.type === 'section-edit') {
                return prereqConfig.completionCheck(savedOverrides);
            } else {
                return prereqConfig.completionCheck();
            }
        });
    }, []);

    // Scalable function to determine the correct step to return to based on completion
    const getCorrectStepIndex = useCallback(() => {
        const savedStepIndex = row?.onboarding_json?.progress?.stepIndex || 0;
        const savedOverrides = row?.onboarding_json?.sectionOverrides || {};
        const savedCharityInfo = row?.onboarding_json?.charityInfo || {};
        
        // If no saved progress, start from beginning
        if (!savedStepIndex && !Object.keys(savedOverrides).length && !savedCharityInfo.charityName) {
            return 0;
        }
        
        // If user was on a high step, check if they can continue from there
        if (savedStepIndex > 0) {
            const currentStepKey = STEP_KEYS[savedStepIndex];
            const config = STEP_CONFIG[currentStepKey];
            
            if (config) {
                // Check if current step's prerequisites are met
                if (arePrerequisitesMet(currentStepKey, savedOverrides, savedCharityInfo)) {
                    // If prerequisites are met, allow them to continue from saved position
                    return Math.min(savedStepIndex, STEP_KEYS.length - 1);
                }
            }
        }
        
        // Find the first step where prerequisites are met but step is not completed
        for (let i = 0; i < STEP_KEYS.length; i++) {
            const stepKey = STEP_KEYS[i];
            const config = STEP_CONFIG[stepKey];
            
            if (!config) continue;
            
            // Check if prerequisites are met
            if (arePrerequisitesMet(stepKey, savedOverrides, savedCharityInfo)) {
                // Check if step is completed
                let isCompleted = false;
                if (config.type === 'form') {
                    isCompleted = config.completionCheck(savedCharityInfo);
                } else if (config.type === 'section-choice' || config.type === 'section-edit') {
                    isCompleted = config.completionCheck(savedOverrides);
                } else {
                    isCompleted = config.completionCheck();
                }
                
                // If not completed, this is where they should be
                if (!isCompleted) {
                    return i;
                }
            }
        }
        
        // If all steps are completed, return to review
        return STEP_KEYS.length - 1;
    }, [row?.onboarding_json, arePrerequisitesMet]);

    const [stepIndex, setStepIndex] = useState(() => {
        // Use completion-based logic but respect user's progress
        return getCorrectStepIndex();
    });
    const [currentExtraContentKey, setCurrentExtraContentKey] = useState(null);
    const [charityInfo, setCharityInfo] = useState(() => {
        return row?.onboarding_json?.charityInfo || {
            charityName: "",
            charityLogo: "",
            charitySite: "",
            submitterName: "",
            ascendRepresentative: "",
            ascendEmail: "",
            raffleType: "",
            campaignLaunchDate: ""
        };
    });
    const [isSaving, setIsSaving] = useState(false);
    const stepKey = STEP_KEYS[stepIndex];

    // Auto-save progress when step changes
    // Function to update status to in-progress when user starts onboarding
    const updateStatusToInProgress = useCallback(async () => {
        console.log('🔄 updateStatusToInProgress called:', { inviteToken: !!inviteToken, updateInvite: !!updateInvite, currentStatus: row?.status });
        if (!inviteToken || !updateInvite || row?.status !== 'invited') {
            console.log('❌ Status update skipped:', { inviteToken: !!inviteToken, updateInvite: !!updateInvite, currentStatus: row?.status });
            return;
        }
        
        try {
            console.log('✅ Updating status to in_progress...');
            await updateInvite({
                status: 'in_progress'
            });
            console.log('✅ Status updated successfully to in_progress');
        } catch (error) {
            console.warn('❌ Failed to update invite status:', error);
        }
    }, [inviteToken, updateInvite, row?.status]);

    const saveProgress = useCallback(async (newStepIndex) => {
        if (!inviteToken || !updateInvite) return;
        
        setIsSaving(true);
        try {
            // Update status to "in-progress" if it's still "invited" and user has started onboarding
            const shouldUpdateStatus = row?.status === 'invited' && newStepIndex > 0;
            
            await updateInvite({
                ...(shouldUpdateStatus && { status: 'in_progress' }),
                onboarding_json: {
                    ...row?.onboarding_json,
                    progress: {
                        stepIndex: newStepIndex,
                        lastSaved: new Date().toISOString()
                    },
                    // Also save current section overrides
                    sectionOverrides: overridesBySection,
                    // Save charity info
                    charityInfo: charityInfo
                }
            });
        } catch (error) {
            console.warn('Failed to save onboarding progress:', error);
        } finally {
            setIsSaving(false);
        }
    }, [inviteToken, updateInvite, row?.onboarding_json, overridesBySection, charityInfo, row?.status]);

    const advance = (steps = 1) => {
        const newIndex = Math.min(stepIndex + steps, STEP_KEYS.length - 1);
        console.log('🚀 Advance: Moving from step', stepIndex, 'to', newIndex, '(', STEP_KEYS[newIndex], ')');
        setStepIndex(newIndex);
        saveProgress(newIndex);
    };

    // Simple raffle type check
    const shouldHideForRaffleType = (raffleType) => {
        return raffleType === "Sweepstakes" || raffleType === "Prize Raffle";
    };


    // Simple charity name change handler
    const handleCharityNameChange = (value) => {
        setCharityInfo(prev => ({ ...prev, charityName: value }));
        // Update status to in-progress when user starts filling out charity info
        updateStatusToInProgress();
    };

    // [KEEP] ensure defaults so previews don't show as blank
    useEffect(() => {
        // Reset inline color overrides when onboarding starts
        // (Avoid LocalStorage color logic entirely)
        try { clearInlineColorVars(); } catch {}

        // nuke inline overrides so tokens.css values become visible again
        clearInlineColorVars();

        // show core sections by default on first mount
        ["hero", "extraPrizes", "winners"].forEach((k) => {
            if (overridesBySection[k]?.visible === undefined) setVisible(k, true);
        });

        // hide optional sections by default (including WhoYouHelp)
        if (overridesBySection.WhoYouHelp?.visible === undefined) {
            setVisible("WhoYouHelp", false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Note: Section overrides restoration is now handled by BuilderOverridesContext
    // which initializes from onboarding_json.sectionOverrides when skipSync=true

    // Separate effect for step restoration (only run once on mount)
    useEffect(() => {
        const correctStepIndex = getCorrectStepIndex();
        
        // Only update if the step index is different to prevent infinite loops
        if (correctStepIndex !== stepIndex) {
            // Debug: Show step completion status for all steps
            const savedOverrides = row?.onboarding_json?.sectionOverrides || {};
            const stepStatus = STEP_KEYS.map(stepKey => {
                const config = STEP_CONFIG[stepKey];
                if (!config) return { stepKey, status: 'no-config' };
                
                let isCompleted = false;
                if (config.type === 'form') {
                    isCompleted = config.completionCheck(row?.onboarding_json?.charityInfo);
                } else if (config.type === 'section-choice' || config.type === 'section-edit') {
                    isCompleted = config.completionCheck(savedOverrides);
                } else {
                    isCompleted = config.completionCheck();
                }
                
                const prerequisitesMet = arePrerequisitesMet(stepKey, savedOverrides, row?.onboarding_json?.charityInfo);
                
                return {
                    stepKey,
                    type: config.type,
                    isCompleted,
                    prerequisitesMet,
                    prerequisites: config.prerequisites
                };
            });

            console.log('🔄 Onboarding step restoration (Scalable):', {
                savedStepIndex: row?.onboarding_json?.progress?.stepIndex,
                currentStepIndex: stepIndex,
                correctStepIndex,
                stepKey: STEP_KEYS[correctStepIndex],
                stepStatus
            });
            setStepIndex(correctStepIndex);
        }
    }, []); // Only run once on mount

    // Auto-save when section overrides change (debounced)
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            if (Object.keys(overridesBySection).length > 0) {
                saveProgress(stepIndex);
            }
        }, 2000); // 2 second debounce for overrides changes
        
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [overridesBySection, stepIndex, saveProgress]);

    function next() {
        const newIndex = Math.min(stepIndex + 1, STEP_KEYS.length - 1);
        setStepIndex(newIndex);
        saveProgress(newIndex);
    }
    function back() {
        const newIndex = Math.max(stepIndex - 1, 0);
        setStepIndex(newIndex);
        saveProgress(newIndex);
    }
    async function finish() {
        try {
            
            // Save onboarding data to database
            await updateInvite({
                onboarding_json: {
                    ...row?.onboarding_json,
                    charityInfo: charityInfo
                },
                // IMPORTANT: Copy section overrides to overrides_json for main app
                overrides_json: overridesBySection,
                // IMPORTANT: Copy images from onboarding to main app
                images_json: images,
                status: 'submitted'
            });
            
            // Navigate to app with theme panel open
            window.location.hash = `#/app?invite=${inviteToken}&theme=open`;
        } catch (error) {
            console.error('Failed to save onboarding data:', error);
            // Still navigate even if save fails
            window.location.hash = `#/app?invite=${inviteToken}&theme=open`;
        }
    }

    return (
        <div className="min-h-screen flex flex-col text-foreground onboarding bg-gradient-to-b from-white from-0% via-white via-50% to-slate-50 to-50%">
            <StepHeader currentIndex={stepIndex} isSaving={isSaving} />
            <div className="flex-1 min-h-0 p-2 sm:p-4 flex justify-center box-border">
                <div className="w-full max-w-[1100px] h-full box-border">
                    {/* ============ STEP CONTENT ============ */}
                    {stepKey === "welcome" && (
                        <div className="items-center text-center max-w-[700px] mx-auto mt-40">

                            <div className="space-y-12 items-center">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black">Welcome! Let’s set up your page.</h1>
                                    <p className="text-muted-foreground">
                                        By walking through this onboarding you'll be able to choose which components to include on your site, customize text, images, colours and more!
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={next} className="p-6" style={{ backgroundColor: "#0099EB" }}>
                                        Start Onboarding

                                    </Button>
                                    {/*<Button variant="ghost" onClick={finish}>Skip for now</Button> */}
                                </div>

                            </div>
                           
                        </div>
                    )}

                    {stepKey === "charityInfo" && (
                        <div className="space-y-12">
                            <div className="space-y-1">

                                <h2 className="text-4xl font-medium mt-10">Setup your profile</h2>
                                <p className="text-base text-slate-500">
                                    Enter your charity information
                                </p>
                            </div>

                            <div className="grid grid-cols-[3fr_2fr] gap-8">
                                <div className="space-y-8 bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                                    {/* Charity Section */}
                                    <div className="space-y-6">
                                        <div className="border-b border-gray-200 pb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">Charity</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="charityName" className="text-muted-foreground">Name</Label>
                                                <Input
                                                    id="charityName"
                                                    placeholder="Enter charity name"
                                                    value={charityInfo.charityName}
                                                    onChange={(e) => handleCharityNameChange(e.target.value)}
                                                />
                                            </div>
                                            <LogoUpload
                                                value={charityInfo.charityLogo}
                                                onChange={(url) => setCharityInfo(prev => ({ ...prev, charityLogo: url }))}
                                                label="Logo"
                                                description="Upload your charity logo or enter a URL"
                                            />

                                            <div className="space-y-2">
                                                <Label htmlFor="charitySite" className="text-muted-foreground">Website</Label>
                                                <Input
                                                    id="charitySite"
                                                    placeholder="https://yourcharity.org"
                                                    value={charityInfo.charitySite}
                                                    onChange={(e) => setCharityInfo(prev => ({ ...prev, charitySite: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign Section */}
                                    <div className="space-y-6">
                                        <div className="border-b border-gray-200 pb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">Campaign</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="raffleType" className="text-muted-foreground">Raffle Type</Label>
                                                <Select
                                                    value={charityInfo.raffleType || ""}
                                                    onValueChange={async (value) => {
                                                        const updatedInfo = { ...charityInfo, raffleType: value };
                                                        setCharityInfo(updatedInfo);
                                                        // Save to database
                                                        try {
                                                            await updateInvite({
                                                                onboarding_json: {
                                                                    ...row?.onboarding_json,
                                                                    charityInfo: updatedInfo
                                                                }
                                                            });
                                                        } catch (error) {
                                                            console.warn("Failed to save charityInfo to database:", error);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger id="raffleType">
                                                        <SelectValue placeholder="Select raffle type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="50/50">50/50</SelectItem>
                                                        <SelectItem value="Prize Raffle">Prize Raffle</SelectItem>
                                                        <SelectItem value="Sweepstakes">Sweepstakes</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="campaignLaunchDate" className="text-muted-foreground">Launch Date</Label>
                                                <Input
                                                    id="campaignLaunchDate"
                                                    type="date"
                                                    value={charityInfo.campaignLaunchDate}
                                                    onChange={(e) => setCharityInfo(prev => ({ ...prev, campaignLaunchDate: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ascendRepresentative" className="text-muted-foreground">Ascend Client Services Representative</Label>
                                                <Input
                                                    id="ascendRepresentative"
                                                    placeholder="Enter full name"
                                                    value={charityInfo.ascendRepresentative}
                                                    onChange={(e) => setCharityInfo(prev => ({ ...prev, ascendRepresentative: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                 
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={next}
                                            disabled={!charityInfo.charityName || !charityInfo.raffleType}
                                        >
                                            Continue
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {/* Charity preview*/}
                                <div className="space-y-4">
                                    <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200 ">

                                        <div className="text-xs font-light text-center text-muted-foreground">PREVIEW</div>

                                        <div className="space-y-4">
                                            {(charityInfo.charityLogo || charityInfo.charitySite) && (
                                                <div className="flex justify-center">
                                                    {charityInfo.charityLogo ? (
                                                        <img
                                                            src={charityInfo.charityLogo}
                                                            alt="Charity Logo"
                                                            className="h-16 w-auto object-contain"
                                                            onError={(e) => {
                                                                // Try alternative logo sources if the first one fails
                                                                const cleanDomain = charityInfo.charitySite?.replace(/^https?:\/\//, '').replace(/^www\./, '');
                                                                if (cleanDomain) {
                                                                    // Try Clearbit logo service as fallback
                                                                    e.target.src = `https://logo.clearbit.com/${cleanDomain}`;
                                                                    e.target.onerror = () => {
                                                                        // If Clearbit also fails, try Google favicon
                                                                        e.target.src = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
                                                                        e.target.onerror = () => {
                                                                            // Final fallback - hide image and show icon
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'block';
                                                                        };
                                                                    };
                                                                } else {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'block';
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback favicon */}
                                                    {charityInfo.charitySite && (
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${charityInfo.charitySite.replace(/^https?:\/\//, '').replace(/^www\./, '')}&sz=64`}
                                                            alt="Charity Favicon"
                                                            className="h-16 w-16 object-contain"
                                                            style={{ display: charityInfo.charityLogo ? 'none' : 'block' }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    )}
                                                    {/* Fallback icon */}
                                                    <div
                                                        className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center"
                                                        style={{ display: 'none' }}
                                                    >
                                                        <Building2 className="h-8 w-8 text-gray-500" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-center space-y-2">
                                                <h3 className="font-semibold">
                                                    {charityInfo.charityName || "Your Charity Name"}
                                                </h3>
                                                {charityInfo.charitySite && (
                                                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                        <Globe className="h-3 w-3" />
                                                        <span>{charityInfo.charitySite}</span>
                                                    </div>
                                                )}

                                                {/* New fields in preview */}
                                                {charityInfo.raffleType && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Raffle Type:</span> {charityInfo.raffleType}
                                                    </div>
                                                )}

                                                {charityInfo.campaignLaunchDate && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Launch Date:</span> {new Date(charityInfo.campaignLaunchDate).toLocaleDateString()}
                                                    </div>
                                                )}

                                                {charityInfo.ascendRepresentative && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Ascend Rep:</span> {charityInfo.ascendRepresentative}
                                                    </div>
                                                )}

                                                {charityInfo.ascendEmail && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Email:</span> {charityInfo.ascendEmail}
                                                    </div>
                                                )}

                                               
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {stepKey === "hero" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                               
                                <h2 className="text-4xl font-medium">Choose Hero Layout</h2>
                                <p className="text-base text-slate-500">
                                    Select your preferred hero format
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="hero"
                                onPicked={() => { /* selection only; advance via bar */ }}
                            />
                        </div>
                    )}

                    {stepKey === "heroEdit" && (
                        <div className="space-y-12 h-full min-h-0">
                            <div className="space-y-1">
                               
                                <h2 className="text-4xl font-medium">Edit Hero Section</h2>
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
                                    onImageChange={updateImage}
                                    images={images}
                                    raffleType={charityInfo.raffleType}
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
                               
                                <h2 className="text-4xl font-medium">Choose Extra Prizes Layout</h2>
                                <p className="text-base text-slate-500">
                                    The extra prizes section will highlight early bird and consolation prize details.
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="extraPrizes"
                                onPicked={() => { /* selection only; advance via bar */ }}
                            />

                            {/* Skip section button */}
                            
                        </div>
                    )}

                    {stepKey === "extraPrizesEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                
                                <h2 className="text-4xl font-medium">Edit Extra Prizes Section</h2>
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
                                onImageChange={updateImage}
                                images={images}
                                raffleType={charityInfo.raffleType}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />

                           
                        </div>
                    )}

                    {stepKey === "winners" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                              
                                <h2 className="text-4xl font-medium">Choose Winners Layout</h2>
                                <p className="text-base text-slate-500">
                                    Select your preferred winners format.
                                </p>
                            </div>
                            <VariantCarousel
                                sectionKey="winners"
                                onPicked={() => { /* selection only; advance via bar */ }}
                            />
                        </div>
                    )}

                    {stepKey === "winnersEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                               
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
                                onImageChange={updateImage}
                                images={images}
                                raffleType={charityInfo.raffleType}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "extraContentConfirmation" && (
                        <div className="space-y-12 ">
                            <div className="space-y-1">
                              
                                <h2 className="text-4xl font-medium">Would you like to add extra content to your page?</h2>
                                <p className="text-base text-slate-500">
                                    Extra content sections allow you to further personalize your site, here are some examples of how extra content sections can be used:
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 rounded-lg border border-gray-200 bg-white shadow-md p-12">
                                <div className="p-6">
                                    <div className="space-y-4 text-center">
                                        <div className="flex justify-center">
                                            <HandHeart className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-lg font-semibold">How You Help</div>
                                            <p className="text-sm text-slate-600">
                                                Explain how proceeds will support the charity or cause.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-4 text-center">
                                        <div className="flex justify-center">

                                            <Users className="w-8 h-8" />

                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-lg font-semibold">Raffle Sponsors</div>
                                            <p className="text-sm text-slate-600">
                                                Showcase the sponsors who make your raffle possible.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-4 text-center">
                                        <div className="flex justify-center">

                                            <Rocket className="w-8 h-8" />

                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-lg font-semibold">More Raffle Details</div>
                                            <p className="text-sm text-slate-600">
                                                Add information such as memberships, features, or other key details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions handled by global onboarding action bar */}
                        </div>
                    )}

                    {stepKey === "feature" && currentExtraContentKey && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                
                                <h2 className="text-4xl font-medium">Choose Extra Content Layout</h2>
                                <p className="text-base text-slate-500">Select your preferred extra content format.</p>
                            </div>
                            <VariantCarousel sectionKey={currentExtraContentKey} onPicked={() => { /* selection only; advance via bar */ }} />
                            
                        </div>
                    )}

                    {stepKey === "featureEdit" && currentExtraContentKey && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                               
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
                                onImageChange={updateImage}
                                images={images}
                                raffleType={charityInfo.raffleType}
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />
                        </div>
                    )}

                    {stepKey === "addMoreSections" && (
                        <div className="space-y-12 ">
                            <div className="space-y-1">
                               

                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <div className="max-w-[720px] rounded-lg border border-gray-200 bg-white shadow-md p-12 text-center items-center justify-center">
                                    <div className="space-y-1 pb-10">
                                        <h2 className="text-3xl font-medium">Add more sections?</h2>
                                        <p className="text-base text-slate-500">
                                            You can add additional content sections to make your page even more engaging
                                        </p>
                                    </div>
                                   

                                </div>
                            </div>

                        </div>
                    )}

                    {stepKey === "footerEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                               
                                <h2 className="text-4xl font-medium">Edit Footer</h2>
                                <p className="text-base text-slate-500">Customize your footer content before finishing.</p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="Footer"
                                variantKey={SECTIONS?.Footer?.defaultVariant === 1 ? "B" : "A"}
                                overrides={overridesBySection.Footer}
                                onTogglePart={(id, v) => setDisplay("Footer", id, v)}
                                onCopyChange={(id, t) => setCopy("Footer", id, t)}
                                onImageChange={updateImage}
                                images={images}
                                raffleType={charityInfo.raffleType}
                                onSaveNext={finish}
                            />
                          
                        </div>
                    )}


                    {stepKey === "review" && (
                        <ReviewStep 
                            onFinish={finish} 
                            onBack={back} 
                            stepIndex={stepIndex}
                            inviteToken={inviteToken}
                            inviteRow={row}
                            onUpdateInvite={updateInvite}
                        />
                    )}
                </div>
            </div>
            {/* Global onboarding action bar (hidden on welcome and charityInfo which has its own form footer) */}
            {(stepKey !== "welcome" && stepKey !== "charityInfo") && (() => {
              // compute dynamic label and disabled state
              let nextLabel = "Next";
              let nextDisabled = false;
              if (stepKey === "hero") nextDisabled = !(overridesBySection?.hero?.variant);
              if (stepKey === "extraPrizes") nextDisabled = !(overridesBySection?.extraPrizes?.variant);
              if (stepKey === "winners") nextDisabled = !(overridesBySection?.winners?.variant);
              if (stepKey === "feature") nextDisabled = currentExtraContentKey ? !(overridesBySection?.[currentExtraContentKey]?.variant) : true;
              if (stepKey === "extraContentConfirmation" || stepKey === "addMoreSections") nextLabel = "Yes, add extra content";
              if (stepKey === "footerEdit") nextLabel = "Finish";

              const handleSkip = () => {
                if (stepKey === "extraPrizes") {
                  setVisible("extraPrizes", false);
                  setStepIndex(STEP_KEYS.indexOf("extraPrizesEdit"));
                } else if (stepKey === "feature") {
                  setStepIndex(STEP_KEYS.indexOf("footerEdit"));
                } else if (stepKey === "extraContentConfirmation") {
                  setStepIndex(STEP_KEYS.indexOf("footerEdit"));
                } else if (stepKey === "addMoreSections") {
                  setStepIndex(STEP_KEYS.indexOf("footerEdit"));
                } else {
                  next();
                }
              };

              const handleNext = () => {
                if (stepKey === "extraContentConfirmation" || stepKey === "addMoreSections") {
                  const newKey = addExtraContentSection();
                  setCurrentExtraContentKey(newKey);
                  setStepIndex(STEP_KEYS.indexOf("feature"));
                  return;
                }
                if (stepKey === "footerEdit") {
                  finish();
                  return;
                }
                next();
              };

              const showSkip = stepKey === "extraPrizes" || stepKey === "feature" || stepKey === "extraContentConfirmation" || stepKey === "addMoreSections";

              return (
                <OnboardingActionBar
                  showBack={stepIndex > 0}
                  showSkip={showSkip}
                  nextDisabled={nextDisabled}
                  nextLabel={nextLabel}
                  onBack={back}
                  onSkip={handleSkip}
                  onNext={handleNext}
                />
              );
            })()}
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
        console.log('🎯 VariantCarousel: Choosing variant', { sectionKey, key });
        setVariant(sectionKey, key);
        onPicked?.(key);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 p-1">
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