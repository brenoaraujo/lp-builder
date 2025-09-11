import { ArrowRight, ArrowLeft } from "lucide-react";

export function WinnersA() {
  return (
    <div className="w-[1440px] py-24 bg-Winners-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
      <div className="w-full max-w-[1280px] px-6 flex flex-col justify-start items-center gap-16">
        <div className="self-stretch flex flex-col justify-start items-center gap-16">
          <div className="w-full max-w-[676px] flex flex-col justify-start items-center gap-5">
            <div
              data-display="true"
              data-copy="true"
              data-label="Section Label"
              className="text-center justify-start text-Winners-Colors-muted-foreground text-base font-semibold font-primary leading-normal"
            >
              Win Big
            </div>

            <div
              data-copy="true"
              data-label="Headline"
              className="self-stretch text-center justify-start text-Winners-Colors-foreground text-4xl font-bold font-primary leading-10"
            >
              Congratulations to our recent winners
            </div>

            <div
              data-display="true"
              data-copy="true"
              data-label="Description"
              className="self-stretch text-center justify-start text-Winners-Colors-muted-foreground text-base font-normal font-primary leading-normal"
            >
              Winning a prize is thrilling, but the real win is knowing your contribution makes a difference. It’s a win-win—an exciting reward for you and vital support for a great cause!
            </div>
          </div>

          <div data-display="true" data-label="Winners Photos" className="relative inline-flex justify-center items-center">
            <div className="flex justify-center items-center gap-4">
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <div
                  data-portrait="No"
                  data-ratio="5:4"
                  className="w-[354px] h-[266px] rounded-lg overflow-hidden bg-Winners-Colors-secondary"
                />
              </div>
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <div
                  data-portrait="No"
                  data-ratio="5:4"
                  className="w-[354px] h-[266px] rounded-lg overflow-hidden bg-Winners-Colors-secondary"
                />
              </div>
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <div
                  data-portrait="No"
                  data-ratio="5:4"
                  className="w-[354px] h-[266px] rounded-lg overflow-hidden bg-Winners-Colors-secondary"
                />
              </div>
            </div>

            {/* Prev */}
            <div
              data-orientation="Horizontal"
              data-state="Default"
              data-variant="Previous"
              className="w-8 h-8 p-2.5 right-[-48px] top-[50%] absolute bg-Winners-Colors-background rounded-full outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2.5"
            >
              <ArrowLeft className="w-4 h-4 text-Winners-Colors-muted-foreground" />
            </div>

            {/* Next */}
            <div
              data-orientation="Horizontal"
              data-state="Default"
              data-variant="Next"
              className="w-8 h-8 p-2.5 left-[1132px] top-[50%] absolute bg-Winners-Colors-background rounded-full outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2.5"
            >
              <ArrowRight className="w-4 h-4 text-Winners-Colors-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div data-mobile="no" className="w-[1116px] flex flex-col justify-start items-start">
          {/* Col: Draw Date */}
          <div className="self-stretch h-96 rounded-tl-md rounded-tr-md outline outline-1 outline-offset-[-1px] outline-Colors-border inline-flex justify-start items-start overflow-hidden">
            <div className="w-32 self-stretch inline-flex flex-col justify-start items-center overflow-hidden">
              <div
                data-right-text-align="No"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Draw Date
                </div>
              </div>
              {["Feb 14 2025", "Feb 14 2025", "Feb 14 2025", "Feb 14 2025", "Feb 14 2025"].map((d, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="No"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {d}
                  </div>
                </div>
              ))}
            </div>

            {/* Col: Event */}
            <div className="w-60 self-stretch inline-flex flex-col justify-start items-start overflow-hidden">
              <div
                data-right-text-align="No"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Event
                </div>
              </div>
              {[
                "One Great Lottery - Winter 2024",
                "Spring Mega Draw 2024",
                "Summer Splash Lottery",
                "Summer Splash Lottery",
                "Fall Fortune Raffle",
              ].map((ev, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="No"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {ev}
                  </div>
                </div>
              ))}
            </div>

            {/* Col: Winning Number */}
            <div className="w-36 self-stretch inline-flex flex-col justify-start items-start overflow-hidden">
              <div
                data-right-text-align="No"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Winning Number
                </div>
              </div>
              {["BE-7984665", "BE-7985643", "BE-1354678", "BE-1654877", "BE-2346583"].map((n, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="No"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {n}
                  </div>
                </div>
              ))}
            </div>

            {/* Col: Name */}
            <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start overflow-hidden">
              <div
                data-right-text-align="No"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Name
                </div>
              </div>
              {["Theresa W", "Devon L", "Ralph E", "Robert F", "Darlene R"].map((name, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="No"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {name}
                  </div>
                </div>
              ))}
            </div>

            {/* Col: Location */}
            <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start overflow-hidden">
              <div
                data-right-text-align="No"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Location
                </div>
              </div>
              {["Edmonton", "Mississauga", "Calgary", "Winnipeg", "Quebec City"].map((loc, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="No"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {loc}
                  </div>
                </div>
              ))}
            </div>

            {/* Col: Prize */}
            <div className="w-32 self-stretch inline-flex flex-col justify-start items-start overflow-hidden">
              <div
                data-right-text-align="Yes"
                data-show-text="true"
                data-state="Default"
                className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 text-right justify-cener text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Prize
                </div>
              </div>
              {["$845,173.52", "$2,839.41", "$6,222.27", "$4,171.32", "$2,012.93"].map((amt, i) => (
                <div
                  key={i}
                  data-bold-text="No"
                  data-last-cell="No"
                  data-right-text-align="Yes"
                  data-show-avatar-description="true"
                  data-show-description="true"
                  data-size="Default"
                  data-state="Default"
                  data-variant="Default"
                  className="self-stretch flex-1 min-w-20 p-4 border-b border-Colors-border inline-flex justify-start items-center gap-2.5"
                >
                  <div className="flex-1 text-right justify-center text-Winners-Colors-foreground text-sm font-normal font-primary leading-tight">
                    {amt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer pager */}
          <div className="self-stretch h-16 px-4 rounded-bl-md rounded-br-md border-l border-r border-b border-Colors-border flex flex-col justify-center items-center overflow-hidden">
            <div className="w-full max-w-[1280px] inline-flex justify-between items-center">
              <div
                data-show-left-icon="true"
                data-show-right-icon="false"
                data-size="default"
                data-state="Default"
                data-variant="Outline"
                className="w-28 h-10 px-4 py-2 bg-base-background rounded-md outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-Winners-Colors-muted-foreground" />
                <div className="justify-center text-base-foreground text-sm font-medium font-primary leading-tight">Previous</div>
              </div>

              <div className="flex justify-center items-center gap-2.5">
                <div className="justify-center text-Winners-Colors-foreground text-sm font-medium font-primary leading-tight">1-7 of 120</div>
              </div>

              <div
                data-show-left-icon="false"
                data-show-right-icon="true"
                data-size="default"
                data-state="Default"
                data-variant="Outline"
                className="w-28 h-10 px-4 py-2 bg-base-background rounded-md outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2"
              >
                <div className="justify-center text-base-foreground text-sm font-medium font-primary leading-tight">Next</div>
                <ArrowRight className="w-4 h-4 text-Winners-Colors-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Winners B -----

export function WinnersB() {
  return (
    <div className="w-[1440px] py-24 bg-Winners-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
      <div className="w-full max-w-[1280px] px-6 flex flex-col justify-center items-start gap-16">
        <div className="self-stretch flex flex-col justify-start items-center gap-16">
          <div className="w-full max-w-[676px] flex flex-col justify-start items-center gap-5">
            <div
              data-display="true"
              data-copy="true"
              data-label="Section Label"
              className="text-center justify-start text-Winners-Colors-muted-foreground text-base font-semibold font-primary leading-normal"
            >
              Win Big
            </div>

            <div
              data-copy="true"
              data-label="Headline"
              className="self-stretch text-center justify-start text-Winners-Colors-foreground text-4xl font-bold font-primary leading-10"
            >
              Congratulations to our recent winners
            </div>

            <div
              data-display="true"
              data-copy="true"
              data-label="Description"
              className="self-stretch text-center justify-start text-Winners-Colors-muted-foreground text-base font-normal font-primary leading-normal"
            >
              Winning a prize is thrilling, but the real win is knowing your contribution makes a difference. It’s a win-win—an exciting reward for you and vital support for a great cause!
            </div>
          </div>

          {/* Cards grid */}
          <div className="w-full max-w-[1200px] flex flex-col justify-start items-start gap-6 overflow-hidden">
            <div className="inline-flex justify-start items-start gap-6">
              {/* Card 1 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Winners-Colors-alt-background rounded-lg inline-flex flex-col justify-start items-center">
                <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center self-stretch justify-center text-Winners-Colors-alt-foreground text-sm font-normal font-primary w-full">
                        Early Bird • Feb 14 2025
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-3xl font-black font-primary">
                    $100,004.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-base font-bold font-primary">
                      A-356485
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Amanda T. from Lombardy
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Winners-Colors-alt-background rounded-lg inline-flex flex-col justify-between items-center">
                <div className="self-stretch h-52 p-6 flex flex-col justify-center items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center justify-center text-Winners-Colors-alt-foreground text-sm font-normal font-primary w-full">
                        Early Bird • Feb 14 2025
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Event Title
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-3xl font-black font-primary">
                    $100,004.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-base font-bold font-primary">
                      A-356485
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Amanda T. from Lombardy
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Winners-Colors-alt-background rounded-lg inline-flex flex-col justify-center items-center">
                <div className="self-stretch p-6 flex flex-col justify-center items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center justify-center text-Winners-Colors-alt-foreground text-sm font-normal font-primary w-full">
                        Early Bird • Feb 14 2025
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-3xl font-black font-primary">
                    $100,004.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-base font-bold font-primary">
                      A-356485
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                      Amanda T. from Lombardy
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second row of cards */}
            <div className="inline-flex justify-start items-end gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  data-show-image="false"
                  data-show-quote="false"
                  className="w-96 self-stretch max-w-96 bg-Winners-Colors-alt-background rounded-lg inline-flex flex-col justify-center items-center"
                >
                  <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                    <div className="self-stretch flex flex-col justify-start items-center gap-3">
                      <div className="self-stretch inline-flex justify-between items-center">
                        <div className="text-center justify-center text-Winners-Colors-alt-foreground text-sm font-normal font-primary w-full">
                          Early Bird • Feb 14 2025
                        </div>
                      </div>
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 1 ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " : "Event Title"}
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-3xl font-black font-primary">
                      $100,004.00
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-base font-bold font-primary">
                        A-356485
                      </div>
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                        Amanda T. from Lombardy
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Third row of cards */}
            <div className="inline-flex justify-start items-end gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  data-show-image="false"
                  data-show-quote="false"
                  className="w-96 max-w-96 bg-Winners-Colors-alt-background rounded-lg inline-flex flex-col justify-start items-center"
                >
                  <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                    <div className="self-stretch flex flex-col justify-start items-center gap-3">
                      <div className="self-stretch inline-flex justify-between items-center">
                        <div className="text-center justify-center text-Winners-Colors-alt-foreground text-sm font-normal font-primary w-full">
                          Early Bird • Feb 14 2025
                        </div>
                      </div>
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 1 ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " : "Event Title"}
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-3xl font-black font-primary">
                      $100,004.00
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-base font-bold font-primary">
                        A-356485
                      </div>
                      <div className="self-stretch text-center justify-start text-Winners-Colors-alt-foreground text-sm font-normal font-primary">
                        Amanda T. from Lombardy
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show more */}
          <div
            data-show-left-icon="false"
            data-show-right-icon="false"
            data-size="lg"
            data-state="Default"
            data-variant="Outline"
            className="h-11 px-8 py-2 bg-base-background rounded-lg outline outline-1 outline-offset-[-1px] outline-base-input inline-flex justify-center items-center gap-2"
          >
            <div className="justify-center text-base-foreground text-sm font-medium font-primary leading-tight">
              SHOW MORE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}