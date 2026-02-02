import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const CACHE_TTL_MS = 30_000;
const documentCache = new Map<string, { document: any; expiresAt: number }>();
const membershipCache = new Map<string, { isMember: boolean; expiresAt: number }>();

function getCachedDocument(id: string) {
  const cached = documentCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.document;
  if (cached) documentCache.delete(id);
  return null;
}

function setCachedDocument(id: string, document: any) {
  documentCache.set(id, { document, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getCachedMembership(userId: string, organizationId: string) {
  const key = `${userId}:${organizationId}`;
  const cached = membershipCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.isMember;
  if (cached) membershipCache.delete(key);
  return null;
}

function setCachedMembership(userId: string, organizationId: string, isMember: boolean) {
  const key = `${userId}:${organizationId}`;
  membershipCache.set(key, { isMember, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function POST(req: Request) {
  try {
    const { sessionClaims } = await auth();

    if (!sessionClaims) {
      console.error("No session claims found");
      return new Response(JSON.stringify({ error: "Unauthorized - No session" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await currentUser();

    if (!user) {
      console.error("No user found despite having session claims");
      return new Response(JSON.stringify({ error: "Unauthorized - No user" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("User authenticated:", user.id, user.primaryEmailAddress?.emailAddress);

    const { room } = await req.json();
    
    let document = getCachedDocument(room);

    if (!document) {
      try {
        document = await convex.query(api.documents.getById, { id: room });
        if (document) setCachedDocument(room, document);
      } catch (error) {
        console.error("Error fetching document:", error);
        return new Response(JSON.stringify({ error: "Document not found" }), { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isOwner = document.ownerId === user.id;
    
    const userOrgId = sessionClaims.org_id as string | undefined;
    
    // Check if user is in the same organization via session (active org)
    const isOrganizationMemberViaSession = !!(
      document.organizationId && 
      userOrgId && 
      document.organizationId === userOrgId
    );

    // Check if user is member of the document's organization via Clerk API
    // This checks ALL organizations the user belongs to, not just active one
    let isOrganizationMemberViaClerk = false;
    if (document.organizationId) {
      const cachedMembership = getCachedMembership(user.id, document.organizationId);
      if (cachedMembership !== null) {
        isOrganizationMemberViaClerk = cachedMembership;
      } else {
        try {
          const clerk = await clerkClient();
          const memberships = await clerk.users.getOrganizationMembershipList({
            userId: user.id,
          });
          isOrganizationMemberViaClerk = memberships.data.some(
            (membership) => membership.organization.id === document.organizationId
          );
          setCachedMembership(user.id, document.organizationId, isOrganizationMemberViaClerk);
        } catch (error) {
          console.error("Error checking organization membership:", error);
        }
      }
    }

    const isOrganizationMember = isOrganizationMemberViaSession || isOrganizationMemberViaClerk;
    
    // Access control:
    // - Personal documents: only owner can access
    // - Organization documents: only organization members can access
    const hasAccess = isOwner || isOrganizationMember;

    console.log("Liveblocks Auth Check:", {
      userId: user.id,
      userEmail: user.primaryEmailAddress?.emailAddress,
      documentId: room,
      documentOwnerId: document.ownerId,
      documentOrgId: document.organizationId,
      userActiveOrgId: userOrgId,
      isOwner,
      isOrganizationMemberViaSession,
      isOrganizationMemberViaClerk,
      hasAccess
    });

    if (!hasAccess) {
      return new Response(JSON.stringify({ 
        error: "Forbidden",
        message: document.organizationId 
          ? "You must be a member of the organization to access this document."
          : "This is a personal document. Only the owner can access it."
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous";
    const nameToNumber = name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const hue = Math.abs(nameToNumber) % 360;
    const color = `hsl(${hue}, 80%, 60%)`;
    
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name,
        avatar: user.imageUrl,
        color,
      },
    });
    session.allow(room, session.FULL_ACCESS);
    const { body, status } = await session.authorize();

    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
