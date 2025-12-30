
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { audioUrl, sopId, transcript } = await req.json();

        if (!sopId) {
            return NextResponse.json({ error: 'Missing sopId' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        let text = "";

        // STRATEGY: Use Transcript if available (User Edited), else Audio (Fallback)
        if (transcript && transcript.length > 10) {
            // --- TEXT MODE ---
            const prompt = `
            You are an expert business process consultant. Convert this process transcript into a professional Standard Operating Procedure (SOP) JSON object.
            
            TRANSCRIPT:
            "${transcript}"
            
            The Output MUST be valid JSON with the following schema:
            {
                "title": "Clear, professional title",
                "purpose": "1-2 sentences explaining what this SOP achieves",
                "steps": [
                    {
                        "title": "Step Title",
                        "description": "Detailed instruction",
                        "warning": "Optional warning text if mentioned",
                        "checklist": ["Optional", "list", "of", "sub-items"]
                    }
                ]
            }
            
            Do not include markdown formatting (like \`\`\`json). Just return the raw JSON.
            `;

            const result = await model.generateContent(prompt);
            text = result.response.text();

        } else if (audioUrl) {
            // --- AUDIO MODE (Fallback) ---
            const audioResponse = await fetch(audioUrl);
            if (!audioResponse.ok) {
                throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
            }
            const audioBuffer = await audioResponse.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');

            const prompt = `
            You are an expert business process consultant. Convert this voice transcript into a professional Standard Operating Procedure (SOP) JSON object.
            
            The Output MUST be valid JSON with the following schema:
            {
                "title": "Clear, professional title",
                "purpose": "1-2 sentences explaining what this SOP achieves",
                "steps": [
                    {
                        "title": "Step Title",
                        "description": "Detailed instruction",
                        "warning": "Optional warning text if mentioned",
                        "checklist": ["Optional", "list", "of", "sub-items"]
                    }
                ]
            }
            
            Do not include markdown formatting (like \`\`\`json). Just return the raw JSON.
            `;

            const parts = [
                {
                    inlineData: {
                        mimeType: "audio/webm",
                        data: base64Audio
                    }
                },
                { text: prompt }
            ];

            const result = await model.generateContent(parts);
            text = result.response.text();

        } else {
            return NextResponse.json({ error: 'Missing audioUrl or transcript' }, { status: 400 });
        }

        // Clean up markdown if Gemini adds it
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const sopContent = JSON.parse(text);

        // 5. Update Supabase
        const supabase = await createClient();
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
