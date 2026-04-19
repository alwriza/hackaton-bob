import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateRiskScore } from '@/lib/message-filter';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transaction_id, sender_id, text } = body;

        if (!transaction_id || !sender_id || !text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Backend real protection
        const { score, isSafe, flags } = calculateRiskScore(text);

        if (!isSafe) {
            // Return a structured error preventing insertion to DB
            return NextResponse.json({
                error: 'Нельзя делиться контактами. Общайтесь внутри платформы.',
                riskScore: score,
                flags
            }, { status: 403 });
        }

        // Safe to insert
        const { data, error } = await supabase.from('messages').insert({
            transaction_id,
            sender_id,
            text
        }).select().single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Message API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
