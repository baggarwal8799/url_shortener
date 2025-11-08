import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        { msg: "No token provided" },
        { status: 401 }
      );
    }

    // Next.js 15+ requires awaiting params
    const { urlId } = await params;
    const backendUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/${urlId}`;

    console.log("Fetching analytics:", {
      shortCode: urlId, // Named urlId for the route param, but it's actually shortCode
      backendUrl,
      hasToken: !!token,
      tokenStart: token.substring(0, 20) + "...",
    });

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend analytics error:", {
        status: response.status,
        shortCode: urlId, // Named urlId for the route param, but it's actually shortCode
        backendUrl,
        data,
      });

      return NextResponse.json(
        { msg: data.msg || data.message || "Failed to fetch analytics" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return NextResponse.json(
      { msg: "Internal server error" },
      { status: 500 }
    );
  }
}
