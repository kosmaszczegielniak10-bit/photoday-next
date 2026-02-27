import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    try {
        const userId = await requireAuth(request);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: entries, error } = await supabaseAdmin
            .from('entries')
            .select('date')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        if (error) throw error;

        let streak = 0;
        const today = new Date();
        const formatDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const currentDateStr = formatDate(today);
        const uniqueDates = [...new Set((entries || []).map(e => e.date))];

        let checkDate = new Date();

        if (uniqueDates.includes(currentDateStr)) {
            streak++;
            // Check backwards from yesterday
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                let checkStr = formatDate(checkDate);
                if (uniqueDates.includes(checkStr)) streak++;
                else break;
            }
        } else {
            // Check if streak is active starting from yesterday
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            let yesterdayStr = formatDate(yesterday);
            if (uniqueDates.includes(yesterdayStr)) {
                streak++;
                checkDate = new Date(yesterday);
                while (true) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    let checkStr = formatDate(checkDate);
                    if (uniqueDates.includes(checkStr)) streak++;
                    else break;
                }
            }
        }

        return NextResponse.json({
            streak,
            total: uniqueDates.length
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
