export function ExtraPrizesA() {
  return (
    <div
      data-section="extraPrizes"
      data-mobile="No"
      data-show-action-button="true"
      data-show-counter="true"
      data-show-section-label="true"
      data-show-subtext="true"
      data-type="3"
      className="w-full py-32 bg-Colors-background inline-flex flex-col justify-start h-auto items-center gap-16 overflow-hidden"
    >
      <div className="w-full flex flex-col justify-start items-center gap-12">
        <div className="w-full max-w-[806px] flex flex-col justify-start items-center gap-8">
          <div className="self-stretch flex flex-col justify-start items-center gap-5">
            <div
              data-display="yes"
              data-copy="yes"
              data-label="Section Label"
              className="justify-start text-Colors-muted-foreground text-base font-semibold font-primary"
            >
              More reasons to play!
            </div>
            <div
              data-copy="yes"
              data-label="Headline"
              className="self-stretch text-center justify-start text-Colors-foreground text-4xl font-bold font-headline leading-10"
            >
              Extra Prizes
            </div>
            <div
              data-display="yes"
              data-copy="yes"
              data-label="Description"
              className="self-stretch text-center justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal"
            >
              More chances to win! Enter early for a chance to win one of our amazing extra prizes.
            </div>
          </div>
          {/* Countdown 
          <div
            data-display="yes"
            data-label="Countdown"
            data-position="left"
            data-style="no-box"
            className="py-3 rounded-md flex flex-col justify-start items-start gap-2"
          >
            <div className="justify-center text-Colors-muted-foreground text-sm font-normal font-primary leading-tight">
              Grand Prize Deadline: Mar 14, 6pm
            </div>
            <div className="inline-flex justify-start items-center gap-2">
              {[
                { v: "02", l: "days" },
                { v: "03", l: "hours" },
                { v: "15", l: "min" },
                { v: "55", l: "sec" },
              ].map((t) => (
                <div key={t.l} className="w-14 inline-flex flex-col justify-center items-center">
                  <div className="self-stretch h-7 justify-center text-Colors-foreground text-2xl font-bold font-primary leading-snug">
                    {t.v}
                  </div>
                  <div className="self-stretch h-5 justify-center text-Colors-muted-foreground text-xs font-normal font-primary leading-tight">
                    {t.l}
                  </div>
                </div>
              ))}
            </div>
          </div>*/}
          {/* Buy Now 
          <div
            data-display="yes"
            data-copy="yes"
            data-label="Buy Now Button"
            className="inline-flex justify-start items-start gap-3"
          >
            <button
              type="button"
              data-show-left-icon="false"
              data-show-right-icon="false"
              data-size="default"
              data-state="Default"
              data-variant="Default"
              className="h-10 px-4 py-2 bg-Colors-primary rounded-lg flex justify-center items-center gap-2"
            >
              <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                BUY NOW
              </div>
            </button>
          </div>*/}

        </div>

        <div className="w-[1280px] inline-flex justify-center items-start gap-6 flex-wrap content-start">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const deadlines = [
              { day: "15", month: "JAN" },
              { day: "22", month: "JAN" },
              { day: "29", month: "JAN" },
              { day: "5", month: "FEB" },
              { day: "12", month: "FEB" },
              { day: "19", month: "FEB" }
            ];
            const deadline = deadlines[i];
            
            return (
            <div
              key={i}
              data-deadline="box"
              data-img="img-top"
              data-mobile="no"
              data-show-description="false"
              data-show-images="false"
              data-show-winners="true"
              className="w-96 max-w-96 bg-Colors-background rounded-lg shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-md inline-flex flex-col justify-start items-start overflow-hidden"
            >
              <div className="self-stretch h-36 min-h-36 px-6 bg-Colors-secondary inline-flex justify-end items-center gap-6">
                <div className="flex-1 py-6 inline-flex flex-col justify-start items-start gap-4">
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch justify-start text-Colors-secondary-foreground text-xs font-bold font-primary uppercase">
                      4 Winners
                    </div>
                    <div className="self-stretch max-h-16 justify-start text-Colors-secondary-foreground text-xl font-semibold font-primary line-clamp-2">
                      {i === 1
                        ? "$5,000 cash prize"
                        : i === 2
                          ? "Two all-inclusive stays"
                          : i === 3
                            ? "6 months of free gas"
                            : i === 4
                              ? "Seasonal groceries covered "
                              : "$20,000 cash prize"}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-Colors-alt-background rounded-lg shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-md inline-flex flex-col justify-center items-center gap-1">
                  <div className="w-20 text-center justify-start text-Colors-alt-foreground text-xs font-normal font-primary">
                    Deadline
                  </div>
                  <div className="w-20 text-center justify-center text-Colors-alt-foreground text-lg font-bold font-primary leading-tight">
                    {deadline.day}
                    <br />
                    {deadline.month}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ExtraPrizesB() {
  return (
    <div
      data-section="extraPrizes"
      data-mobile="No"
      data-show-action-button="true"
      data-show-counter="true"
      data-show-section-label="true"
      data-show-subtext="true"
      data-type="3"
      className="w-full py-32 bg-Colors-background inline-flex flex-col justify-start h-auto items-center gap-16 overflow-hidden"
    >
      <div className="w-full max-w-[1280px] flex flex-col justify-start items-center gap-12">
        <div className="self-stretch inline-flex justify-start items-center gap-28">
          <div className="flex-1 max-w-[806px] inline-flex flex-col justify-start items-start gap-8">
            <div className="self-stretch flex flex-col justify-start items-start gap-5">
              <div
                data-display="yes"
                data-copy="yes"
                data-label="Section Label"
                className="justify-start text-Colors-muted-foreground text-base font-semibold font-primary"
              >
                More reasons to play!
              </div>
              <div
                data-copy="yes"
                data-label="Headline"
                className="self-stretch justify-start text-Colors-foreground text-4xl font-bold font-primary leading-10"
              >
                Extra Prizes
              </div>
              <div
                data-display="yes"
                data-copy="yes"
                data-label="Descritpion"
                className="self-stretch justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal"
              >
                More chances to win! Enter early for a chance to win one of our amazing extra prizes.
              </div>
            </div>
            {/* Countdown
            <div
              data-display="yes"
              data-label="Countdown"
              data-position="left"
              data-style="no-box"
              className="py-3 rounded-md flex flex-col justify-start items-start gap-2"
            >
              <div className="justify-center text-Colors-muted-foreground text-sm font-normal font-primary leading-tight">
                Grand Prize Deadline: Mar 14, 6pm
              </div>
              <div className="inline-flex justify-start items-center gap-2">
                {[
                  { v: "02", l: "days" },
                  { v: "03", l: "hours" },
                  { v: "15", l: "min" },
                  { v: "55", l: "sec" },
                ].map((t) => (
                  <div key={t.l} className="w-14 inline-flex flex-col justify-center items-center">
                    <div className="self-stretch h-7 justify-center text-Colors-foreground text-2xl font-bold font-primary leading-snug">
                      {t.v}
                    </div>
                    <div className="self-stretch h-5 justify-center text-Colors-muted-foreground text-xs font-normal font-primary leading-tight">
                      {t.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            */}
            {/* Buy Now Button 
            <div
              data-display="yes"
              data-copy="yes"
              data-label="Buy Now Button"
              className="inline-flex justify-start items-start gap-3"
            >
              <button
                type="button"
                data-show-left-icon="false"
                data-show-right-icon="false"
                data-size="default"
                data-state="Default"
                data-variant="Default"
                className="h-10 px-4 py-2 bg-Colors-primary rounded-lg flex justify-center items-center gap-2"
              >
                <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                  BUY NOW
                </div>
              </button>
            </div>*/}
          </div>

          <img
            data-portrait="No"
            data-ratio="5:4"
            data-size="1200×960"
            data-image="extra-prize-image"
            data-default-image="/images/img-extra.png"
            className="max-w-[654px] rounded-lg overflow-hidden object-cover"
            src="/images/img-extra.png"
            alt="Extra Prize"
          />
        </div>

        {/* Grid of cards */}
        <div className="w-full grid grid-cols-3 gap-6 content-start">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const deadlines = [
              { day: "15", month: "JAN" },
              { day: "22", month: "JAN" },
              { day: "29", month: "JAN" },
              { day: "5", month: "FEB" },
              { day: "12", month: "FEB" },
              { day: "19", month: "FEB" }
            ];
            const deadline = deadlines[i];
            
            return (
            <div
              key={i}
              data-deadline="box"
              data-img="img-top"
              data-mobile="no"
              data-show-description="false"
              data-show-images="false"
              data-show-winners="true"
              className="bg-Colors-background rounded-lg shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-md inline-flex flex-col justify-start items-start overflow-hidden"
            >
              <div className="self-stretch h-36 min-h-36 px-6 bg-Colors-secondary inline-flex justify-between items-center">
                <div className="flex-1 py-6 inline-flex flex-col justify-start items-start gap-4">
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch justify-start text-Colors-secondary-foreground text-xs font-bold font-primary uppercase">
                      4 Winners
                    </div>
                    <div className="self-stretch max-h-16 justify-start text-Colors-secondary-foreground text-xl font-semibold font-primary line-clamp-2">
                      {i === 1
                        ? "$5,000 cash prize"
                        : i === 2
                          ? "Two all-inclusive stays"
                          : i === 3
                            ? "6 months of free gas"
                            : i === 4
                              ? "Seasonal groceries covered "
                              : "$20,000 cash prize"}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-Colors-alt-background rounded-lg shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-md inline-flex flex-col justify-center items-center gap-1">
                  <div className="w-20 text-center justify-start text-Colors-alt-foreground text-xs font-normal font-primary">
                    Deadline
                  </div>
                  <div className="w-20 text-center justify-center text-Colors-alt-foreground text-lg font-bold font-primary leading-tight">
                    {deadline.day}
                    <br />
                    {deadline.month}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}