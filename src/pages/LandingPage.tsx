import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const FEATURES = [
  { icon: '🚗', title: 'Track Every Car', desc: 'Log each car in your collection with photos, condition, value, and notes.' },
  { icon: '✅', title: 'Master Checklists', desc: 'Browse complete set lists and check off what you own. Never buy the same car twice.' },
  { icon: '⭐', title: 'Showcase Your Best', desc: 'Build a public Top 10 or Top 25 showcase to share with other collectors.' },
  { icon: '🔍', title: 'Wanted List', desc: 'Keep track of cars you\'re hunting so you\'re always ready at the store.' },
  { icon: '🏷️', title: 'For Sale & Trade', desc: 'Mark duplicates for sale or trade. Share your available cars with the community.' },
  { icon: '📊', title: 'Collection Stats', desc: 'See your total cars, estimated value, Treasure Hunts, and more at a glance.' },
];

const BRANDS = ['Hot Wheels', 'Matchbox', 'Johnny Lightning', 'GreenLight', 'M2 Machines', 'Auto World', 'Majorette'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-amber-500">🔧 Collector's Garage</div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-50 mb-6 leading-tight">
          Your Diecast Collection,
          <span className="text-amber-500"> Perfectly Organized</span>
        </h1>
        <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Collector's Garage helps diecast collectors inventory their cars, track complete set
          checklists, show off their best finds, and never accidentally buy the same car twice.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" onClick={() => navigate('/login')}>
            Start Your Garage — It's Free
          </Button>
          <Button size="xl" variant="secondary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
        <p className="text-stone-500 text-sm mt-6">
          Simple. Friendly. Built for real collectors.
        </p>
      </section>

      {/* Brands strip */}
      <section className="border-y border-stone-800 bg-stone-800/50 py-4 overflow-hidden">
        <div className="flex gap-8 items-center justify-center flex-wrap px-6 max-w-4xl mx-auto">
          <span className="text-stone-500 text-sm font-medium uppercase tracking-widest">Supports</span>
          {BRANDS.map((b) => (
            <span key={b} className="text-stone-400 text-sm font-semibold whitespace-nowrap">{b}</span>
          ))}
          <span className="text-stone-500 text-sm">& more</span>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-stone-50 text-center mb-12">
          Everything a serious collector needs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-stone-50 mb-2">{f.title}</h3>
              <p className="text-stone-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-stone-50 text-center mb-12">Simple pricing</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8">
            <div className="text-2xl font-bold text-stone-50 mb-1">Basic</div>
            <div className="text-4xl font-extrabold text-amber-500 mb-4">$5<span className="text-lg text-stone-400 font-normal">/month</span></div>
            <ul className="space-y-3 text-stone-300">
              {[
                'Up to 250 cars',
                '1 photo per car',
                'Top 10 Showcase',
                'Master checklists',
                'Up to 3 custom checklists',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8" fullWidth size="lg" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
          <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="text-2xl font-bold text-stone-50 mb-1">Premium</div>
            <div className="text-4xl font-extrabold text-amber-400 mb-4">$20<span className="text-lg text-stone-400 font-normal">/month</span></div>
            <ul className="space-y-3 text-stone-300">
              {[
                'Unlimited cars',
                '5 photos per car',
                'Top 25 Showcase',
                'Unlimited custom checklists',
                'CSV import/export (coming soon)',
                'Advanced stats (coming soon)',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8" fullWidth size="lg" onClick={() => navigate('/login')}>
              Get Premium
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-20 border-t border-stone-800">
        <h2 className="text-3xl font-bold text-stone-50 mb-4">Ready to organize your garage?</h2>
        <p className="text-stone-400 mb-8 text-lg">Join collectors who track their diecast collection with Collector's Garage.</p>
        <Button size="xl" onClick={() => navigate('/login')}>
          Start Free Today
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 text-center py-8 text-stone-600 text-sm">
        <p>© 2025 Collector's Garage. Built for diecast collectors.</p>
        <p className="mt-1 text-xs text-stone-700">
          Collector's Garage is not affiliated with Hot Wheels, Matchbox, or any diecast brand.
          All brand names are trademarks of their respective owners.
        </p>
      </footer>
    </div>
  );
}
