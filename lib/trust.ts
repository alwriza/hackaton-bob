import { supabase } from './supabase';

/**
 * Recalculates trust score for a user based on their transaction history.
 * Formula: 60% from completion rate + 30% from no-dispute rate + 10% base
 */
export async function recalcTrustScore(userId: string): Promise<number> {
  try {
    const { data: allTx } = await supabase
      .from('transactions')
      .select('status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (!allTx || allTx.length === 0) return 100;

    const total = allTx.length;
    const completed = allTx.filter(t => t.status === 'COMPLETED').length;
    const disputed = allTx.filter(t => t.status === 'DISPUTED').length;

    const completionScore = (completed / total) * 60;
    const disputeScore = (1 - disputed / total) * 30;
    const base = 10;

    const score = Math.round(completionScore + disputeScore + base);
    const clamped = Math.max(10, Math.min(100, score));

    await supabase
      .from('profiles')
      .update({ trust_score: clamped })
      .eq('id', userId);

    return clamped;
  } catch (err) {
    console.error('recalcTrustScore error:', err);
    return 100;
  }
}

/**
 * Returns a trust score breakdown for display.
 */
export async function getTrustBreakdown(userId: string) {
  try {
    const { data: allTx } = await supabase
      .from('transactions')
      .select('status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    const total = allTx?.length || 0;
    const completed = allTx?.filter(t => t.status === 'COMPLETED').length || 0;
    const disputed = allTx?.filter(t => t.status === 'DISPUTED').length || 0;
    const active = allTx?.filter(t => t.status === 'ACTIVE').length || 0;

    return { total, completed, disputed, active };
  } catch {
    return { total: 0, completed: 0, disputed: 0, active: 0 };
  }
}
