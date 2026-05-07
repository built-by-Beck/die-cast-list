import { Link } from 'react-router-dom';

// Phase 5: look up collector by publicProfileSlug from Firestore.
export default function PublicProfilePage() {
  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-stone-200 mb-2">Profile not found</h1>
        <p className="text-stone-400">This collector profile is private or doesn't exist.</p>
        <Link to="/" className="text-amber-400 hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    </div>
  );
}
