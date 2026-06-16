import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import basicPlanImage from '../../media/die-cast-vault-basic.png';
import proPlanImage from '../../media/die-cast-vault-pro.png';
import heroImage from '../../media/diecastlist.png';
import collectorShelfImage from '../../media/keith-diecast-hero.png';
import { SITE_NAME, SITE_URL } from '../lib/site';

const FEATURES = [
  { icon: '✅', title: 'Master Checklists', desc: 'Browse complete set lists and check off what you own. Free for everyone.' },
  { icon: '🚗', title: 'Full Inventory', desc: 'Log every car with photos, condition, value, and notes. Basic & up.' },
  { icon: '⭐', title: 'Showcase Your Best', desc: 'Build a public Top 10 or Top 25 to share with other collectors.' },
  { icon: '🔍', title: 'Wanted List', desc: 'Track cars you\'re hunting so you\'re always ready at the store.' },
  { icon: '🏷️', title: 'For Sale & Trade', desc: 'Mark duplicates for sale or trade and connect with the community.' },
  { icon: '📊', title: 'Collection Stats', desc: 'See totals, estimated value, Treasure Hunts, and more at a glance.' },
];

const BRANDS = ['Hot Wheels', 'Matchbox', 'Johnny Lightning', 'GreenLight', 'M2 Machines', 'Auto World', 'Majorette'];

const FREE_FEATURES   = ['Master checklists', 'Check off what you own', 'Quantity & duplicate tracking'];
const BASIC_FEATURES  = ['Everything in Free', 'Track 1 list', 'Up to 10 cars in inventory', '1 photo per car', 'Simple owned/not-owned tracking'];
const PREMIUM_FEATURES = ['Everything in Basic', 'Track up to 25 lists', 'Up to 5,000 cars in inventory', '1 photo per car', 'Series filtering', 'Advanced buy/sell/trade tracking'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-amber-500">
          🏎️ Die Cast List
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800"
          aria-hidden
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <p className="inline-flex items-center gap-2 text-amber-400/90 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                <span className="h-px w-8 bg-amber-500/60 hidden sm:block" />
                Built for a serious collector
                <span className="h-px w-8 bg-amber-500/60 hidden sm:block" />
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black leading-tight mb-5">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  Keith&apos;s Die Cast List
                </span>
              </h2>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-50 mb-6 leading-tight">
                Your Diecast Collection,
                <span className="text-amber-500"> Perfectly Organized</span>
              </h1>

              <p className="text-lg sm:text-xl text-stone-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Track complete set checklists, inventory every car, show off your best
                finds, and never accidentally buy the same one twice.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" onClick={() => navigate('/login')}>
                  Get Started Free
                </Button>
                <Button size="xl" variant="secondary" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
              <p className="text-stone-500 text-sm mt-5">
                Free checklist access · Full inventory from{' '}
                <strong className="text-stone-400">$7/month</strong>
              </p>
            </div>

            <div className="relative order-1 lg:order-2">
              <div
                className="absolute -inset-6 bg-amber-500/15 blur-3xl rounded-full"
                aria-hidden
              />
              <div className="relative rounded-2xl overflow-hidden border border-stone-700/80 shadow-2xl shadow-amber-950/40 ring-1 ring-amber-500/20">
                <img
                  src={heroImage}
                  alt="Keith's Die Cast List — diecast collection showcase"
                  className="w-full aspect-[16/10] object-cover object-center"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
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

      {/* Pricing */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-stone-50 text-center mb-3">Simple, honest pricing</h2>
        <p className="text-stone-400 text-center mb-12">
          Start free with checklists. Upgrade when you're ready for the full vault.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 flex flex-col">
            <div className="text-xl font-bold text-stone-50 mb-1">Free</div>
            <div className="text-4xl font-extrabold text-stone-300 mb-1">$0</div>
            <div className="text-stone-500 text-sm mb-6">Checklist access only</div>
            <ul className="space-y-3 text-stone-300 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8" fullWidth variant="secondary" onClick={() => navigate('/login')}>
              Start Free
            </Button>
          </div>

          {/* Basic */}
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 flex flex-col">
            <img
              src={basicPlanImage}
              alt="Die Cast Vault Basic plan"
              className="w-full h-32 object-cover rounded-xl border border-stone-700 mb-4"
            />
            <div className="text-xl font-bold text-stone-50 mb-1">Basic</div>
            <div className="text-4xl font-extrabold text-amber-500 mb-1">
              $7<span className="text-lg text-stone-400 font-normal">/mo</span>
            </div>
            <div className="text-stone-500 text-sm mb-6">Full inventory access</div>
            <ul className="space-y-3 text-stone-300 flex-1">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8" fullWidth onClick={() => navigate('/login')}>
              Get Basic
            </Button>
          </div>

          {/* Premium */}
          <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <img
              src={proPlanImage}
              alt="Die Cast Vault Pro plan"
              className="w-full h-32 object-cover rounded-xl border border-amber-500/50 mb-4"
            />
            <div className="text-xl font-bold text-stone-50 mb-1">Pro</div>
            <div className="text-4xl font-extrabold text-amber-400 mb-1">
              $22<span className="text-lg text-stone-400 font-normal">/mo</span>
            </div>
            <div className="text-stone-500 text-sm mb-6">For serious collectors</div>
            <ul className="space-y-3 text-stone-300 flex-1">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8" fullWidth onClick={() => navigate('/login')}>
              Get Pro
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-stone-800">
        <div className="absolute inset-0" aria-hidden>
          <img
            src={collectorShelfImage}
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-stone-900/85" />
        </div>
        <div className="relative text-center px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-stone-50 mb-4">Ready to organize your collection?</h2>
        <p className="text-stone-400 mb-2 text-lg">
          Join collectors who track their diecast collection with {SITE_NAME}.
        </p>
        <p className="text-stone-500 text-sm mb-8">
          Start free · No credit card required for checklist access
        </p>
        <Button size="xl" onClick={() => navigate('/login')}>
          Get Started
        </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 text-center py-8 text-stone-600 text-sm">
        <p>© 2026 Die Cast List · {SITE_URL.replace('https://', '')}</p>
        <p className="mt-1 text-xs text-stone-700">
          Not affiliated with Hot Wheels, Matchbox, or any diecast brand.
          All brand names are trademarks of their respective owners.
        </p>
      </footer>
    </div>
  );
}
