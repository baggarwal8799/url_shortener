import { NextRequest, NextResponse } from "next/server";

// POST - Create shortened URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { msg: "No token provided" },
        { status: 401 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/urls`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { msg: data.msg || data.message || "Failed to create URL" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("URL creation proxy error:", error);
    return NextResponse.json(
      { msg: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get user's URLs
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { msg: "No token provided" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const backendUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/urls${queryString ? '?' + queryString : ''}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { msg: data.msg || data.message || "Failed to fetch URLs" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("URL fetch proxy error:", error);
    return NextResponse.json(
      { msg: "Internal server error" },
      { status: 500 }
    );
  }
}
