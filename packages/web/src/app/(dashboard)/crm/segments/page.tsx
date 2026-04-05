import { formatDate, formatShortDate } from '@/lib/utils';
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SegmentsPage() {
  const session = await requireAuth();

  const segments = await prisma.savedSegment.findMany({
    where: {
      createdById: session.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Segments</h1>
          <p className="text-gray-500 mt-1">Create and manage dynamic contact segments</p>
        </div>
        <Link href="/crm/segments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Segment
          </Button>
        </Link>
      </div>

      {segments.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No segments yet"
          description="Create your first segment to organize and target your contacts"
          actionLabel="Create Segment"
          actionHref="/crm/segments/new"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Link key={segment.id} href={`/crm/segments/${segment.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  {segment.description && (
                    <CardDescription className="line-clamp-2">
                      {segment.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(segment.createdAt)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {formatDate(segment.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
