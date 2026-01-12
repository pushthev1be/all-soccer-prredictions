import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: predictionId } = await context.params;

    const prediction = await prisma.prediction.findUnique({
      where: {
        id: predictionId,
        userId: session.user.id,
      },
      include: {
        feedback: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json(
      { error: "Failed to fetch prediction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: predictionId } = await context.params;
    console.log("🗑️ Delete request for prediction:", predictionId);

    // Find the prediction
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (prediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own predictions" },
        { status: 403 }
      );
    }

    // Get feedback ID if it exists
    const feedback = await prisma.feedback.findUnique({
      where: { predictionId },
      select: { id: true },
    });

    // Delete citations first (they reference feedback)
    if (feedback) {
      await prisma.citation.deleteMany({
        where: { feedbackId: feedback.id },
      });
    }

    // Delete feedback (references prediction)
    await prisma.feedback.deleteMany({
      where: { predictionId },
    });

    // Delete sources (references prediction)
    await prisma.source.deleteMany({
      where: { predictionId },
    });

    // Delete the prediction
    await prisma.prediction.delete({
      where: { id: predictionId },
    });

    return NextResponse.json({
      success: true,
      message: "Prediction deleted successfully",
    });

  } catch (error) {
    console.error("❌ Delete prediction error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
