import { Mic } from 'lucide-react';
import HeroButton from './HeroButton';

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center bg-gray-50 rounded-3xl border border-gray-100 min-h-60 sm:min-h-80 md:min-h-100">
            {/* Illustration Placeholder or Icon */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Mic size={40} className="text-gray-400" />
            </div>

            <h2 className="text-2xl font-bold text-off-black mb-2">No SOPs Created Yet</h2>
            <p className="text-gray-500 max-w-md mb-8">
                Your library is empty. Start recording your voice to generate your first Standard Operating Procedure instantly.
            </p>

            <HeroButton
                href="/dashboard/new"
                text="Create First SOP"
            />
        </div>
    );
}
