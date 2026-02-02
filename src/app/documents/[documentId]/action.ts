"use server";

import { ConvexHttpClient } from "convex/browser";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
  return await convex.query(api.documents.getByIds, { ids });
}

export async function getUsers(documentId?: string) {
  const [{ userId }, clerk] = await Promise.all([
    auth(),
    clerkClient(),
  ]);

  if (!userId) {
    return [];
  }

  // If documentId is provided, fetch users based on document's organization
  if (documentId) {
    try {
      const document = await convex.query(api.documents.getById, { id: documentId as Id<"documents"> });
      
      if (document?.organizationId) {
        // Get all users in the document's organization
        const orgUsers = await clerk.users.getUserList({
          organizationId: [document.organizationId],
          limit: 100,
        });

        return orgUsers.data.map((user) => ({
          id: user.id,
          name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
          avatar: user.imageUrl,
          color: "",
        }));
      }
    } catch (error) {
      console.error("Error fetching document users:", error);
    }
  }

  // Fallback: return just the current user
  try {
    const currentUser = await clerk.users.getUser(userId);
    return [{
      id: currentUser.id,
      name: currentUser.fullName ?? currentUser.primaryEmailAddress?.emailAddress ?? "Anonymous",
      avatar: currentUser.imageUrl,
      color: "",
    }];
  } catch {
    return [];
  }
}