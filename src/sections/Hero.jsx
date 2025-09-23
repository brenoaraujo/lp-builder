import { ArrowRight, Plus, Minus, ShoppingCart } from "lucide-react";

/* --------------------------------- shared --------------------------------- */

const COUNTDOWN = [
  { v: "02", l: "days" },
  { v: "03", l: "hours" },
  { v: "15", l: "min" },
  { v: "55", l: "sec" },
];

/* --------------------------------- Hero A --------------------------------- */

export function HeroA() {
  return (
    <section className="p-6 bg-Hero-Colors-background">
      <div className="w-[1440px] mx-auto py-24 bg-Hero-Colors-background flex flex-col items-center gap-12 overflow-hidden">
        {/* Top row */}
        <div className="w-full max-w-[1280px] grid grid-cols-2 items-center gap-16">
          {/* Left column */}
          <div className="w-full flex flex-col gap-8">
            {/* Headline + payout */}
            <div className="flex flex-col gap-6">
              <h1
                data-copy="true"
                data-copy-id="hero-price-points-headline"
                data-label="Headline"
                data-maxchars="60"
                className="text-Hero-Colors-foreground font-headline text-4xl text-left font-bold leading-[48px]"
              >
                A simple but powerful headline that sells!
              </h1>

              <div className="flex flex-col" data-display="yes" data-label="Jackpot">
                <span className="text-Colors-muted-foreground font-primary text-base text-left mb-4">
                  Current estimated payout
                </span>
                <span className="text-Hero-Colors-foreground text-7xl font-bold font-numbers text-left">
                  $1,346,000
                </span>
              </div>
            </div>

            {/* Countdown (toggleable) */}
            <div
              data-position="left"
              data-style="no-box"
              data-display="true"
              data-label="Countdown"
              className="py-3 bg-Hero-Colors-background rounded-md flex flex-col gap-2"
            >
              <p className="text-Colors-muted-foreground font-primary text-sm leading-tight">
                Grand Prize Deadline: Mar 14, 6pm
              </p>
              <div className="flex items-center gap-2">
                {COUNTDOWN.map((t, i) => (
                  <div key={i} className="w-14 flex flex-col items-center">
                    <div className="text-Hero-Colors-foreground text-2xl font-bold leading-snug">
                      {t.v}
                    </div>
                    <div className="text-Colors-muted-foreground text-xs leading-tight">
                      {t.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA (toggleable)
            <button
              type="button"
              data-display="true"
              data-label="Buy Now Button"
              className="w-48 h-10 px-4 bg-Hero-Colors-primary rounded-lg inline-flex justify-center items-center gap-2"
            >
              <span className="text-Hero-Colors-primary-foreground text-sm font-medium leading-tight">
                Buy Tickets
              </span>
            </button> */}
          </div>

          {/* Right column (image/placeholder) */}
          <div
            data-portrait="No"
            data-ratio="5:4"
            className="w-[560px] h-96 rounded-lg overflow-hidden bg-Hero-Colors-secondary"
          />
        </div>

        {/* Price points (toggleable group) */}
        <div
          
          data-label="Price Points"
          data-id="price-points"
          className="w-full max-w-[1280px] rounded-lg flex flex-col items-center gap-8"
        >
          <h2
            data-display="true"
            className="text-Colors-foreground text-2xl font-bold text-center font-headline"
            data-copy="true"
            data-copy-id="pp-headline"
            data-label="Price Points Headline"
            data-max-chars="130"
          >
            Buy your tickets today!
          </h2>

          {/* Cards */}
          <div className="w-full grid grid-cols-4 gap-4">
            {/* Card 1 – highlighted */}
            <div className="h-64 p-5 relative bg-PP-Colors-secondary rounded-lg outline outline-1 outline-PP-Colors-border flex flex-col items-center justify-center gap-6">
              <div className="px-2.5 py-0.5 absolute -top-2 bg-PP-Colors-alt-foreground rounded-lg text-PP-Colors-alt-background text-xs font-medium font-primary">
                Best Value
              </div>

              <div className="text-center">
                <div className="text-PP-Colors-secondary-foreground text-3xl font-bold">400 tickets</div>
                <div className="text-PP-Colors-secondary-foreground text-3xl font-medium">$60</div>
              </div>

              <div className="h-11 px-8 py-2.5 bg-PP-Colors-primary rounded-lg inline-flex items-center gap-6">
                <Minus className="text-PP-Colors-primary-foreground" />
                <div className="w-6 text-center text-PP-Colors-primary-foreground text-lg font-bold">1</div>
                <Plus className="text-PP-Colors-primary-foreground" />
              </div>
            </div>

            {/* Repeated simple cards */}
            {[
              { t: "160 tickets", p: "$40" },
              { t: "40 tickets", p: "$20" },
              { t: "10 tickets", p: "$10" },
            ].map(({ t, p }, i) => (
              <div
                key={i}
                className="h-64 p-5 bg-PP-Colors-secondary rounded-lg outline outline-1 outline-PP-Colors-border flex flex-col items-center justify-center gap-6"
              >
                <div className="text-center">
                  <div className="text-PP-Colors-secondary-foreground text-3xl font-bold">{t}</div>
                  <div className="text-PP-Colors-secondary-foreground text-3xl font-medium">{p}</div>
                </div>
                <div className="w-8 p-[5px] bg-PP-Colors-primary rounded-[120px] inline-flex justify-center">
                  <Plus className="text-PP-Colors-primary-foreground" />
                </div>
              </div>
            ))}
          </div>

          {/* Cart row */}
          <div className="px-6 py-4 bg-PP-Colors-secondary rounded-lg outline outline-1 outline-offset-[-1px] outline-PP-Colors-border inline-flex justify-start items-center gap-2">
            <div className="flex items-center gap-4">
              <ShoppingCart className="text-PP-Colors-secondary-foreground" />
              <div className="text-PP-Colors-secondary-foreground text-lg font-bold leading-none font-primary">
                400 tickets for $60
              </div>
            </div>

            <button
              type="button"
              data-show-right-icon="true"
              className="ml-auto h-11 px-4 bg-PP-Colors-primary rounded-lg inline-flex items-center gap-2"
            >
              <span className="text-PP-Colors-primary-foreground text-sm font-medium leading-tight font-primary">
                BUY TICKETS
              </span>
              <ArrowRight className="text-PP-Colors-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Hero B --------------------------------- */

export function HeroB() {
  return (
    <section className="p-6 bg-Hero-Colors-background h-full">
      <div className="w-[1440px] py-24  inline-flex flex-col justify-start items-center gap-12 overflow-hidden ">
        <div className="w-full h-full max-w-[1280px] inline-flex justify-start items-center gap-16" >
          <div className="w-full inline-flex flex-col justify-start items-center gap-11">
            <div className="self-stretch flex flex-col justify-start items-center gap-6">
              <div className="self-stretch flex flex-col justify-start items-center gap-2">
                <div
                  data-copy="true"
                  data-copy-id="hero-headline"
                  data-label="Headline"
                  data-maxchars="60"
                  className="self-stretch text-center justify-center text-Hero-Colors-foreground text-4xl font-bold font-headline leading-[48px]"
                >
                  A simple but powerful headline that sells!
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center" data-display="yes" data-label="Jackpot">
              <div className="justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal">
                Current estimated payout
              </div>
              <div className="justify-start text-Hero-Colors-foreground text-7xl font-bold font-numbers ">
                $1,346,000
              </div>
            </div>

            {/* Countdown */}
            <div
              data-position="left"
              data-style="no-box"
              data-display="true"
              data-label="Countdown"
              className="py-3 bg-Hero-Colors-background rounded-md flex flex-col justify-start items-start gap-2"
            >
              <div className="justify-center text-Colors-muted-foreground text-sm font-normal font-primary leading-tight">
                Grand Prize Deadline: Mar 14, 6pm
              </div>
              <div className="inline-flex justify-start items-center gap-2">
                {COUNTDOWN.map(({ v, l }, i) => (
                  <div key={i} className="w-14 inline-flex flex-col justify-center items-center">
                    <div className="self-stretch h-7 justify-center text-Hero-Colors-foreground text-2xl font-bold font-primary leading-snug">
                      {v}
                    </div>
                    <div className="self-stretch h-5 justify-center text-Colors-muted-foreground text-xs font-normal font-primary leading-tight">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA 
            <div
              data-show-left-icon="false"
              data-display="true"
              data-label="Buy Now Button"
              data-hide-switch-when="hidden"
              data-show-right-icon="false"
              data-size="default"
              data-state="Default"
              data-variant="Default"
              className="w-48 h-10 px-4 py-2 bg-Hero-Colors-primary rounded-lg inline-flex justify-center items-center gap-2"
            >
              <div className="justify-center text-Hero-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                Buy Tickets
              </div>
            </div>*/}
          </div>
        </div>

        {/* Price Points */}
        <div
          
          data-label="Price Points"
          data-id="price-points"
          data-item-1="true"
          data-item-2="true"
          data-item-3="true"
          data-item-4="true"
          data-item-5="false"
          data-mobile="no"
          data-show-image="No"
          data-show-title="true"
          data-type="horizontal"
          className="w-full max-w-[1280px] rounded-lg flex flex-col justify-start items-center gap-8"
        >
          <div
            data-copy="true"
            data-copy-id="pp-headline"
            data-label="Price Points Headline"
            data-max-chars="130"
            data-display="true"
            className="self-stretch text-center justify-start text-Colors-foreground text-2xl font-bold font-primary"
          >
            Buy your tickets today!
          </div>

          <div className="self-stretch inline-flex justify-start items-center gap-4">
            {/* Card 1 – highlighted */}
            <div
              data-badge="true"
              data-has-image="No"
              data-highligthed="yes"
              data-mobile="no"
              data-selected="yes"
              data-ticket-label="true"
              className="flex-1 h-64 p-5 relative bg-PP-Colors-secondary rounded-lg outline outline-1 outline-offset-[-1px] outline-PP-Colors-border inline-flex flex-col justify-center items-center gap-8"
            >
              
                <div className="px-2.5 py-0.5 absolute -top-2 bg-PP-Colors-alt-foreground rounded-lg text-PP-Colors-alt-background text-xs font-medium font-primary">
                  Best Value
                </div>
              

              <div className="self-stretch flex flex-col justify-start items-center">
                <div className="self-stretch text-center justify-start text-PP-Colors-secondary-foreground text-3xl font-bold font-primary">
                  400 tickets
                </div>
                <div className="self-stretch text-center justify-start text-PP-Colors-secondary-foreground text-3xl font-medium font-primary">
                  $60
                </div>
              </div>

              <div className="h-11 px-8 py-2.5 bg-PP-Colors-primary rounded-lg inline-flex justify-center items-center gap-6 overflow-hidden">
                <Minus className="text-PP-Colors-primary-foreground" />
                <div className="w-6 text-center justify-center text-PP-Colors-primary-foreground text-lg font-bold font-primary leading-7">
                  1
                </div>
                <Plus className="text-PP-Colors-primary-foreground" />
              </div>
            </div>

            {/* Simple cards */}
            {[
              { t: "160 tickets", p: "$40" },
              { t: "40 tickets", p: "$20" },
              { t: "10 tickets", p: "$10" },
            ].map(({ t, p }, i) => (
              <div
                key={i}
                data-badge="false"
                data-has-image="No"
                data-highligthed="no"
                data-mobile="no"
                data-selected="no"
                data-ticket-label="true"
                className="flex-1 h-64 p-5 bg-PP-Colors-secondary rounded-lg outline outline-1 outline-offset-[-1px] outline-PP-Colors-border inline-flex flex-col justify-center items-center gap-8"
              >
                <div className="self-stretch relative flex flex-col justify-start items-center">
                  <div className="self-stretch text-center justify-start text-PP-Colors-secondary-foreground text-3xl font-bold font-primary">
                    {t}
                  </div>
                  <div className="self-stretch text-center justify-start text-PP-Colors-secondary-foreground text-3xl font-medium font-primary">
                    {p}
                  </div>
                  <div className="w-0 h-0 left-[42.50px] top-[24px] absolute outline outline-1 outline-offset-[-0.50px] outline-PP-Colors-background" />
                </div>
                <div className="w-8 p-[5px] bg-PP-Colors-primary rounded-[120px] inline-flex justify-start items-center gap-2">
                  <Plus className="text-PP-Colors-primary-foreground" />
                </div>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="px-6 py-4 bg-PP-Colors-secondary rounded-lg outline outline-1 outline-offset-[-1px] outline-PP-Colors-border inline-flex justify-start items-center gap-2">
            <div className="w-56 flex justify-start items-center gap-4">
              <ShoppingCart className="text-PP-Colors-secondary-foreground" />
              <div className="w-48 justify-start text-PP-Colors-secondary-foreground text-lg font-bold font-primary leading-none">
                400 tickets for $60
              </div>
            </div>

            <div
              data-show-left-icon="false"
              data-show-right-icon="true"
              data-size="default"
              data-state="Default"
              data-variant="Default"
              className="h-11 px-4 py-2 bg-PP-Colors-primary rounded-lg flex justify-center items-center gap-2"
            >
              <div className="justify-center text-PP-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                BUY TICKETS
              </div>
              <div className="relative overflow-hidden">
                <ArrowRight className="text-PP-Colors-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}