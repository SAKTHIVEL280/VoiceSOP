'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface SortOption {
    value: string;
    label: string;
}

interface CustomSortDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: SortOption[];
}

export default function CustomSortDropdown({ value, onChange, options }: CustomSortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:w-48" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between transition-all duration-200 outline-none
                ${isOpen ? 'ring-2 ring-brand-red/20 border-brand-red' : 'hover:border-gray-300'}
                `}
            >
                <span className="font-medium text-gray-700">{selectedLabel}</span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute z-50 top-full mt-2 left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1"
                    >
                        {options.map((option) => (
                            <li key={option.value}>
                                <button
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-red-50 transition-colors
                                    ${value === option.value ? 'text-brand-red font-medium bg-red-50/50' : 'text-gray-600'}
                                    `}
                                >
                                    {option.label}
                                    {value === option.value && <Check size={14} className="text-brand-red" />}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
