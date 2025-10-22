import React from "react";
import { Button } from "@/components/ui/button";

export default function OnboardingActionBar({
  showBack = false,
  showSkip = false,
  nextDisabled = false,
  nextLabel = "Next",
  onBack,
  onSkip,
  onNext,
}) {
  return (
    <div className="sticky bottom-0 z-30 w-full border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <Button variant="outline" size="lg" className="p-6" onClick={onBack} disabled={!showBack}>Back</Button>
        <div className="ml-auto flex items-center gap-2">
          {showSkip && <Button variant="ghost" size="lg" className="p-6" onClick={onSkip}>No, skip this step</Button>}
          <Button onClick={onNext} size="lg" className="p-6" disabled={!!nextDisabled}>{nextLabel}</Button>
        </div>
      </div>
    </div>
  );
}


