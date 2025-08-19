export function TestimonialsA() {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="text-xl font-bold">What people say</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[1,2,3].map((i) => (
          <blockquote key={i} className="rounded-lg border p-4 text-sm text-gray-700">
            “Great product. Helped us ship faster.” 
            <footer className="mt-2 font-medium text-gray-900">User {i}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function TestimonialsB() {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="text-xl font-bold">Loved by teams</h2>
      <div className="mt-4 space-y-3">
        {[1,2].map((i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="text-sm text-gray-700">
              “Switched last quarter. Productivity is up.”
              <div className="mt-1 font-medium text-gray-900">Team {i}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}