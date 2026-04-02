"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Megaphone, Mail, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface OpportunityDetailProps {
  opportunity: any;
}

const STAGE_COLORS: Record<string, string> = {
  IDENTIFICATION: "bg-gray-100 text-gray-800",
  QUALIFICATION: "bg-blue-100 text-blue-800",
  CULTIVATION: "bg-purple-100 text-purple-800",
  SOLICITATION: "bg-amber-100 text-amber-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  CLOSED_WON: "bg-green-100 text-green-800",
  CLOSED_LOST: "bg-red-100 text-red-800",
};

export function OpportunityDetail({ opportunity }: OpportunityDetailProps) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Contact
            </label>
            <Link
              href={`/crm/contacts/${opportunity.contactId}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
            >
              {opportunity.contact.firstName} {opportunity.contact.lastName}
            </Link>
            {opportunity.contact.email && (
              <a
                href={`mailto:${opportunity.contact.email}`}
                className="text-xs text-gray-500 flex items-center gap-1 mt-1 hover:text-gray-700"
              >
                <Mail className="h-3 w-3" />
                {opportunity.contact.email}
              </a>
            )}
            {opportunity.contact.phone && (
              <a
                href={`tel:${opportunity.contact.phone}`}
                className="text-xs text-gray-500 flex items-center gap-1 mt-1 hover:text-gray-700"
              >
                <Phone className="h-3 w-3" />
                {opportunity.contact.phone}
              </a>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Dates
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(new Date(opportunity.createdAt))}
                  </p>
                </div>
              </div>
              {opportunity.expectedCloseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Expected Close</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(new Date(opportunity.expectedCloseDate))}
                    </p>
                  </div>
                </div>
              )}
              {opportunity.actualCloseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Actual Close</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(new Date(opportunity.actualCloseDate))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Assignment
            </label>
            {opportunity.assignedTo ? (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {opportunity.assignedTo.name}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {opportunity.assignedTo.email}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Unassigned</p>
            )}
          </div>
        </div>
      </Card>

      {opportunity.campaign && (
        <Card>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Campaign
              </label>
              <Link
                href={`/campaigns/${opportunity.campaignId}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-2 block"
              >
                <Megaphone className="h-4 w-4" />
                {opportunity.campaign.name}
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Created By
            </label>
            <p className="text-sm font-medium text-gray-900 mt-2">
              {opportunity.createdBy.name}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
