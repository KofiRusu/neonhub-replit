import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const authRouter = Router();

// Simple session check endpoint
// In Phase 1D, this will integrate with NextAuth
authRouter.get("/auth/session", async (req, res) => {
  // TODO: Integrate with NextAuth session validation
  // For now, return a mock session
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  // Mock session for development
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@neonhub.ai" },
  });

  if (!demoUser) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        image: demoUser.image,
      },
    },
  });
});

// User profile endpoint
authRouter.get("/auth/me", async (req, res, next) => {
  try {
    // TODO: Get user ID from session
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@neonhub.ai" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    if (!demoUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: demoUser,
    });
  } catch (error) {
    next(error);
  }
});
