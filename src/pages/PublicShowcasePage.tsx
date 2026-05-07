import { Link } from 'react-router-dom';

// Phase 5: look up collector showcase by userId from Firestore.
export default function PublicShowcasePage() {
  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-stone-200 mb-2">This showcase is private</h1>
        <p className="text-stone-400">The collector hasn't made their showcase public yet.</p>
        <Link to="/" className="text-amber-400 hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    </div>
  );
}
