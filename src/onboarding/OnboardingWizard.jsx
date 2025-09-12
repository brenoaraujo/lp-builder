// src/onboarding/OnboardingWizard.jsx
// [Onboarding] NEW - Full-screen wizard on route "#/onboarding".
// Uses shadcn/ui primitives (Dialog elements not required since it's full-screen).

import React, { useEffect, useMemo, useState } from "react";


import { SECTIONS, SECTION_ORDER } from "./sectionCatalog.jsx";
import { useBuilderOverrides } from "../context/BuilderOverridesContext.jsx";
import EditorForOnboarding from "./EditorForOnboarding.jsx";

import EditableSection from "../components/EditableSection.jsx";
import { HeroA, HeroB } from "../sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "../sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "../sections/Winners.jsx";
import { FeatureA, FeatureB } from "../sections/Feature.jsx";

import AutoScaler from "../components/AutoScaler.jsx";


// ---- shadcn/ui imports (adjust paths if needed in your setup) ----
import { Button } from "@/components/ui/button";           // shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

//--Icons --
import { X, Plus, ChevronDown, ArrowRight, ArrowLeft, Pencil } from "lucide-react";



// [Onboarding] tiny helper for hash-route navigation
function goToRoot() { window.location.hash = "/"; }
function goToOnboarding() { window.location.hash = "/onboarding"; }

const STEP_KEYS = [
    "welcome",
    "hero",           // 2. choose
    "heroEdit",       // 3. edit
    "extraPrizes",    // 4. choose
    "extraPrizesEdit",// 5. edit
    "winners",        // 6. choose
    "winnersEdit",    // 7. edit
    "feature",        // 6. choose
    "featureEdit",    // 7. edit
    "review"          // 8. review
];


const PREVIEW_WIDTH = 420;   // 👈 tweak this
const PREVIEW_MAX_H = 420;

// helpers
const toArray = (x) =>
    Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : [];

const slugify = (s = "") =>
    String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const normalizeCopyParts = (list) =>
    toArray(list)
        .map((p) => {
            const id = p.id ?? p.copyId ?? p.key ?? slugify(p.label);
            return id ? { ...p, id } : null;
        })
        .filter(Boolean);



function StepHeader({ currentIndex }) {
    const pct = Math.round((currentIndex / (STEP_KEYS.length - 1)) * 100);
    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b ">
            <div className="mx-auto  max-w-[1100px]  py-3 flex items-center gap-3 justify-between box-border">
                <div className="text-xl font-bold">LP BUILDER</div>
                <div className="flex items-center gap-2">
                    <div className="w-48">
                        <Progress value={pct} />
                    </div>
                    <div className="text-xs text-muted-foreground w-12 text-right">{pct}%</div>
                </div>
            </div>
        </div>
    );
}

// [Onboarding] universal right-side editor that matches your data-* approach
// [Onboarding][REPLACE] Safer editor with fallbacks



