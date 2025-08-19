/* Simple hero variants; include a <button> inside to prove dock handles nested buttons */
export function HeroA() {
  return (
    <section className="rounded-xl border p-6">
      <h1 className="text-2xl font-bold">Hero A</h1>
      <p className="text-gray-600">Clean headline with subcopy.</p>
      <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Primary CTA</button>
    </section>
  );
}

export function HeroB() {
  return (
    <section className="rounded-xl border p-6">
      <h1 className="text-2xl font-bold">Hero B</h1>
      <p className="text-gray-600">Alt arrangement.</p>
      <button className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white">Try it</button>
    </section>
  );
}

export function HeroC() {
  return (
    <section className="rounded-xl border p-6">
      <h1 className="text-2xl font-bold">Hero C</h1>
      <p className="text-gray-600">Third variation.</p>
      <button className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white">Get started</button>
    </section>
  );
}