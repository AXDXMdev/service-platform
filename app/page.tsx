export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Hero Section */}
      <section className="text-center py-24 px-6">
        <h1 className="text-5xl font-bold">
          Find trusted services near you
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          Book professionals easily and securely.
        </p>

        <button className="mt-8 bg-black text-white px-6 py-3 rounded-xl">
          Explore Services
        </button>
      </section>


      {/* Categories */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-12 pb-24">

        {[
          "Cleaning",
          "Moving",
          "Tutoring",
          "Fitness",
          "IT Help",
          "Repair",
          "Beauty",
          "Healthcare Support"
        ].map(category => (

          <div
            key={category}
            className="p-6 border rounded-2xl hover:shadow-lg text-center"
          >
            {category}
          </div>

        ))}

      </section>


      {/* Provider CTA */}
      <section className="text-center pb-24">

        <h2 className="text-3xl font-semibold">
          Become a provider and start earning
        </h2>

        <button className="mt-6 bg-black text-white px-6 py-3 rounded-xl">
          Join now
        </button>

      </section>

    </main>
  )
}