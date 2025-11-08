import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    const token = req.headers.get("Authorization");

    if (!token) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/urls/${shortCode}`;

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Delete URL error:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to delete URL" },
      { status: 500 }
    );
  }
}
