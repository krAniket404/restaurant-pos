import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json({ error: 'Invalid availability state' }, { status: 400 });
    }

    if (!process.env.SANITY_API_WRITE_TOKEN) {
      console.error('Missing SANITY_API_WRITE_TOKEN');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const result = await writeClient
      .patch(id)
      .set({ isAvailable })
      .commit();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating menu availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
