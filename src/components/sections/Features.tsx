import React from 'react';
import { Mic, FileText, Download } from 'lucide-react';

const features = [
    {
        icon: <Mic className="w-10 h-10 text-brand-red" />,
        title: "Voice Recording",
        description: "Record yourself explaining a process. No need to type. Our interface handles input from 2 to 15 minutes."
    },
    {
        icon: <FileText className="w-10 h-10 text-brand-red" />,
        title: "AI SOP Generation",
        description: "We structure your ramblings into numbered steps, checklists, and warnings automatically using advanced AI."
    },
    {
        icon: <Download className="w-10 h-10 text-brand-red" />,
        title: "Instant Export",
        description: "Download professionally formatted PDFs for your team or Markdown files for Notion/Obsidian in one click."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-transparent relative z-10">
            <div className="container mx-auto">
                <div className="mb-10 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif mb-4 sm:mb-6">How it works</h2>
                    <div className="h-1 w-20 bg-brand-red"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col gap-4 sm:gap-6 p-5 sm:p-8 border border-gray-100 rounded-2xl bg-warm-grey/30 hover:bg-warm-grey/50 transition-colors">
                            <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-sm">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold">{feature.title}</h3>
                            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
