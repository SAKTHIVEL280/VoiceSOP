import React from 'react';

export default function ProblemStatement() {
    return (
        <section className="relative z-10 w-full py-16 sm:py-24 md:py-32 px-4 sm:px-6">
            <div className="container mx-auto flex flex-col gap-16 sm:gap-24">
                <div className="text-2xl sm:text-3xl md:text-5xl font-serif leading-tight max-w-5xl">
                    Most businesses have &ldquo;tribal knowledge&rdquo; locked in employees&apos; heads.
                    <span className="text-brand-red font-serif-italic block mt-4">
                        Stop scaling bottlenecks.
                    </span>
                </div>
            </div>
        </section>
    );
}
