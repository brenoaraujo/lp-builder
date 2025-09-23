// ========================= src/sections/Navbar.jsx =========================
// Two variants (A/B). Token classes only (no hardcoded colors).
// Uses shadcn Button. Respects data-* attributes for copy/display.

import React from "react";
import { Button } from "@/components/ui/button";

// Shared primitive used by both variants
function NavPrimitive({ data }) {
  const {
    logoSrc = "https://placehold.co/150x56",
    items = ["Menu", "Prizes", "Winners", "Rules", "Contact"],
    cta = { label: "BUY TICKETS", href: "#buy" },
  } = data || {};

  

  return (
    <div
      data-section="Navbar"              // <-- identify section
      data-display="yes"                 // <-- same pattern as your other sections
      className="w-[1440px] px-8 py-2 bg-Colors-background inline-flex flex-col justify-center items-center gap-2 overflow-hidden"
    >
      <div className="w-full max-w-[1280px] inline-flex justify-between items-center">
        {/* Logo */}
        <img className="w-36 h-14 rounded-lg" src={logoSrc} alt="Logo" />

        {/* Menu */}
        <nav className="flex justify-start items-center gap-1">
          {items.map((label, i) => (
            <div key={i} className="flex justify-start items-center gap-12">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground"
                data-copy="yes"             // <-- allow copy for button label
              >
                {label}
              </Button>
            </div>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex justify-start items-center gap-6">
          {cta?.label ? (
            <Button
              asChild
              size="sm"
              className="h-10 px-4 py-2 rounded-lg bg-Colors-foreground text-Colors-primary-foreground"
              data-copy="yes"               // <-- allow copy for CTA label
            >
              <a href={cta?.href || "#"}>{cta.label}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Variant A (clean)
export function NavbarA({ data }) {
  return <NavPrimitive data={data} />;
}

// Variant B (adds a subtle bottom border and tighter spacing)
export function NavbarB({ data }) {
  return (
    <div className="border-b border-Colors-border">
      <NavPrimitive data={data} />
    </div>
  );
}
// ===========================================================================