import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard } from "@/components/finance/kanban-board";
import { PipelineStats } from "@/components/finance/pipeline-stats";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ assignedTo?: string; stage?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Major Donor Pipeline</h1>
          <p className="text-gray-500 mt-1">Manage donor opportunities and track major gifts</p>
        </div>
        <Link href="/finance/pipeline/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </Link>
      </div>

      <PipelineStats />

      <Card>
        <div className="p-6">
          <KanbanBoard
            assignedTo={params.assignedTo}
            initialStage={params.stage}
          />
        </div>
      </Card>
    </div>
  );
}
