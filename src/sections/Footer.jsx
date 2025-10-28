import React from "react";
import { ChevronDown } from "lucide-react";

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
    charityName = "",
    charityLogo = "",
    brandLicense = "",
    links = [
      "About Us",
      "Rules of Play",
      "Winners",
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
        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] bg-Colors-muted-background" />

        <div className="self-stretch inline-flex justify-between items-center w-full">
          {/*<div
            className="text-center justify-start text-Colors-foreground text-base font-bold leading-tight"
             
          >
            {phoneText}
          </div>*/}
          <div className="flex justify-center items-center gap-2 w-full text-center " >
            <div className="text-center justify-start text-Colors-foreground text-sm font-normal leading-none" >
              We accept
            </div>
            {/* Payment icons */}
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Visa" data-id="pay-visa" data-payment="true">
              <img src="/icons/visa.svg" alt="Visa" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Visa Debit" data-id="pay-visa-debit" data-payment="true">
              <img src="/icons/visa-debit.svg" alt="Visa Debit" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Mastercard" data-id="pay-mastercard" data-payment="true">
              <img src="/icons/master.svg" alt="Mastercard" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Mastercard Debit" data-id="pay-mastercard-debit" data-payment="true">
              <img src="/icons/master-debit.svg" alt="Mastercard Debit" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Apple Pay" data-id="pay-apple-pay" data-payment="true">
              <img src="/icons/apple-pay.svg" alt="Apple Pay" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="American Express" data-id="pay-amex" data-payment="true">
              <img src="/icons/amex.svg" alt="American Express" className="h-full w-auto" />
            </div>
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Discover" data-id="pay-discover" data-payment="true">
              <img src="/icons/discover.svg" alt="Discover" className="h-full w-auto" />
            </div>      
            <div className="w-8 h-6 flex items-center justify-center" data-display="true" data-label="Maestro" data-id="pay-maestro" data-payment="true">
              <img src="/icons/maestro.svg" alt="Maestro" className="h-full w-auto" />
            </div>
          </div>
        </div>
{/* BC Rules 
        <div className="self-stretch outline outline-1 border-zinc-900 flex flex-col justify-start items-start" data-display="no" data-label="BC Rules">
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
        </div>*/}
{/* Ontario Rules
        <div className="self-stretch px-60 py-6 bg-Colors-alt-background flex flex-col justify-start items-center gap-2" data-display="yes" data-label="ON Rules">
          <div className="flex flex-col justify-start items-start gap-2.5">
            <div className="text-center justify-start text-Colors-alt-foreground text-sm font-normal leading-tight" >
              {responsabilityText}
            </div>
          </div>
        </div>*/}

        <div className="self-stretch inline-flex justify-between items-center">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-4">
            <div className="flex flex-col justify-start items-start gap-1">
              {/* Charity Logo */}
              {charityLogo && (
                <div className="mb-2">
                  <img 
                    src={charityLogo} 
                    alt={`${charityName || brandName} logo`}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="justify-start text-Colors-foreground text-xl font-bold leading-relaxed font-headline"  >
                {charityName || brandName}
              </div>
              <div className="justify-start text-Colors-foreground text-sm font-normal leading-tight" data-display="yes" data-label="Lottery Licence"  >
                Lottery Licence : <span className="font-bold" data-copy="yes" data-label="Lottery Licence"  >{brandLicense}</span>
              </div>
            </div>
            <div className="w-72 flex flex-col justify-start items-start gap-3" >
              <div className="self-stretch h-12 inline-flex justify-start items-center gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={i % 2 === 0 ? "w-8 h-8 bg-Colors-foreground" : "w-4 h-4 bg-Colors-background"} />
                ))}
              </div>
            </div>
            {/* Language
            <div data-description="false" data-label="false" data-state="Default" className="w-32 flex flex-col justify-start items-start gap-2" >
              <div className="self-stretch h-10 px-4 py-2 bg-Colors-background rounded-md outline outline-1 outline-offset-[-1px] bg-Colors-muted-background inline-flex justify-start items-center gap-2 overflow-hidden">
                <div className="flex-1 justify-start text-Colors-foreground text-sm font-medium leading-tight"  >
                  {language}
                  
                </div>
                <div className="w-4 h-4 relative opacity-50 overflow-hidden">
                  <ChevronDown />
                </div>
              </div>
            </div> */}
          </div>

          <div className="inline-flex flex-col justify-start items-start gap-4">
            <div className="flex flex-col justify-start items-start gap-8">
              <div className="w-80 inline-flex justify-start items-start gap-6 flex-wrap content-start">
                {links.map((t, i) => {
                  return (
                    <div
                      key={i}
                      className="w-36 text-right justify-start text-Colors-foreground text-sm font-medium leading-none"
                      data-display="yes"
                      data-label={t}
                      data-copy="true"
                      data-id={`footer-link-${i}`}
                      data-requirements={
                        t === "Contact Us" ? "email" :
                        t === "Rules of Play" ? "document" :
                        t === "FAQs" ? "document" :
                        t === "Privacy Policy" ? "url" :
                        undefined
                      }
                    >
                      {t}
                    </div>
                  );
                })}
              </div>
              
              {/* Footer Link Action URLs - Metadata only, not displayed */}
              {links.map((t, i) => {
                // Define which footer items get action URL inputs
                const itemsWithActionUrls = [
                 
                  "Rules of Play", 
                  
                  "FAQs",
                  "Contact Us",
                  "Privacy Policy"
                ];
                
                if (!itemsWithActionUrls.includes(t)) return null;
                
                return (
                  <div
                    key={`metadata-${i}`}
                    data-copy="true"
                    data-placeholder={
                      t === "Contact Us" ? "Customer Service Email" :
                      t === "Privacy Policy" ? "Privacy Policy URL" :
                      `${t} Url`
                    }
                    
                    data-id={`footer-link-${i}-action`}
                    data-control-id={`footer-link-${i}`}
                    data-max-chars="200"
                    style={{ display: 'none' }}
                  >
                   
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] bg-Colors-muted-background"></div>
        <div className="self-stretch py-4 inline-flex justify-end items-right">
          
          
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
  return <FooterPrimitive data={data} className="p-0 m-0" />;
}

export function FooterB({ data }) {
  return (
    <div className="border-t bg-Colors-muted-background">
      <FooterPrimitive data={data} />
    </div>
  );
}

