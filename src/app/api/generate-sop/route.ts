
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@/utils/supabase/server';

// Initialize with the specific API key env var
// Note: The user code sample showed `new GoogleGenAI({})` but implied it read from env.
// Our env var is GEMINI_API_KEY. To be safe, we pass it explicitly.
const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
    try {
        const { audioUrl, sopId, transcript } = await req.json();

        if (!sopId) {
            return NextResponse.json({ error: 'Missing sopId' }, { status: 400 });
        }

        // 1. Authenticate User (Server-Side)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Validate Ownership of SOP
        const { data: sop, error: sopError } = await supabase
            .from('sops')
            .select('user_id')
            .eq('id', sopId)
            .single();

        if (sopError || !sop) {
            return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
        }

        if (sop.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: You do not own this SOP' }, { status: 403 });
        }

        // 3. Quota Check (Server-Side Enforced)
        // Fetch Profile for Tier
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        const tier = profile?.subscription_tier || 'free';

        if (tier === 'free') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('sops')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth.toISOString());

            if ((count || 0) > 3) {
                return NextResponse.json({
                    error: 'Monthly quota reached. Upgrade to Pro for unlimited generation.'
                }, { status: 403 });
            }
        }

        let text = "";

        // STRATEGY: Transcript Only (No Audio Fallback)
        if (transcript && transcript.length > 10) {
            // --- TEXT MODE ONLY ---
            const prompt = `
            You are an expert business process consultant. Convert this process transcript into a professional, clear, and actionable Standard Operating Procedure (SOP).

            TRANSCRIPT:
            "${transcript}"

            GUIDELINES:
            - Tone: Professional, authoritative, and direct (ISO Standard style).
            - Format: Action-oriented steps (start with verbs).
            - Structure: Comprehensive business document.

            The Output MUST be valid JSON with the following schema:
            {
                "title": "Professional Title (e.g., 'SOP-001: Procedure Name')",
                "purpose": "Clear statement of what this SOP achieves",
                "scope": "Who and what this SOP applies to",
                "prerequisites": ["List of tools, permissions, or conditions needed before starting"],
                "roles": ["List of roles responsible for this process"],
                "steps": [
                    {
                        "title": "Step Title",
                        "description": "Clear, detailed instruction",
                        "warning": "Critical safety or compliance warning (optional)",
                        "checklist": ["Sub-steps", "Verification points"]
                    }
                ],
                "glossary": [
                    { "term": "Term", "definition": "Definition" }
                ]
            }
            
            Do not include markdown formatting (like \`\`\`json). Just return the raw JSON.
            `;

            // Updated to use @google/genai syntax
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            if (!response.text) {
                console.error("Gemini Response Empty:", JSON.stringify(response, null, 2));
                throw new Error("AI returned empty response.");
            }
            text = response.text;

        } else {
            // If transcript is missing or too short, we fail.
            return NextResponse.json({ error: 'Valid transcript is required. Please ensure the recording was transcribed correctly.' }, { status: 400 });
        }

        // 4. Robust JSON Parsing
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;

        let sopContent;
        try {
            sopContent = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error. Raw Text:", text);
            throw new Error("Failed to parse AI response. It may not be valid JSON.");
        }

        // 5. Update Supabase
        const { error } = await supabase
            .from('sops')
            .update({
                title: sopContent.title,
                content: sopContent,
                tags: ['Generated', 'AI']
            })
            .eq('id', sopId);

        if (error) {
            console.error("Supabase Update Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true, sop: sopContent });

    } catch (error: any) {
        console.error("Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
