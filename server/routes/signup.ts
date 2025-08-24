import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

// Basic info schema
const basicInfoSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  countryCode: z.string().min(1),
  mobileNumber: z.string().min(10).max(15),
  state: z.string().optional(),
});

// Complete signup schema
const completeSignupSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  countryCode: z.string().min(1),
  mobileNumber: z.string().min(10).max(15),
  state: z.string().optional(),
  deviceAdminSecretCode: z.string().length(4).regex(/^\d+$/),
});

// Generate a unique parent code (6-8 digits)
function generateParentCode(): string {
  const length = Math.floor(Math.random() * 3) + 6; // 6-8 digits
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function registerSignupRoutes(app: Express) {
  // Step 1: Save basic information
  app.post("/api/signup/basic-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = basicInfoSchema.parse(req.body);
      
      // Check if mobile number already exists
      const existingUser = await storage.getUserByMobile(data.mobileNumber);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ 
          message: "Mobile number already registered with another account" 
        });
      }
      
      // Update user with basic info
      await storage.updateUserBasicInfo(userId, data);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Basic info save error:", error);
      res.status(400).json({ 
        message: error.message || "Failed to save basic information" 
      });
    }
  });
  
  // Step 2: Complete signup with security info
  app.post("/api/signup/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = completeSignupSchema.parse(req.body);
      
      // Generate unique parent code
      let parentCode = generateParentCode();
      let attempts = 0;
      
      // Ensure parent code is unique
      while (attempts < 10) {
        const existing = await storage.getUserByParentCode(parentCode);
        if (!existing) break;
        parentCode = generateParentCode();
        attempts++;
      }
      
      if (attempts >= 10) {
        return res.status(500).json({ 
          message: "Failed to generate unique parent code. Please try again." 
        });
      }
      
      // Complete user registration
      await storage.completeUserSignup(userId, {
        ...data,
        parentCode,
        isProfileComplete: true,
      });
      
      res.json({ 
        success: true, 
        parentCode,
        message: "Account created successfully!" 
      });
    } catch (error: any) {
      console.error("Complete signup error:", error);
      res.status(400).json({ 
        message: error.message || "Failed to complete signup" 
      });
    }
  });
}