import { NextResponse } from 'next/server';
import { getAuthStatusSummary } from '@/ai/auth-strategies';

export async function GET() {
  const status = getAuthStatusSummary();
  return NextResponse.json(status);
}
