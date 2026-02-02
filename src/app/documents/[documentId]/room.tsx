"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { useParams, useRouter } from "next/navigation";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { getUsers, getDocuments } from "./action";
import { Id } from "../../../../convex/_generated/dataModel";
import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margins";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";

type User = { id: string; name: string; avatar: string; color: string; };

function AccessDenied({ message }: { message: string }) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-rose-100 p-3 rounded-full">
            <AlertTriangleIcon className="size-10 text-rose-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 max-w-md">{message}</p>
        </div>
      </div>
      <Button onClick={() => router.push("/")} className="font-medium">
        Go to Home
      </Button>
    </div>
  );
}

// Cache for users to avoid refetching
const usersCache = new Map<string, User[]>();
const documentsCache = new Map<string, { id: string; name: string }>();

export function Room({ children }: { children: ReactNode }) {
  const params = useParams();
  const documentId = params.documentId as string;

  const [users, setUsers] = useState<User[]>(() => usersCache.get(documentId) || []);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch users in background, don't block render
  useEffect(() => {
    if (usersCache.has(documentId)) return;
    
    getUsers(documentId).then((list) => {
      usersCache.set(documentId, list);
      setUsers(list);
    }).catch(() => {});
  }, [documentId]);

  const resolveUsers = useCallback(({ userIds }: { userIds: string[] }) => {
    return userIds.map((userId) => users.find((user) => user.id === userId) ?? undefined);
  }, [users]);

  if (authError) {
    return <AccessDenied message={authError} />;
  }

  return (
    <LiveblocksProvider
      throttle={50}
      authEndpoint={async () => {
        const endpoint = "/api/liveblocks-auth";
        const room = documentId;

        const response = await fetch(endpoint, {
          method: "POST",
          body: JSON.stringify({ room }),
        });

        const data = await response.json();

        // Handle auth errors gracefully
        if (!response.ok) {
          const errorMessage = data.message || data.error || "You don't have access to this document.";
          setAuthError(errorMessage);
          throw new Error(errorMessage);
        }

        return data;
      }}
      resolveUsers={resolveUsers}
      resolveMentionSuggestions={({ text }) => {
        let filteredUsers = users;

        if (text) {
          filteredUsers = users.filter((user) =>
            user.name.toLowerCase().includes(text.toLowerCase())
          );
        }

        return filteredUsers.map((user) => user.id);
      }}
      resolveRoomsInfo={async ({ roomIds }) => {
        const ids = roomIds as string[];
        const missingIds = ids.filter((id) => !documentsCache.has(id));

        if (missingIds.length > 0) {
          const documents = await getDocuments(missingIds as Id<"documents">[]);
          documents.forEach((document) => {
            documentsCache.set(document.id, {
              id: document.id,
              name: document.name,
            });
          });
        }

        return ids.map((id) => documentsCache.get(id) ?? { id, name: "Untitled" });
      }}
    >
      <RoomProvider
        id={params.documentId as string}
        initialStorage={{ leftMargin: LEFT_MARGIN_DEFAULT, rightMargin: RIGHT_MARGIN_DEFAULT }}
      >
        <ClientSideSuspense fallback={<FullscreenLoader label="Room loading..." />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}