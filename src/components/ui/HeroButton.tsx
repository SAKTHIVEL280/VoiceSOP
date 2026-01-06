'use client';

import Link from 'next/link';

interface HeroButtonProps {
    href?: string;
    onClick?: () => void;
    text?: string;
    className?: string;
}

export default function HeroButton({
    href,
    onClick,
    text = "Create New SOP",
    className = ""
}: HeroButtonProps) {

    const ButtonBody = (
        <div className={`group relative overflow-hidden bg-[#FF4D4D] text-white border-2 border-[#FF4D4D] px-8 py-4 rounded-full font-medium uppercase tracking-wider hover:bg-transparent hover:text-[#FF4D4D] transition-colors duration-300 inline-block text-center cursor-pointer ${className}`}>
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:-translate-y-[150%]">
                {text}
            </span>
            <span className="absolute left-0 top-0 w-full h-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] translate-y-[150%] group-hover:translate-y-0 font-serif italic text-xl capitalize tracking-normal">
                {text}
            </span>
        </div>
    );

    if (href) {
        return <Link href={href}>{ButtonBody}</Link>;
    }

    return (
        <button onClick={onClick} className="inline-block">
            {ButtonBody}
        </button>
    );
}
