import { NextResponse } from 'next/server';
import { getNpcData } from '@/lib/npc-data';
import { jsonExport } from '@/lib/json-export';

export async function GET() {
  const npcData = await getNpcData();
  const jsonData = jsonExport(npcData);

  return NextResponse.json(jsonData);
}