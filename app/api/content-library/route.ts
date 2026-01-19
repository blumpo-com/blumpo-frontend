import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getUserAds } from "@/lib/db/queries/ads";

/**
 * GET /api/content-library?brandId=xxx
 * Fetches all adImages for the authenticated user, optionally filtered by brandId
 */
export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const limit = parseInt(searchParams.get("limit") || "1000"); // Increased limit for client-side filtering
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch all images for the user, optionally filtered by brandId
    // includeDeleted allows fetching deleted images for client-side filtering
    const adImages = await getUserAds(user.id, {
      brandId: brandId || undefined,
      limit,
      offset,
      includeDeleted: includeDeleted,
    });

    // Filter out images with errors and without publicUrl
    // Return all valid images (client-side filtering will handle the rest)
    const validImages = adImages
      .filter((item) => !item.adImage.errorFlag && item.adImage.publicUrl)
      .map((item) => ({
        id: item.adImage.id,
        title: item.adImage.title,
        publicUrl: item.adImage.publicUrl,
        width: item.adImage.width,
        height: item.adImage.height,
        format: item.adImage.format,
        createdAt: item.adImage.createdAt,
        brand: item.brand,
        job: item.job,
        workflow: item.workflow,
        isDeleted: item.adImage.isDeleted,
      }));

    return NextResponse.json({
      images: validImages,
      total: validImages.length,
    });
  } catch (error) {
    console.error("Error getting content library:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
