import Pricing from '@/components/sections/Pricing';
import Footer from '@/components/sections/Footer';

export default function PricingPage() {
    return (
        <main className="relative min-h-screen w-full bg-warm-grey overflow-hidden">
            <div className="pt-24">
                <Pricing />
            </div>
            <Footer />
        </main>
    );
}
