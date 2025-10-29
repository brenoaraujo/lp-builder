// FeatureA.jsx
export function FeatureA({ blockType = "feature" }) {
    return (
        <section
            data-section={blockType}
            data-description="true"
            data-mobile="No"
            data-secondary-action="true"
            data-section-label="true"
            data-type="img_right"
            className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden"
            aria-label="Feature"
        >
            <div className="w-full max-w-[1280px] px-6 flex items-center gap-16">
                {/* Copy */}
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-8">
                    <div className="self-stretch flex flex-col justify-start items-start gap-5">
                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Section Label"
                            className="justify-start text-Colors-muted-foreground text-base text-left font-semibold font-primary"
                        >
                            Section label
                        </div>

                        <div
                            data-copy="yes"
                            data-label="Headline"
                            className="self-stretch justify-start text-Colors-foreground text-4xl text-left font-bold font-headline leading-10"
                        >
                            Headline that shows solution&apos;s impact on user success
                        </div>

                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Description"
                            data-max-chars="400"
                            className="self-stretch justify-start text-Colors-muted-foreground text-base text-left font-normal font-primary leading-normal"
                        >
                            Explain in one or two concise sentences how your solution transforms users&apos; challenges into
                            positive outcomes. Focus on the end benefits that matter most to your target audience. Keep it
                            clear and compelling.
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="inline-flex justify-start items-start gap-3">
                        {/* Primary */}
                        <div
                            data-display="true"
                            data-label="Button"
                            data-copy="true"
                            data-id="cta-button"
                            role="button"
                            tabIndex={0}
                            className="h-10 px-4 py-2 bg-Colors-primary text-Colors-primary-foreground  rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
                        >
                            <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                                Learn More
                            </div>
                        </div>

                        {/* Button Action URL - Metadata only, not displayed */}
                        <div
                            data-copy="true"
                            data-id="cta-button-action"
                            data-control-id="cta-button"
                            data-max-chars="200"
                            data-placeholder="Learn More Url"
                            style={{ display: 'none' }}
                        >
                            
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
                <img
                        data-portrait="No"
                        data-ratio="73:41"
                        data-image={blockType === "feature" ? "feature-image" : `${blockType}-image`}
                        data-size="1000×560"
                        data-default-image="/images/feature.png"
                        data-label="Feature Image"
                        className="max-w-[500px] rounded-lg overflow-hidden object-cover bg-Colors-secondary"
                        src="/images/feature.png"
                        alt="Feature"
                    />
                </div>
            </div>
        </section>
    );
}
export function FeatureB({ blockType = "feature" }) {
    return (

        <section
            data-section={blockType}
            data-description="true"
            data-mobile="No"
            data-secondary-action="true"
            data-section-label="true"
            data-type="img_right"
            className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-start items-center gap-6 overflow-hidden"
            aria-label="Feature"
        >
            <div className="w-full max-w-[1280px] px-6 flex items-center gap-16">
                {/* Visual (Image Right) */}
                <div className="">
                    <img
                        data-portrait="No"
                        data-ratio="73:41"
                        data-image={blockType === "feature" ? "feature-image" : `${blockType}-image`}
                        data-size="1000×560"
                        data-default-image="/images/feature.png"
                        data-label="Feature Image"
                        className="max-w-[500px] rounded-lg overflow-hidden object-cover bg-Colors-secondary"
                        src="/images/feature.png"
                        alt="Feature"
                    />
                </div>
                {/* Copy */}
                <div className="inline-flex flex-col justify-start items-start gap-8">
                    <div className="self-stretch flex flex-col justify-start items-start gap-5">
                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Section Label"
                            className="justify-start text-Colors-muted-foreground text-base font-semibold font-primary text-left"
                        >
                            Section label
                        </div>

                        <div
                            data-copy="yes"
                            data-label="Headline"
                            className="self-stretch justify-start text-Colors-foreground text-4xl font-bold font-headline leading-10 text-left"
                        >
                            Headline that shows solution&apos;s impact on user success
                        </div>

                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Description"
                            className="self-stretch justify-start text-Colors-muted-foreground text-base font-normal font-primary leading-normal text-left"
                        >
                            Explain in one or two concise sentences how your solution transforms users&apos; challenges into
                            positive outcomes. Focus on the end benefits that matter most to your target audience. Keep it
                            clear and compelling.
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="inline-flex justify-start items-start gap-3">
                        {/* Primary */}
                        <div
                            data-display="true"
                            data-label="Button"
                            data-copy="true"
                            data-id="cta-button"
                            role="button"
                            tabIndex={0}
                            className="h-10 px-4 py-2 bg-Colors-primary text-Colors-primary-foreground  rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
                        >
                            <div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                                Learn More
                            </div>
                        </div>

                        {/* Button Action URL - Metadata only, not displayed */}
                        <div
                            data-copy="true"
                            data-placeholder="Learn More Url"
                            data-id="cta-button-action"
                            data-control-id="cta-button"
                            data-max-chars="200"
                            style={{ display: 'none' }}
                        >
                            
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
export function FeatureC({ blockType = "feature" }) {
    return (

        <section
            data-section={blockType}
            data-description="true"
            data-mobile="No"
            data-secondary-action="true"
            data-section-label="true"
            data-type="img_right"
            className="w-[1440px] py-24 bg-Colors-background inline-flex flex-col justify-center items-center gap-6 overflow-hidden"
            aria-label="Feature"
        >
            <div className="w-full max-w-[1280px] px-6 flex items-center gap-8">

                {/* Copy */}
                <div className="w-full inline-flex flex-col justify-center items-center gap-8 text-center">
                    <div className="gap-4 flex flex-col max-w-[840px]">
                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Section Label"
                            className="self-stretch  text-Colors-muted-foreground text-base font-semibold font-primary text-center"
                        >
                            Section label
                        </div>

                        <div
                            data-copy="yes"
                            data-label="Headline"
                            className="self-stretch  text-Colors-foreground text-4xl font-bold font-headline leading-10 text-center"
                        >
                            Headline that shows solution&apos;s impact on user success
                        </div>

                        <div
                            data-display="yes"
                            data-copy="yes"
                            data-label="Description"
                            data-max-chars="400"
                            className="text-Colors-muted-foreground text-base font-normal font-primary leading-normal text-center "
                        >
                            Explain in one or two concise sentences how your solution transforms users&apos; challenges into
                            positive outcomes. Focus on the end benefits that matter most to your target audience. Keep it
                            clear and compelling.
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="inline-flex justify-center items-center gap-3">
                        {/* Primary */}
                        <div
                            data-display="true"
                            data-label="Button"
                            data-copy="true"
                            data-id="cta-button"
                            role="button"
                            tabIndex={0}
                            className="h-10 px-4 py-2 bg-Colors-primary text-Colors-primary-foreground  rounded-lg flex justify-center items-center gap-2 outline outline-1 outline-offset-[-1px] outline-transparent focus:outline-2 focus:outline-Colors-primary"
                        ><div className="justify-center text-Colors-primary-foreground text-sm font-medium font-primary leading-tight">
                                Learn More
                            </div>
                            
                        </div>


                        {/* Button Action URL - Metadata only, not displayed */}
                        <div
                            data-copy="true"
                            data-placeholder="Learn More Url"
                            data-id="cta-button-action"
                            data-control-id="cta-button"
                            data-max-chars="200"
                            style={{ display: 'none' }}
                        >
                            
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
                    <div className="">
                            <img
                                data-portrait="No"
                                data-ratio="73:41"
                                data-image={blockType === "feature" ? "feature-image" : `${blockType}-image`}
                                data-size="1000×560"
                                data-display="yes"
                                data-default-image="/images/feature.png"
                                data-label="Feature Image"
                                className="max-w-[800px] rounded-lg overflow-hidden object-cover bg-Colors-secondary"
                                src="/images/feature.png"
                                alt="Feature"
                            />
                        </div>
                </div>


            </div>
        </section>




    );
}


