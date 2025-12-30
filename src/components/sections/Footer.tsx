import React from 'react';
import { Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-off-black text-white py-20 px-6 relative z-10">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="flex flex-col gap-4">
                    <span className="text-2xl font-serif italic text-brand-red">VoiceSOP</span>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Turn messy voice notes into professional standard operating procedures in seconds.
                    </p>
                    <div className="flex gap-4 mt-2">
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <Linkedin size={18} />
                        </a>
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-lg">Product</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-lg">Resources</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-lg">Company</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                    </ul>
                </div>
            </div>

            <div className="container mx-auto mt-20 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                <p>© 2025 VoiceSOP. All rights reserved.</p>
            </div>
        </footer>
    );
}
