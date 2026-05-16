"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
});

export async function signUpUser(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const data = Object.fromEntries(formData.entries());
    
    const parsed = signupSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, password, role } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: "An account with this email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign to a default department for demo purposes if not specified
    const defaultDept = await prisma.department.findFirst();
    if (!defaultDept) {
      return { error: "System error: No departments found in database to assign to." };
    }

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        departmentId: defaultDept.id,
      }
    });

    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { error: error.message || "Failed to create account." };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}
