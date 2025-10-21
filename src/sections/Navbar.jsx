// ========================= src/sections/Navbar.jsx =========================
// Two variants (A/B). Token classes only (no hardcoded colors).
// Uses shadcn Button. Respects data-* attributes for copy/display.

import React from "react";
import { Button } from "@/components/ui/button";

// Shared primitive used by both variants
function NavPrimitive({ data }) {
  const {
    logoSrc = "/images/ascend-light.svg",
    charityLogo = "",
    items = ["Lottery", "Prizes", "Winners"],
    cta = { label: "BUY TICKETS", href: "#buy" },
  } = data || {};

  // Let ImageManager handle the logo image completely
  // It will set the src to custom uploaded image or default image

  return (
    <div
      data-section="Navbar"              // <-- identify section
                  // <-- same pattern as your other sections
      className="w-[1440px] px-8 py-2 bg-Colors-background inline-flex flex-col justify-center items-center gap-2 overflow-hidden "
    >
      <div className="w-full max-w-[1280px] inline-flex justify-between items-center">
        {/* Logo */}
        <img 
          className=" max-w-[144px] max-h-[56px] rounded-lg" 
          src={charityLogo || "/images/ascend-light.svg"}
          alt="Logo"
          data-image="navbar-logo"
          data-size="144×56"
          data-default-image="/images/ascend-light.svg"
          data-label="Navbar Logo"
        />

        {/* Menu */}
        <nav className="flex justify-start items-center gap-1">
          {/* navbar items 
            <div  className="flex justify-start items-center gap-4">
              <Button variant="ghost" size="sm" className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground" data-maxchars="40" data-copy data-display="yes"   data-label="Item 01" >Lottery</Button>
              <Button variant="ghost" size="sm" className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground" data-maxchars="40" data-copy data-display="yes"      data-label="Item 02" >Partners</Button>
              <Button variant="ghost" size="sm" className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground" data-maxchars="40" data-copy data-display="yes"      data-label="Item 03" >Winners</Button>
              <Button variant="ghost" size="sm" className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground" data-maxchars="40" data-copy data-display="yes"      data-label="Item 04" >About</Button>
              <Button variant="ghost" size="sm" className="h-10 px-4 py-2 bg-transparent rounded-md text-Colors-foreground" data-maxchars="40" data-copy data-display="yes"      data-label="Item 05" >Contact</Button>
              
              
            </div>
          */}
        </nav>

        {/* CTA */}
        <div className="flex justify-start items-center gap-6">
          {cta?.label ? (
            <Button
              asChild
              size="sm"
              className="h-10 px-4 py-2 rounded-lg bg-Colors-primary text-Colors-primary-foreground"
                         // <-- allow copy for CTA label
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