import { ArrowRight, ArrowLeft } from "lucide-react";

export function WinnersA() {
  return (
    <div data-section="winners" className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
      <div className="w-full max-w-[1280px] px-6 flex flex-col justify-start items-center gap-16">
        <div className="self-stretch flex flex-col justify-start items-center gap-16">
          <div className="w-full max-w-[676px] flex flex-col justify-start items-center gap-5">
            <div
              data-display="true"
              data-copy="true"
              data-label="Section Label"
              className="text-center justify-start text-Colors-muted-foreground text-base font-semibold font-primary leading-normal"
            >
              Win Big
            </div>

            <div
              data-copy="true"
              data-label="Headline"
              className="self-stretch text-center justify-start text-Colors-foreground text-4xl font-bold font-primary leading-10"
            >
              Congratulations to our recent winners
            </div>

            <div
              data-display="true"
              data-copy="true"
              data-label="Description"
              className="self-stretch text-center justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal"
            >
              Winning a prize is thrilling, but the real win is knowing your contribution makes a difference. It’s a win-win—an exciting reward for you and vital support for a great cause!
            </div>
          </div>

          <div data-display="true" data-label="Winners Photos" className="relative inline-flex justify-center items-center">
            <div className="flex justify-center items-center gap-4">
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <img
                  data-portrait="No"
                  data-ratio="5:4"
                  data-size="800x600"
                  data-image="winner1-image"
                  data-default-image="/images/winner1.png"
                  className="max-w-[354px] rounded-lg overflow-hidden object-cover"
                  src="/images/winner1.png"
                  alt="Winner 1"
                />
              </div>
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <img
                  data-portrait="No"
                  data-ratio="5:4"
                  data-size="800x600"
                  data-image="winner2-image"
                  data-default-image="/images/winner2.png"
                  className="max-w-[354px] rounded-lg overflow-hidden object-cover"
                  src="/images/winner2.png"
                  alt="Winner 2"
                />
              </div>
              <div className="w-full p-1 flex justify-start items-center gap-2">
                <img
                  data-portrait="No"
                  data-ratio="5:4"
                  data-size="708×532"
                  data-image="winner3-image"
                  data-default-image="/images/winner3.png"
                  className="max-w-[354px] rounded-lg overflow-hidden object-cover"
                  src="/images/winner3.png"
                  alt="Winner 3"
                />
              </div>
            </div>

            {/* Prev */}
            <div
              data-orientation="Horizontal"
              data-state="Default"
              data-variant="Previous"
              className="w-8 h-8 p-2.5 right-[-48px] top-[50%] absolute text-Colors-foreground bg-Colors-background rounded-full outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2.5"
            >
              <ArrowLeft className="w-4 h-4 text-Colors-muted-foreground" />
            </div>

            {/* Next */}
            <div
              data-orientation="Horizontal"
              data-state="Default"
              data-variant="Next"
              className="w-8 h-8 p-2.5 left-[1132px] top-[50%] absolute text-Colors-foreground bg-Colors-background rounded-full outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2.5"
            >
              <ArrowRight className="w-4 h-4 text-Colors-muted-foreground" />
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
                <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
                  Draw Date
                </div>
              </div>
              {["Dec 15 2024", "Nov 28 2024", "Oct 12 2024", "Sep 5 2024", "Aug 18 2024"].map((d, i) => (
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
                  <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                  <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                  <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                  <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                  <div className="flex-1 justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <div className="flex-1 text-right justify-cener text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                  <div className="flex-1 text-right justify-center text-Colors-foreground text-sm font-normal font-primary leading-tight">
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
                <ArrowLeft className="w-4 h-4 text-Colors-muted-foreground" />
                <div className="justify-center text-Colors-foreground text-sm font-medium font-primary leading-tight">Previous</div>
              </div>

              <div className="flex justify-center items-center gap-2.5">
                <div className="justify-center text-Colors-foreground text-sm font-medium font-primary leading-tight">1-7 of 120</div>
              </div>

              <div
                data-show-left-icon="false"
                data-show-right-icon="true"
                data-size="default"
                data-state="Default"
                data-variant="Outline"
                className="w-28 h-10 px-4 py-2 bg-base-background rounded-md outline outline-1 outline-offset-[-1px] outline-base-input flex justify-center items-center gap-2"
              >
                <div className="justify-center text-Colors-foreground text-sm font-medium font-primary leading-tight">Next</div>
                <ArrowRight className="w-4 h-4 text-Colors-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Winner card data
const winnersData = [
  {
    id: 1,
    eventType: "Early Bird",
    date: "Jun 30 2024",
    eventName: "June 50/50 Draw",
    prize: "$4,250.00",
    ticketNumber: "A-356485",
    winnerName: "Sarah M. • from Toronto  "
  },
  {
    id: 2,
    eventType: "Early Bird",
    date: "Jul 15 2024",
    eventName: "Summer Raffle",
    prize: "$3,750.00",
    ticketNumber: "A-356485",
    winnerName: "Michael K. • from Ottawa  "
  },
  {
    id: 3,
    eventType: "Early Bird",
    date: "Jun 15 2024",
    eventName: "June 50/50 Draw",
    prize: "$4,850.00",
    ticketNumber: "A-356485",
    winnerName: "Jennifer L. • from Hamilton  "
  },
  {
    id: 4,
    eventType: "Early Bird",
    date: "Aug 2 2024",
    eventName: "Summer Raffle",
    prize: "$3,200.00",
    ticketNumber: "A-356485",
    winnerName: "David R. • from London  "
  },
  {
    id: 5,
    eventType: "June 50/50",
    date: "Jun 8 2024",
    eventName: "June 50/50 Draw",
    prize: "$4,600.00",
    ticketNumber: "A-356485",
    winnerName: "Lisa P. • from Windsor  "
  },
  {
    id: 6,
    eventType: "Early Bird",
    date: "Jul 22 2024",
    eventName: "Summer Raffle",
    prize: "$3,900.00",
    ticketNumber: "A-356485",
    winnerName: "Robert C. • from Kitchener  "
  },
  {
    id: 7,
    eventType: "Early Bird",
    date: "Jun 1 2024",
    eventName: "June 50/50 Draw",
    prize: "$4,100.00",
    ticketNumber: "A-356485",
    winnerName: "Amanda T. • from Mississauga  "
  },
  {
    id: 8,
    eventType: "Early Bird",
    date: "Jul 8 2024",
    eventName: "Summer Raffle",
    prize: "$3,500.00",
    ticketNumber: "A-356485",
    winnerName: "Christopher B. • from Brampton  "
  },
  {
    id: 9,
    eventType: "Early Bird",
    date: "May 25 2024",
    eventName: "June 50/50 Draw",
    prize: "$4,700.00",
    ticketNumber: "A-356485",
    winnerName: "Michelle W. • from Markham  "
  }
];

// Winner Card Component
function WinnerCard({ winner, className = "" }) {
  return (
    <div 
      data-show-image="false" 
      data-show-quote="false" 
      className={`w-96 self-stretch max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-start items-center ${className}`}
    >
      <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
        <div className="self-stretch flex flex-col justify-start items-center gap-3">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="text-center self-stretch justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
              {winner.eventType} • {winner.date}
            </div>
          </div>
          <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
            {winner.eventName}
          </div>
        </div>
        <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
          {winner.prize}
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
            {winner.ticketNumber}
          </div>
          <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
            {winner.winnerName}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Winners B -----

export function WinnersB() {
  return (
    <div data-section="winners" className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
      <div className="w-full max-w-[1280px] px-6 flex flex-col justify-center items-start gap-16">
        <div className="self-stretch flex flex-col justify-start items-center gap-16">
          <div className="w-full max-w-[676px] flex flex-col justify-start items-center gap-5">
            <div
              data-display="true"
              data-copy="true"
              data-label="Section Label"
              className="text-center justify-start text-Colors-muted-foreground text-base font-semibold font-primary leading-normal"
            >
              Win Big
            </div>

            <div
              data-copy="true"
              data-label="Headline"
              className="self-stretch text-center justify-start text-Colors-foreground text-4xl font-bold font-primary leading-10"
            >
              Congratulations to our recent winners
            </div>

            <div
              data-display="true"
              data-copy="true"
              data-label="Description"
              className="self-stretch text-center justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal"
            >
              Winning a prize is thrilling, but the real win is knowing your contribution makes a difference. It’s a win-win—an exciting reward for you and vital support for a great cause!
            </div>
          </div>

          {/* Cards grid */}
          <div className="w-full max-w-[1200px] flex flex-col justify-start items-start gap-6 overflow-hidden">
            <div className="inline-flex justify-start items-start gap-6">
              {/* Card 1 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-start items-center">
                <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center self-stretch justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
                      Early Bird • Jun 30 2024
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      June 50/50 Draw
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
                    $4,250.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
                      A-356485
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      Sarah M. • from Toronto  
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-between items-center">
                <div className="self-stretch h-52 p-6 flex flex-col justify-center items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
                      Early Bird • Jul 15 2024
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      Summer Raffle
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
                    $3,750.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
                      A-7785463
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      Michael K. • from Ottawa  
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div data-show-image="false" data-show-quote="false" className="w-96 self-stretch max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-center items-center">
                <div className="self-stretch p-6 flex flex-col justify-center items-center gap-4">
                  <div className="self-stretch flex flex-col justify-start items-center gap-3">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-center justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
                      Early Bird • Jun 15 2024
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      June 50/50 Draw
                    </div>
                  </div>
                  <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
                    $4,850.00
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
                      A-165497
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                      Jennifer L. • from Hamilton  
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
                  className="w-96 self-stretch max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-center items-center"
                >
                  <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                    <div className="self-stretch flex flex-col justify-start items-center gap-3">
                      <div className="self-stretch inline-flex justify-between items-center">
                        <div className="text-center justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
                          {idx === 0 ? "Early Bird • Aug 2 2024" : idx === 1 ? "June 50/50 • Jun 8 2024" : "Early Bird• Jul 22 2024"}
                        </div>
                      </div>
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 0 ? "Summer Raffle" : idx === 1 ? "June 50/50 Draw" : "Summer Raffle"}
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
                      {idx === 0 ? "$3,200.00" : idx === 1 ? "$4,600.00" : "$3,900.00"}
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
                        
                        {idx === 0 ? "A-7986132  " : idx === 1 ? "A-846213  " : "A-114325  "}
                      </div>
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 0 ? "David R. • from London  " : idx === 1 ? "Lisa P. • from Windsor  " : "Robert C. • from Kitchener  "}
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
                  className="w-96 max-w-96 bg-Colors-alt-background rounded-lg inline-flex flex-col justify-start items-center"
                >
                  <div className="self-stretch p-6 flex flex-col justify-start items-center gap-4">
                    <div className="self-stretch flex flex-col justify-start items-center gap-3">
                      <div className="self-stretch inline-flex justify-between items-center">
                        <div className="text-center justify-center text-Colors-alt-foreground text-sm font-normal font-primary w-full">
                          {idx === 0 ? "Early Bird • Jun 1 2024" : idx === 1 ? "Early Bird • Jul 8 2024" : "Early Bird • May 25 2024"}
                        </div>
                      </div>
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 0 ? "June 50/50 Draw" : idx === 1 ? "Summer Raffle" : "June 50/50 Draw"}
                      </div>
                    </div>
                    <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-3xl font-black font-primary">
                      {idx === 0 ? "$4,100.00" : idx === 1 ? "$3,500.00" : "$4,700.00"}
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-1">
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-base font-bold font-primary">
                      {idx === 0 ? "A-94451 " : idx === 1 ? "A-522134" : "A-174469  "}
                      </div>
                      <div className="self-stretch text-center justify-start text-Colors-alt-foreground text-sm font-normal font-primary">
                        {idx === 0 ? "Amanda T. • from Mississauga  " : idx === 1 ? "Christopher B. • from Brampton  " : "Michelle W. • from Markham  "}
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

