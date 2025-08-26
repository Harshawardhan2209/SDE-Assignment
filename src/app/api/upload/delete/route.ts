import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const key = body.key;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid object key." },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    await S3.send(command);

    console.log('✅ File deleted successfully:', key);

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 }
    );
  }
}
