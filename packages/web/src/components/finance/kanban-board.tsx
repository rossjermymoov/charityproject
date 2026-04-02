"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

const STAGES = [
  { id: "IDENTIFICATION", label: "Identification", color: "bg-gray-100 text-gray-800" },
  { id: "QUALIFICATION", label: "Qualification", color: "bg-blue-100 text-blue-800" },
  { id: "CULTIVATION", label: "Cultivation", color: "bg-purple-100 text-purple-800" },
  { id: "SOLICITATION", label: "Solicitation", color: "bg-amber-100 text-amber-800" },
  { id: "NEGOTIATION", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { id: "CLOSED_WON", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { id: "CLOSED_LOST", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  stage: string;
  contact: {
    firstName: string;
    lastName: string;
  };
  assignedTo: {
    name: string;
  } | null;
}

function getValueColor(amount: number): string {
  if (amount >= 10000) return "border-yellow-400";
  if (amount >= 1000) return "border-blue-400";
  return "border-gray-200";
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const [isMoving, setIsMoving] = useState(false);
  const [currentStage, setCurrentStage] = useState(opportunity.stage);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  const handleStageChange = async (newStage: string) => {
    if (newStage === currentStage) {
      setShowStageDropdown(false);
      return;
    }

    setIsMoving(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (response.ok) {
        setCurrentStage(newStage);
        setShowStageDropdown(false);
      }
    } catch (error) {
      console.error("Failed to update stage:", error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Link href={`/finance/pipeline/${opportunity.id}`}>
      <Card
        className={cn(
          "p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4",
          getValueColor(opportunity.amount),
          "hover:bg-gray-50"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-gray-900 flex-1 hover:text-indigo-600">
              {opportunity.name}
            </h3>
            <div
              className="relative"
              onClick={(e) => {
                e.preventDefault();
                setShowStageDropdown(!showStageDropdown);
              }}
            >
              <button
                className="text-gray-400 hover:text-gray-600"
                disabled={isMoving}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              {showStageDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                  {STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleStageChange(stage.id);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors",
                        currentStage === stage.id && "bg-indigo-50 font-medium"
                      )}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {opportunity.contact.firstName} {opportunity.contact.lastName}
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                £{opportunity.amount.toFixed(2)}
              </span>
              <Badge variant="outline" className="text-xs">
                {opportunity.probability}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${opportunity.probability}%` }}
              />
            </div>
          </div>

          {opportunity.expectedCloseDate && (
            <p className="text-xs text-gray-500">
              {formatDate(new Date(opportunity.expectedCloseDate))}
            </p>
          )}

          {opportunity.assignedTo && (
            <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
              {opportunity.assignedTo.name}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function KanbanBoard({
  assignedTo,
  initialStage,
}: {
  assignedTo?: string;
  initialStage?: string;
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const params = new URLSearchParams();
        if (assignedTo) params.append("assignedTo", assignedTo);

        const response = await fetch(
          `/api/opportunities?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setOpportunities(data);
        }
      } catch (error) {
        console.error("Failed to fetch opportunities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, [assignedTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max flex gap-6 pb-4">
        {STAGES.map((stage) => {
          const stageOpportunities = opportunities.filter(
            (opp) => opp.stage === stage.id
          );
          const stageValue = stageOpportunities.reduce(
            (sum, opp) => sum + opp.amount,
            0
          );

          return (
            <div key={stage.id} className="min-w-[320px]">
              <div className="mb-4 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Badge className={stage.color}>{stage.label}</Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {stageOpportunities.length} opportunity
                      {stageOpportunities.length !== 1 ? "ies" : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  £{stageValue.toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                {stageOpportunities.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center py-8">
                    <p className="text-sm text-gray-500">No opportunities</p>
                  </div>
                ) : (
                  stageOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