// [Onboarding][REPLACE] compact scroller for many variants
function VariantCarousel({ sectionKey, onPicked }) {
    const { overridesBySection, setVariant } = useBuilderOverrides();
    const def = SECTIONS[sectionKey] || { variants: [], thumbnail: () => null, title: sectionKey };
    const state = overridesBySection?.[sectionKey] || {};
    const variants = Array.isArray(def.variants) ? def.variants : [];
    const active = state.variant ?? null;




    if (variants.length === 0) return null;

    const choose = (key) => {
        setVariant(sectionKey, key);
        onPicked?.(key);
    };


    return (
        <div className="flex gap-3  p-1 ">
            {variants.map(v => (
                <Card
                    key={v.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => choose(v.key)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choose(v.key)}
                    className={[
                        "w-full cursor-pointer transition shadow-lg transition  duration-800 ease-in-out-sine hover:-translate-y-2 hover:shadow-xl",
                        active === v.key ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-500"
                    ].join(" ")}
                >
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm border-b py-2">{v.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 text-center">
                        {typeof def.thumbnail === "function"
                            ? def.thumbnail(v.key, state)
                            : (v.render ? v.render(state) : null)}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


function resolveByVariant(sectionKey, variant = "A") {
    if (sectionKey === "hero") return variant === "B" ? HeroB : HeroA;
    if (sectionKey === "extraPrizes") return variant === "B" ? ExtraPrizesB : ExtraPrizesA;
    if (sectionKey === "winners") return variant === "B" ? WinnersB : WinnersA;
    return null;
}

export default function OnboardingWizard() {
    const { overridesBySection, setVisible, setVariant, setDisplay, setCopy } = useBuilderOverrides();
    const [stepIndex, setStepIndex] = useState(0);
    const stepKey = STEP_KEYS[stepIndex];
    const advance = (steps = 1) =>
        setStepIndex((i) => Math.min(i + steps, STEP_KEYS.length - 1));

    // [Onboarding] ensure defaults so previews don't show as blank
    useEffect(() => {
        // show all sections by default on first mount
        SECTION_ORDER.forEach(k => {
            if (overridesBySection[k]?.visible === undefined) setVisible(k, true);
        });
        // preselect hero variant A if none
        //if (!overridesBySection.hero?.variant) {
        // default to A
        //}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function next() {
        setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1));
    }
    function back() {
        setStepIndex(i => Math.max(i - 1, 0));
    }
    function finish() {
        try {
            localStorage.setItem("onboardingCompleted", "1");
        } catch { }

        // strip any ?wizard=1 so shared links don't reopen the wizard
        const url = new URL(window.location.href);
        url.searchParams.delete("wizard");
        history.replaceState(null, "", url.toString());

        // go to builder shell
        window.location.hash = "/";
    }

    return (

        <div className="min-h-screen flex flex-col bg-slate-50 text-foreground onboarding">
            <StepHeader currentIndex={stepIndex} />

            <div className="flex-1 min-h-0 p-4 flex justify-center box-border">
                <div className="w-full max-w-[1100px] h-full box-border ">
                    {/* STEP CONTENT */}
                    {stepKey === "welcome" && (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-bold">Welcome! Let’s set up your page.</h1>
                                <p className="text-muted-foreground">
                                    We’ll pick a Hero layout, then turn sections on/off and tweak copy.
                                    Your live builder updates instantly and will be ready when you finish.
                                </p>
                                <div className="flex gap-3">
                                    <Button onClick={next}>Start</Button>
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
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Choose Hero Layout</h2>
                                <p className="text-base text-slate-500">Select how your hero section will looks like </p>
                            </div>
                            <VariantCarousel
                                sectionKey="hero"
                                onPicked={() => setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1))}

                            />
                        </div>
                    )}


                    {stepKey === "heroEdit" && (
                        <div className="space-y-12 h-full min-h-0">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Edit Hero components</h2>
                                <p className="text-base text-slate-500">Customize your hero by removing and change components copy </p>
                            </div>
                            <div className="h-full min-h-0">
                            <EditorForOnboarding
                                sectionKey="hero"
                                variantKey={overridesBySection.hero?.variant || "A"}
                                overrides={overridesBySection.hero}
                                onTogglePart={(id, visible) => setDisplay("hero", id, visible)}
                                onCopyChange={(id, text) => setCopy("hero", id, text)}
                                onSaveNext={() => setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1))}
                            />
                            </div>
                        </div>
                    )}


                    {stepKey === "extraPrizes" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Choose Extra Prizes Layout</h2>
                                <p className="text-base text-slate-500">Select how your Extra Prizes section will looks like </p>
                            </div>

                            <VariantCarousel sectionKey="extraPrizes" onPicked={() => setStepIndex(i => i + 1)} />
                        </div>
                    )}


                    {stepKey === "extraPrizesEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Edit Extra Prizes Components</h2>
                                <p className="text-base text-slate-500">Customize your Extra Prizes by removing and change components copy </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="extraPrizes"
                                variantKey={overridesBySection.extraPrizes?.variant || "A"}
                                overrides={overridesBySection.extraPrizes}
                                onTogglePart={(id, v) => setDisplay("extraPrizes", id, v)}
                                onCopyChange={(id, t) => setCopy("extraPrizes", id, t)}
                                onSaveNext={() => setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1))}
                            />
                        </div>
                    )}


                    {stepKey === "winners" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Choose Winners Layout</h2>
                                <p className="text-base text-slate-500">Select how your Winners section will looks like</p>
                            </div>
                            <VariantCarousel sectionKey="winners" onPicked={() => setStepIndex(i => i + 1)} />
                        </div>
                    )}


                    {stepKey === "winnersEdit" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Edit Winners Components</h2>
                                <p className="text-base text-slate-500">Customize your Winners components by removing and change components copy </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="winners"
                                variantKey={overridesBySection.winners?.variant || "A"}
                                overrides={overridesBySection.winners}
                                onTogglePart={(id, v) => setDisplay("winners", id, v)}
                                onCopyChange={(id, t) => setCopy("winners", id, t)}
                                onSaveNext={() => setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1))}
                            />
                        </div>
                    )}

                    {stepKey === "feature" && (
                        <div className="space-y-12">
                            <div className="space-y-1">
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
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
                                <Button variant="link" onClick={back} disabled={stepIndex === 0} className="text-slate-500 !p-0"><ArrowLeft />Back</Button>
                                <h2 className="text-4xl font-medium">Edit Feature Components</h2>
                                <p className="text-base text-slate-500">Customize your section components by removing and change components copy </p>
                            </div>
                            <EditorForOnboarding
                                sectionKey="feature"
                                variantKey={overridesBySection.winners?.variant || "A"}
                                overrides={overridesBySection.winners}
                                onTogglePart={(id, v) => setDisplay("feature", id, v)}
                                onCopyChange={(id, t) => setCopy("feature", id, t)}
                                onSaveNext={() => setStepIndex(i => Math.min(i + 1, STEP_KEYS.length - 1))}
                            />
                        </div>
                    )}

                    {stepKey === "review" && (
                        <div className="space-y-12">
                            <h2 className="text-2xl font-semibold">Review & Finish</h2>
                            <Card>
                                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    {SECTION_ORDER.map(k => {
                                        const s = SECTIONS[k];
                                        const v = (overridesBySection[k]?.variant) || s.variants[0]?.key || "default";
                                        const vis = (overridesBySection[k]?.visible !== false);
                                        return (
                                            <div key={k} className="flex items-start gap-3">
                                                <div className="font-medium min-w-36">{s.title}</div>
                                                <div className="flex-1">
                                                    <div>Visible: {vis ? "Yes" : "No"}</div>
                                                    {s.variants.length > 1 && <div>Variant: {v}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                            <div className="flex gap-3">
                                <Button onClick={finish}>Finish</Button>
                                <Button variant="outline" onClick={() => window.localStorage.removeItem("onboardingCompleted")}>
                                    Reset completion flag
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Nav buttons
                    <div className="flex justify-end pt-4">

                        <div className="flex gap-2">
                            {stepIndex < STEP_KEYS.length - 1 ? (
                                <Button onClick={next}>Next</Button>
                            ) : (
                                <Button onClick={finish}>Finish</Button>
                            )}
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

