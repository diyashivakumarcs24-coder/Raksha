import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for Google Places Nearby Search.
 * Keeps the API key server-side (not exposed to client).
 * Falls back gracefully if key is missing.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type");
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;

  if (!apiKey || !lat || !lng || !type) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=${type}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    const data = await res.json();
    return NextResponse.json({ results: data.results ?? [] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
