import React from 'react';
import { ArrowRight } from 'lucide-react';

const useCases = [
    {
        role: "Agency Owners",
        pain: "Stop explaining the same thing to every new hire.",
        benefit: "Onboard staff 5x faster.",
        color: "bg-[#fff0f0]" // Very light red
    },
    {
        role: "Consultants",
        pain: "Your methodology is stuck in your head.",
        benefit: "Productize your knowledge.",
        color: "bg-[#f0f9ff]" // Very light blue
    },
    {
        role: "Restaurant Managers",
        pain: "High staff turnover killing your quality?",
        benefit: "Standardize recipes & closing duties.",
        color: "bg-[#fcf0ff]" // Very light purple
    }
];

export default function UseCases() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 relative z-10 bg-transparent">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 sm:mb-16 gap-6 sm:gap-8">
                    <div className="max-w-2xl">
                        <span className="text-sm font-bold uppercase tracking-widest text-brand-red mb-2 block">Who is this for?</span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-serif">Built for operators who value their time.</h2>
                    </div>
                    <p className="text-base sm:text-xl max-w-md text-gray-600">
                        Whether you run a digital agency or a local restaurant, consistent processes are the key to scaling.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {useCases.map((useCase, index) => (
                        <div key={index} className={`p-6 sm:p-8 lg:p-10 rounded-3xl ${useCase.color} border border-black/5`}>
                            <h3 className="text-xl sm:text-2xl font-serif-italic mb-3 sm:mb-4">{useCase.role}</h3>
                            <p className="font-bold text-base sm:text-lg mb-2">{useCase.pain}</p>
                            <p className="text-gray-600 mb-6 sm:mb-8">{useCase.benefit}</p>

                            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide opacity-60">
                                Use Case <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
