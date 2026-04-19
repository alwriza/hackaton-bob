import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, document, selfie } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'No user ID provided' }, { status: 400 });
    }

    // MVP Mock Verification Logic
    // We do NOT save files. We just set is_verified to true.
    const confidence = Math.floor(Math.random() * (98 - 85 + 1)) + 85;

    const { error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_status: 'VERIFIED',
        verification_confidence: confidence
      })
      .eq('id', user_id);

    if (error) {
      console.error('Verify API DB error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, confidence });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
