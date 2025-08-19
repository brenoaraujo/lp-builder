export function PricingA() {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="text-xl font-bold">Pricing A</h2>
      <p className="text-gray-600">Simple three-tier grid.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {["Starter", "Pro", "Business"].map((t, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="font-semibold">{t}</div>
            <div className="mt-1 text-2xl font-bold">${(i + 1) * 9}</div>
            <button className="mt-3 w-full rounded-md bg-gray-900 px-3 py-2 text-white">Choose</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PricingB() {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="text-xl font-bold">Pricing B</h2>
      <p className="text-gray-600">Featured middle plan.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {["Basic", "Recommended", "Enterprise"].map((t, i) => (
          <div
            key={i}
            className={[
              "rounded-lg border p-4",
              i === 1 ? "ring-2 ring-blue-500" : ""
            ].join(" ")}
          >
            <div className="font-semibold">{t}</div>
            <div className="mt-1 text-2xl font-bold">${(i + 2) * 10}</div>
            <button className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-white">Start</button>
          </div>
        ))}
      </div>
    </section>
  );
}