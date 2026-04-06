import { NextRequest, NextResponse } from 'next/server';
import Groq, { toFile } from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SUPPORTED_MIME_TYPES = new Set([
    'audio/flac',
    'audio/mp3',
    'audio/mp4',
    'audio/mpeg',
    'audio/mpga',
    'audio/m4a',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
]);

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const clientIp = getClientIp(req.headers);
        const ipLimit = await checkRateLimit(`transcribe:ip:${clientIp}`, 20, 60_000);
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many transcription requests. Please wait and try again.' },
                { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
            );
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userLimit = await checkRateLimit(`transcribe:user:${user.id}`, 12, 60_000);
        if (!userLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many transcription attempts. Please wait and try again.' },
                { status: 429, headers: { 'Retry-After': String(userLimit.retryAfterSeconds) } }
            );
        }

        const body = await req.json();
        const { audioUrl } = body;

        if (!audioUrl) {
            return NextResponse.json({ error: 'Missing audioUrl.' }, { status: 400 });
        }

        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch audio from storage.' }, { status: 400 });
        }

        const buffer = Buffer.from(await audioRes.arrayBuffer());
        
        if (buffer.length > MAX_AUDIO_SIZE_BYTES) {
            return NextResponse.json({ error: 'Audio file is too large (max 25 MB).' }, { status: 400 });
        }

        // Convert fetched buffer to Groq File
        const groqFile = await toFile(buffer, 'audio.webm', { type: 'audio/webm' });

        const transcription = await groq.audio.transcriptions.create({
            model: 'whisper-large-v3-turbo',
            file: groqFile,
            response_format: 'json',
            language: 'en',
            temperature: 0,
        });

        const text = (transcription.text || '').trim();
        if (!text) {
            return NextResponse.json({ error: 'Unable to transcribe audio.' }, { status: 422 });
        }

        return NextResponse.json({ text });
    } catch (error: unknown) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 });
    }
}
