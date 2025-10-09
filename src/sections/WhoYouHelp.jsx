//  HowYouHelpA.jsx
export function  WhoYouHelpA({ preview = false }) {
    return (
        <section
            data-section="WhoYouHelp"
            data-description="true"
            data-mobile="No"
            data-secondary-action="true"
            data-section-label="true"
            data-type="img_right"
            className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden"
            aria-label=" HowYouHelp"
        >
            <div className="w-full max-w-[1280px] px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-16">
                {/* Copy */}
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-8">
                    <div className="self-stretch flex flex-col justify-start items-start gap-5">
                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Section Label"
                            className="justify-start text-Colors-muted-foreground text-base text-left font-semibold font-primary"
                        >
                           More Than a Raffle. It’s Impact.
                        </div>

                        <div
                            data-copy="yes"
                            data-label="Headline"
                            className="self-stretch justify-start text-Colors-foreground text-4xl text-left font-bold font-headline leading-10"
                        >
                            Who You Help
                        </div>

                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Description"
                            className="self-stretch justify-start text-Colors-muted-foreground text-base text-left font-normal font-primary leading-normal"
                        >
                            Every ticket makes a difference. Proceeds from this raffle go directly to support local programs, community initiatives, and causes that matter most. Your participation not only gives you a chance to win big—it helps create real impact for people in need.
                        </div>
                    </div>

                    {/* Actions */}
                    <div

                        className="inline-flex justify-start items-start gap-3"
                    >
                        {/* Primary */}
                        <div
                            
                            data-display="true"
                            data-label="Button"
                            data-copy="true"
                            data-id="cta-button"
                            role="button"
                            tabIndex={0}
                            className="h-10 px-4 py-2 bg-Colors-primary rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
                        >
                            <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                                Learn More
                            </div>
                        </div>

                        {/* Secondary (Ghost) 
            <div
              data-show-left-icon="false"
              data-show-right-icon="true"
              data-size="default"
              data-state="Default"
              data-variant="Ghost"
              role="button"
              tabIndex={0}
              className="h-10 px-4 py-2 bg-tailwind-colors-base-transparent/0 rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
            >
              <div className="justify-center text-Colors-primary text-sm font-medium font-primary leading-tight">
                Learn more
              </div>
              <div className="w-4 h-4 relative overflow-hidden">
                <div className="w-2.5 h-2.5 left-[3.33px] top-[3.33px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-Colors-primary" />
              </div>
            </div>*/}
                    </div>
                </div>

                {/* Visual (Image Right) */}
                <div className="flex-1">
                    <div
                        data-portrait="No"
                        data-ratio="4:3"
                        data-display="yes"
                        data-image="who-you-help-image"
                        data-default-image="/images/who-you-help.png"
                        data-label=" HowYouHelp Image"
                        className="relative w-full h-80 rounded-lg overflow-hidden bg-Colors-secondary h-[420px]"
                        style={{ backgroundImage: "url(/images/who-you-help.png)", backgroundSize: "cover", backgroundPosition: "center" }}
                    >
                      
                    </div>
                </div>
            </div>
        </section>
    );
}
export function  WhoYouHelpB({ preview = false }) {
    return (
        <section
            data-section="WhoYouHelp"
            data-description="true"
            data-mobile="No"
            data-secondary-action="true"
            data-section-label="true"
            data-type="img_right"
            className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden"
            aria-label=" HowYouHelp"
        >
            <div className="w-full max-w-[1280px] px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-16">
                {/* Visual (Image Right) */}
                <div className="flex-1">
                    <div
                        data-portrait="No"
                        data-ratio="4:3"
                        data-display="yes"
                        data-image="who-you-help-image"
                        data-default-image="/images/who-you-help.png"
                        data-label=" HowYouHelp Image"
                        className="relative w-full h-80 rounded-lg overflow-hidden bg-Colors-secondary  h-[420px]"
                        style={{ backgroundImage: "url(/images/who-you-help.png)", backgroundSize: "cover", backgroundPosition: "center" }}
                    >
                      
                    </div>
                </div>
                {/* Copy */} 
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-8">
                    <div className="self-stretch flex flex-col justify-start items-start gap-5">
                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Section Label"
                            className="justify-start text-Colors-muted-foreground text-base font-semibold font-primary text-left"
                        >
                            More Than a Raffle. It’s Impact.
                        </div>

                        <div
                            data-copy="yes"
                            data-label="Headline"
                            className="self-stretch justify-start text-Colors-foreground text-4xl font-bold font-headline leading-10 text-left"
                        >
                            Who You Help
                        </div>

                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Description"
                            className="self-stretch justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal text-left"
                        >
                            Every ticket makes a difference. Proceeds from this raffle go directly to support local programs, community initiatives, and causes that matter most. Your participation not only gives you a chance to win big—it helps create real impact for people in need.
                        </div>
                    </div>

                    {/* Actions */}
                    <div

                        className="inline-flex justify-start items-start gap-3"
                    >
                        {/* Primary */}
                        <div
                            
                            data-display="true"
                            data-label="Button"
                            data-copy="true"
                            data-id="cta-button"
                            role="button"
                            tabIndex={0}
                            className="h-10 px-4 py-2 bg-Colors-primary rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
                        >
                            <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                                Learn More
                            </div>
                        </div>

                        {/* Secondary (Ghost) 
            <div
              data-show-left-icon="false"
              data-show-right-icon="true"
              data-size="default"
              data-state="Default"
              data-variant="Ghost"
              role="button"
              tabIndex={0}
              className="h-10 px-4 py-2 bg-tailwind-colors-base-transparent/0 rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
            >
              <div className="justify-center text-Colors-primary text-sm font-medium font-primary leading-tight">
                Learn more
              </div>
              <div className="w-4 h-4 relative overflow-hidden">
                <div className="w-2.5 h-2.5 left-[3.33px] top-[3.33px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-Colors-primary" />
              </div>
            </div>*/}
                    </div>
                </div>

               
            </div>
        </section>
    );
}