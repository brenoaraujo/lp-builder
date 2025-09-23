import React from "react";

function FooterPrimitive({ data }) {
  const {
    phoneText = "To place your order over the phone call 1-833-804-6262",
    oddsText = "Actual odds depend on the number of tickets sold",
    licenseText = "BC Gaming Event Licence",
    helpText = "Problem Gambling Help Line 1-888-795-6111 www.bcresponsiblegambling.ca",
    sloganText = "Know Your Limit, play within it",
    ageText = "19+",
    responsabilityText =
      "Must be 18 years of age or older to play. Play responsibly. For problem gambling support, please visit Ontario Gambling Helpline (1-866-531-2600) www.connexontario.ca",
    brandName = "Brand Name",
    brandLicense = "Lottery Licence RAF#1439950",
    links = [
      "About Us",
      "Rules of Play",
      "Winners",
      "Share Feedback",
      "Partners",
      "FAQs",
      "Contact Us",
      "Privacy Policy",
    ],
    raisedText = "Over $1,527,883,947 Raised For Our Partners",
    copyright =
      "Copyright © 2025, ASCEND FUNDRAISING SOLUTIONS. All Rights Reserved.",
    language = "English",
  } = data || {};

  return (
    <div
      data-section="Footer"
      
      className="w-[1440px] bg-Colors-background inline-flex flex-col justify-start items-center gap-4 font-primary"
    >
      <div className="w-full max-w-[1280px] flex flex-col justify-start items-start gap-6">
        <div className="self-stretch h-0"/>
        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] border-Colors-border" />

        <div className="self-stretch inline-flex justify-between items-center" data-display="yes" data-label="Sell by Phone">
          <div
            className="text-center justify-start text-Colors-foreground text-base font-bold leading-tight"
             
          >
            {phoneText}
          </div>
          <div className="flex justify-start items-center gap-2" >
            <div className="text-center justify-start text-Colors-foreground text-sm font-normal leading-none" >
              We accept
            </div>
            {/* Payment pills as placeholders using neutral tokens */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-20 h-12 relative">
                <div className="w-20 h-12 left-0 top-0 absolute bg-white rounded border border-Colors-border" />
              </div>
            ))}
          </div>
        </div>

        <div className="self-stretch outline outline-1 border-zinc-900 flex flex-col justify-start items-start" data-display="yes" data-label="BC Rules">
          <div className="self-stretch p-2.5 bg-white inline-flex justify-between items-center overflow-hidden">
            <div className="justify-start text-black text-sm font-normal leading-relaxed" >
              {oddsText}
            </div>
            <div className="justify-start text-black text-sm font-normal leading-relaxed" >
              {licenseText}
            </div>
          </div>
          <div className="self-stretch p-2.5 bg-black inline-flex justify-between items-center overflow-hidden">
            <div className="justify-start text-white text-sm font-normal leading-tight" >
              {helpText}
            </div>
            <div className="justify-start text-white text-xl font-bold leading-relaxed font-headline">
              {sloganText}
            </div>
            <div className="justify-start text-white text-sm font-normal leading-relaxed" >
              {ageText}
            </div>
          </div>
        </div>

        <div className="self-stretch px-60 py-6 bg-Colors-alt-background flex flex-col justify-start items-center gap-2" data-display="yes" data-label="ON Rules">
          <div className="flex flex-col justify-start items-start gap-2.5">
            <div className="text-center justify-start text-Colors-alt-foreground text-sm font-normal leading-tight" >
              {responsabilityText}
            </div>
          </div>
        </div>

        <div className="self-stretch inline-flex justify-between items-center">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-4">
            <div className="flex flex-col justify-start items-start gap-1">
              <div className="justify-start text-Colors-foreground text-xl font-bold leading-relaxed font-headline"  >
                {brandName}
              </div>
              <div className="justify-start text-Colors-foreground text-sm font-normal leading-tight"  >
                {brandLicense}
              </div>
            </div>
            <div className="w-72 flex flex-col justify-start items-start gap-3" >
              <div className="self-stretch h-12 inline-flex justify-start items-center gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={i % 2 === 0 ? "w-8 h-8 bg-Colors-foreground" : "w-4 h-4 bg-Colors-background"} />
                ))}
              </div>
            </div>
            <div data-description="false" data-label="false" data-state="Default" className="w-32 flex flex-col justify-start items-start gap-2" >
              <div className="self-stretch h-10 px-4 py-2 bg-Colors-background rounded-md outline outline-1 outline-offset-[-1px] border-Colors-border inline-flex justify-start items-center gap-2 overflow-hidden">
                <div className="flex-1 justify-start text-Colors-foreground text-sm font-medium leading-tight"  >
                  {language}
                </div>
                <div className="w-4 h-4 relative opacity-50 overflow-hidden">
                  <div className="w-1.5 h-2.5 left-[4.67px] top-[2.67px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-Colors-foreground" />
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex flex-col justify-start items-start gap-4">
            <div className="flex flex-col justify-start items-start gap-8">
              <div className="w-80 inline-flex justify-start items-start gap-6 flex-wrap content-start">
                {links.map((t, i) => (
                  <div
                    key={i}
                    className="w-36 text-right justify-start text-Colors-foreground text-sm font-medium leading-none"
                     
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] border-Colors-border"></div>
        <div className="self-stretch py-4 inline-flex justify-between items-center">
          <div className="w-4 h-6 bg-Colors-foreground" />
          <div className="w-4 h-2.5 bg-Colors-foreground" />
          <div className="w-4 h-4 bg-Colors-foreground" />
          <div className="w-3.5 h-4 bg-Colors-foreground" />
          <div className="w-4 h-6 bg-Colors-foreground" />
          <div className="w-4 h-4 bg-Colors-foreground" />
          <div className="w-3.5 h-4 bg-Colors-foreground" />
          <div className="w-28 h-[4.97px] bg-Colors-foreground" />
          <div className="w-3 h-1 bg-Colors-foreground" />
          <div className="inline-flex flex-col justify-start items-end gap-1">
            <div className="w-[508px] text-right justify-start text-Colors-foreground text-sm font-bold leading-none"  >
              {raisedText}
            </div>
            <div className="text-right justify-start text-Colors-foreground text-xs font-normal leading-none"  >
              {copyright}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FooterA({ data }) {
  return <FooterPrimitive data={data} />;
}

export function FooterB({ data }) {
  return (
    <div className="border-t border-Colors-border">
      <FooterPrimitive data={data} />
    </div>
  );
}


