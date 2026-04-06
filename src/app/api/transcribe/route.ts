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

        const formData = await req.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Missing audio file.' }, { status: 400 });
        }

        if (!SUPPORTED_MIME_TYPES.has(file.type)) {
            return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 400 });
        }

        if (file.size > MAX_AUDIO_SIZE_BYTES) {
            return NextResponse.json({ error: 'Audio file is too large (max 25 MB).' }, { status: 400 });
        }

        // Convert Next.js Web File to Node Buffer for Groq SDK
        const buffer = Buffer.from(await file.arrayBuffer());
        const groqFile = await toFile(buffer, file.name, { type: file.type });

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
