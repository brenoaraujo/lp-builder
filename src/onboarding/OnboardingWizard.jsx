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
import { FeatureA, FeatureB, FeatureC } from "../sections/Feature.jsx";

import AutoScaler from "../components/AutoScaler.jsx";
import LogoUpload from "../components/LogoUpload.jsx";
import { draftService } from "../lib/draftService.js";

// [KEEP] theme helpers
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readBaselineColors, applySavedTheme, clearInlineColorVars } from "../theme-utils.js";

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
        onFinish?.(colors, themeMode);
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

function StepHeader({ currentIndex, onStartOver }) {
    const pct = Math.round((currentIndex / (STEP_KEYS.length - 1)) * 100);
    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
            <div className="mx-auto max-w-[1100px] py-3 flex items-center gap-2 sm:gap-3 justify-between box-border">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <img src="https://cdn.brandfetch.io/idOQ3T8fjd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1689300855088" alt="Logo" className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <div className="text-sm sm:text-lg font-semibold truncate">Landing Page Builder</div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {onStartOver && currentIndex > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onStartOver}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Start Over
                        </Button>
                    )}
                    <div className="w-24 sm:w-48">
                        <Progress value={pct} />
                    </div>
                    <div className="text-xs text-muted-foreground w-8 sm:w-12 text-right">
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
    const [charityInfo, setCharityInfo] = useState({
        charityName: "",
        charityLogo: "",
        charitySite: "",
        submitterName: "",
        clientEmail: "",
        ascendRepresentative: "",
        raffleType: "",
        campaignLaunchDate: ""
    });

    // Progress saving key
    const PROGRESS_KEY = 'onboarding-progress';
    
    // Check if user is coming from a magic link (configurator route)
    const [existingDraftId, setExistingDraftId] = useState(null);
    const [isUpdatingExistingDraft, setIsUpdatingExistingDraft] = useState(false);

    // Save progress to localStorage
    const saveProgress = () => {
        try {
            const progress = {
                stepIndex,
                charityInfo,
                overridesBySection,
                currentExtraContentKey,
                searchQuery,
                showAdditionalFields,
                timestamp: Date.now()
            };
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        } catch (error) {
            console.warn('Failed to save progress:', error);
        }
    };

    // Load progress from localStorage
    const loadProgress = () => {
        try {
            const saved = localStorage.getItem(PROGRESS_KEY);
            if (saved) {
                const progress = JSON.parse(saved);
                // Only load if progress is less than 24 hours old
                if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
                    setStepIndex(progress.stepIndex || 0);
                    setCharityInfo(progress.charityInfo || charityInfo);
                    setCurrentExtraContentKey(progress.currentExtraContentKey || null);
                    setSearchQuery(progress.searchQuery || "");
                    setShowAdditionalFields(progress.showAdditionalFields || false);
                    
                    // Restore overrides
                    if (progress.overridesBySection) {
                        Object.entries(progress.overridesBySection).forEach(([section, overrides]) => {
                            if (overrides.visible !== undefined) setVisible(section, overrides.visible);
                            if (overrides.variant !== undefined) setVariant(section, overrides.variant);
                            if (overrides.display !== undefined) setDisplay(section, overrides.display);
                            if (overrides.copy !== undefined) setCopy(section, overrides.copy);
                        });
                    }
                    
                    return true; // Progress was loaded
                } else {
                    // Clear old progress
                    localStorage.removeItem(PROGRESS_KEY);
                }
            }
        } catch (error) {
            console.warn('Failed to load progress:', error);
            localStorage.removeItem(PROGRESS_KEY);
        }
        return false; // No progress was loaded
    };

    // Clear progress
    const clearProgress = () => {
        try {
            localStorage.removeItem(PROGRESS_KEY);
        } catch (error) {
            console.warn('Failed to clear progress:', error);
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const stepKey = STEP_KEYS[stepIndex];

    const advance = (steps = 1) =>
        setStepIndex((i) => Math.min(i + steps, STEP_KEYS.length - 1));

    // Simple raffle type check
    const shouldHideForRaffleType = (raffleType) => {
        return raffleType === "Sweepstakes" || raffleType === "Prize Raffle";
    };

    // Handle click outside and keyboard events for dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('charity-search-dropdown');
            const input = document.getElementById('charitySearch');
            
            if (dropdown && input && !dropdown.contains(event.target) && !input.contains(event.target)) {
                setIsDropdownOpen(false);
                setSearchResults([]);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
                setSearchResults([]);
            }
            if (event.key === 'Tab' && isDropdownOpen) {
                setIsDropdownOpen(false);
                setSearchResults([]);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDropdownOpen]);

    // Brandfetch search function with proper error handling
    const searchBrandfetch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            console.log('Searching Brandfetch for:', query);

            // Try Brandfetch API with correct format
            const apiKey = import.meta.env.VITE_BRANDFETCH_API_KEY || 'BPpPQFtnKE9MXwkbc8cvF7G3EzpasSp/FH6NVyfX2bk=';
            if (!apiKey) {
                throw new Error('Brandfetch API key not configured');
            }

            const response = await fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);

                // Handle different possible response structures
                let brands = [];
                if (data.brands) {
                    brands = data.brands;
                } else if (data.results) {
                    brands = data.results;
                } else if (Array.isArray(data)) {
                    brands = data;
                } else if (data.data) {
                    brands = data.data;
                }

                // Ensure each brand has a logo URL with preference for high-quality logos
                const brandsWithLogos = brands.map(brand => {
                    // Try to get the best quality logo available
                    let logoUrl = brand.logo || brand.image || brand.icon;

                    // If we have a logo URL, try to get a higher quality version
                    if (logoUrl) {
                        // Remove size parameters to get original quality
                        logoUrl = logoUrl.replace(/[?&](w|h|size|sz)=\d+/g, '');
                        // Some APIs use different size parameters
                        logoUrl = logoUrl.replace(/[?&](width|height)=\d+/g, '');
                    }

                    // Fallback to Clearbit if no logo found
                    if (!logoUrl && brand.domain) {
                        const cleanDomain = brand.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
                        logoUrl = `https://logo.clearbit.com/${cleanDomain}`;
                    }

                    return {
                        ...brand,
                        logo: logoUrl
                    };
                });

                setSearchResults(brandsWithLogos);
                setIsDropdownOpen(brandsWithLogos.length > 0);
            } else {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('Brandfetch API Error:', error);

            // Enhanced fallback for development/production
            const mockResults = [
                {
                    name: query,
                    domain: `https://${query.toLowerCase().replace(/\s+/g, '')}.org`,
                    logo: `https://logo.clearbit.com/${query.toLowerCase().replace(/\s+/g, '')}.org`
                }
            ];
            setSearchResults(mockResults);
            setIsDropdownOpen(mockResults.length > 0);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search function
    const [searchTimeout, setSearchTimeout] = useState(null);
    const handleSearchInput = (value) => {
        setSearchQuery(value);

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout for search
        const timeout = setTimeout(() => {
            searchBrandfetch(value);
        }, 500); // 500ms delay

        setSearchTimeout(timeout);
    };

    const handleInputFocus = () => {
        if (searchResults.length > 0) {
            setIsDropdownOpen(true);
        }
    };

    const selectBrand = (brand) => {
        console.log('Selected brand:', brand);
        console.log('Brand logo URL:', brand.logo);

        setCharityInfo({
            charityName: brand.name,
            charityLogo: brand.logo || '',
            charitySite: brand.domain,
            submitterName: charityInfo.submitterName,
            clientEmail: charityInfo.clientEmail,
            ascendRepresentative: charityInfo.ascendRepresentative,
            raffleType: charityInfo.raffleType,
            campaignLaunchDate: charityInfo.campaignLaunchDate
        });
        setSearchResults([]);
        setSearchQuery(brand.name);
        setIsDropdownOpen(false);
        setShowAdditionalFields(true); // Show additional fields when brand is selected
    };

    const handleEnterKey = () => {
        if (searchQuery.trim()) {
            setCharityInfo(prev => ({ ...prev, charityName: searchQuery }));
            setSearchResults([]);
            setIsDropdownOpen(false);
            setShowAdditionalFields(true); // Show additional fields when user presses enter
        }
    };

    // Load progress on mount and check for existing draft
    useEffect(() => {
        // Check if user is coming from a magic link (configurator route or onboarding with draftId)
        const hash = window.location.hash;
        const pathname = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const draftIdFromParams = urlParams.get('draftId');
        
        let draftId = null;
        
        // Check configurator route in PATH first (for magic links)
        const pathMatch = pathname.match(/\/configurator\/([^\/\?]+)/);
        if (pathMatch) {
            draftId = pathMatch[1];
        } else {
            // Check configurator route in HASH (for regular navigation)
            const configuratorMatch = hash.match(/#\/configurator\/([^?]+)/);
            if (configuratorMatch) {
                draftId = configuratorMatch[1];
            } else if (draftIdFromParams) {
                // Check URL search parameters
                draftId = draftIdFromParams;
            }
        }
        
        console.log('Draft ID detection:', { pathname, hash, draftIdFromParams, draftId, pathMatch });
        
        if (draftId) {
            setExistingDraftId(draftId);
            setIsUpdatingExistingDraft(true);
            
            // Don't create a new version here - just mark that onboarding was started
            // The actual draft update will happen when onboarding is completed
        }
        
        const progressLoaded = loadProgress();
        if (!progressLoaded) {
            // Only reset defaults if no progress was loaded
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save progress whenever key state changes
    useEffect(() => {
        saveProgress();
    }, [stepIndex, charityInfo, overridesBySection, currentExtraContentKey, searchQuery, showAdditionalFields]);

    function next() {
        setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
    }
    function back() {
        setStepIndex((i) => Math.max(i - 1, 0));
    }

    function startOver() {
        if (confirm('Are you sure you want to start over? This will clear all your progress.')) {
            clearProgress();
            setStepIndex(0);
            setCharityInfo({
                charityName: "",
                charityLogo: "",
                charitySite: "",
                submitterName: "",
                clientEmail: "",
                ascendRepresentative: "",
                raffleType: "",
                campaignLaunchDate: ""
            });
            setSearchQuery("");
            setShowAdditionalFields(false);
            setCurrentExtraContentKey(null);
            
            // Reset overrides to defaults
            ["hero", "extraPrizes", "winners"].forEach((k) => {
                setVisible(k, true);
            });
        }
    }
    async function finish(colors, themeMode) {
        try {
            // Validate required fields
            if (!charityInfo.clientEmail || !charityInfo.clientEmail.trim()) {
                alert('Please enter your email address to continue.');
                return;
            }

            if (!charityInfo.charityName || !charityInfo.charityName.trim()) {
                alert('Please enter a charity name to continue.');
                return;
            }

            // Create draft with current configuration
            const seedConfig = {
                charityInfo,
                overridesBySection,
                theme: {
                    colors: colors || {},
                    mode: themeMode || 'light'
                }
            };

            let result;
            
            if (isUpdatingExistingDraft && existingDraftId) {
                // Update existing draft with full configuration (version 3 - completed onboarding)
                console.log('Updating existing draft:', existingDraftId);
                result = await draftService.updateDraft(existingDraftId, 2, {
                    charityInfo,
                    overridesBySection,
                    theme: {
                        colors: colors || {},
                        mode: themeMode || 'light'
                    }
                });
                result.draftId = existingDraftId;
            } else {
                // Create new draft
                console.log('Creating new draft with email:', charityInfo.clientEmail);
                result = await draftService.createDraft(charityInfo.clientEmail.trim(), seedConfig);
            }
            
            // Mark onboarding as completed
            try {
                localStorage.setItem("onboardingCompleted", "1");
            } catch (error) {
                console.warn('Failed to mark onboarding as completed:', error);
            }
            
            // Clear progress since onboarding is complete
            clearProgress();
            
            // Simply refresh the page - let the app handle the routing
            console.log('Onboarding completed, refreshing page...');
            window.location.reload();
        } catch (error) {
            console.error('Failed to create draft:', error);
            alert('Failed to create draft. Please try again.');
        }
    }

    return (
        <div className="min-h-screen flex flex-col text-foreground onboarding bg-gradient-to-b from-white from-0% via-white via-50% to-slate-50 to-50%">
            <StepHeader currentIndex={stepIndex} onStartOver={startOver} />
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
                                    <Button onClick={next} className="p-6">
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
                                    {/* Charity Name Search Field */}
                                    <div className="space-y-2 ">
                                        <Label htmlFor="charitySearch" className="text-muted-foreground">Charity Name</Label>
                                        <div className="relative ">

                                            <Input
                                                id="charitySearch"
                                                placeholder="Search for your charity or enter name manually"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchInput(e.target.value)}
                                                onFocus={handleInputFocus}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleEnterKey();
                                                    }
                                                }}
                                                className=""
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Search Results Dropdown */}
                                    {isDropdownOpen && searchResults.length > 0 && (
                                        <div className="relative">
                                            <div 
                                                id="charity-search-dropdown"
                                                className="absolute top-0 left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                            >
                                                {searchResults.map((brand, index) => (
                                                    <div
                                                        key={index}
                                                        className="cursor-pointer hover:bg-gray-50 transition-colors p-3 border-b last:border-b-0"
                                                        onClick={() => selectBrand(brand)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Logo with fallback to favicon */}
                                                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                                                                {brand.logo ? (
                                                                    <img
                                                                        src={brand.logo}
                                                                        alt={`${brand.name} logo`}
                                                                        className="h-8 w-8 object-contain rounded"
                                                                        onError={(e) => {
                                                                            // Fallback to favicon if logo fails
                                                                            const domain = brand.domain || brand.website;
                                                                            if (domain) {
                                                                                const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
                                                                                e.target.src = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`;
                                                                            } else {
                                                                                e.target.style.display = 'none';
                                                                                e.target.nextSibling.style.display = 'block';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                {/* Fallback favicon */}
                                                                {brand.domain && (
                                                                    <img
                                                                        src={`https://www.google.com/s2/favicons?domain=${brand.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}&sz=32`}
                                                                        alt={`${brand.name} favicon`}
                                                                        className="h-6 w-6 object-contain"
                                                                        style={{ display: brand.logo ? 'none' : 'block' }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'block';
                                                                        }}
                                                                    />
                                                                )}
                                                                {/* Fallback icon */}
                                                                <div
                                                                    className="h-6 w-6 bg-gray-200 rounded flex items-center justify-center"
                                                                    style={{ display: 'none' }}
                                                                >
                                                                    <Building2 className="h-4 w-4 text-gray-500" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate text-gray-900">{brand.name}</p>
                                                                {brand.domain && (
                                                                    <p className="text-sm text-gray-500 truncate">{brand.domain}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Fields - Only shown after selection or enter */}
                                    {showAdditionalFields && (
                                        <div className="space-y-8">
                                            <LogoUpload
                                                value={charityInfo.charityLogo}
                                                onChange={(url) => setCharityInfo(prev => ({ ...prev, charityLogo: url }))}
                                                label="Charity Logo"
                                                description="Upload your charity logo or enter a URL"
                                            />

                                            <div className="space-y-2">
                                                <Label htmlFor="charitySite" className="text-muted-foreground">Charity Website</Label>
                                                <Input
                                                    id="charitySite"
                                                    placeholder="https://yourcharity.org"
                                                    value={charityInfo.charitySite}
                                                    onChange={(e) => setCharityInfo(prev => ({ ...prev, charitySite: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 ">
                                        <Label htmlFor="ascendRepresentative" className="text-muted-foreground">Ascend Client Services Representative</Label>
                                        <div className="relative">

                                            <Input
                                                id="ascendRepresentative"
                                                placeholder="Enter full name"
                                                value={charityInfo.ascendRepresentative}
                                                onChange={(e) => setCharityInfo(prev => ({ ...prev, ascendRepresentative: e.target.value }))}
                                                className=""
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="clientEmail" className="text-muted-foreground">Your Email Address *</Label>
                                        <div className="relative">
                                            <Input
                                                id="clientEmail"
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={charityInfo.clientEmail}
                                                onChange={(e) => setCharityInfo(prev => ({ ...prev, clientEmail: e.target.value }))}
                                                className=""
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Type of Raffle */}
                                    <div className="space-y-2">
                                        <Label htmlFor="raffleType" className="text-muted-foreground">Type of Raffle</Label>
                                        <Select
                                            value={charityInfo.raffleType}
                                            onValueChange={(value) => {
                                                const updatedInfo = { ...charityInfo, raffleType: value };
                                                setCharityInfo(updatedInfo);
                                                // Save immediately so RaffleRuleWrapper can read it
                                                try {
                                                    localStorage.setItem("charityInfo", JSON.stringify(updatedInfo));
                                                } catch (error) {
                                                    console.warn("Failed to save charityInfo to localStorage:", error);
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

                                    {/* Campaign Launch Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="campaignLaunchDate" className="text-muted-foreground">Campaign Launch Date</Label>
                                        <div className="relative">
                                            <Input
                                                id="campaignLaunchDate"
                                                type="date"
                                                value={charityInfo.campaignLaunchDate}
                                                onChange={(e) => setCharityInfo(prev => ({ ...prev, campaignLaunchDate: e.target.value }))}
                                                className=""
                                            />
                                        </div>
                                    </div>







                                    <div className="flex gap-3">
                                        <Button
                                            onClick={next}
                                            disabled={!charityInfo.charityName || !charityInfo.charityName}
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

                                                {charityInfo.clientEmail && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Your Email:</span> {charityInfo.clientEmail}
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

                            {/* Skip section button */}
                            <div className="flex ">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // Hide the extra prizes section and skip to next step
                                        setVisible("extraPrizes", false);
                                        setStepIndex((i) => i + 2); // Skip both extraPrizes and extraPrizesEdit
                                    }}
                                    className="p-6"
                                >
                                    Skip this section
                                </Button>
                            </div>
                        </div>
                    )}

                    {stepKey === "extraPrizesEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
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
                                onSaveNext={() =>
                                    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
                                }
                            />

                            {/* Skip section button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // Hide the extra prizes section and continue to next step
                                        setVisible("extraPrizes", false);
                                        setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
                                    }}
                                    className="p-6"
                                >
                                    Skip Section
                                </Button>
                            </div>
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
                        <div className="space-y-12 ">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
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

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => {
                                        // User wants to add extra content section, create the first one
                                        const newSectionKey = addExtraContentSection();
                                        // Store the current section key for the next steps
                                        setCurrentExtraContentKey(newSectionKey);
                                        advance(1);
                                    }}
                                    className=" p-6"
                                >
                                    Yes, add extra content

                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // User doesn't want extra content section, skip to review
                                        setStepIndex(STEP_KEYS.indexOf("review")); // jump to review
                                    }}
                                    className=" p-6"
                                >
                                    No, skip this step
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
                                variant="outline"
                                onClick={() => {
                                    setVisible(currentExtraContentKey, false); // hide this section
                                    advance(2); // skip its edit step as well
                                }}
                                className=" p-6"
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
                        <div className="space-y-12 ">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>

                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <div className="max-w-[720px] rounded-lg border border-gray-200 bg-white shadow-md p-12 text-center items-center justify-center">
                                    <div className="space-y-1 pb-10">
                                        <h2 className="text-3xl font-medium">Add more sections?</h2>
                                        <p className="text-base text-slate-500">
                                            You can add additional content sections to make your page even more engaging
                                        </p>
                                    </div>
                                    <div className="flex gap-4 justify-center items-center flex-col">

                                        <Button
                                            variant="default"
                                            className=" p-6 flex-row"
                                            onClick={() => {
                                                // Create a new extra content section and go to its selection
                                                const newSectionKey = addExtraContentSection();
                                                setCurrentExtraContentKey(newSectionKey);
                                                setStepIndex(STEP_KEYS.indexOf("feature"));
                                            }}
                                        >
                                            Add Extra Content
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                // User is done adding sections, go to review
                                                setStepIndex(STEP_KEYS.indexOf("review"));
                                            }}
                                            className="p-6"
                                        >
                                            Skip, go to review
                                        </Button>
                                    </div>

                                </div>
                            </div>

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