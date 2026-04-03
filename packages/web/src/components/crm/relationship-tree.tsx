"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

interface Relationship {
  id: string;
  fromContactId: string;
  toContactId: string;
  type: string;
  description?: string | null;
  fromContact: Contact;
  toContact: Contact;
}

interface RelationshipTreeProps {
  contactId: string;
  relationships: Relationship[];
  onAddRelationship?: () => void;
}

interface TreeNode {
  id: string;
  contact: Contact;
  type: string;
  direction: "outgoing" | "incoming";
  depth: number;
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  SPOUSE: "#dc2626",
  PARENT: "#0891b2",
  CHILD: "#2563eb",
  SIBLING: "#7c3aed",
  EMPLOYER: "#ea580c",
  EMPLOYEE: "#16a34a",
  FRIEND: "#d97706",
  GUARDIAN: "#6366f1",
  OTHER: "#6b7280",
};

const getRelationshipLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SPOUSE: "Spouse",
    PARENT: "Parent",
    CHILD: "Child",
    SIBLING: "Sibling",
    EMPLOYER: "Employer",
    EMPLOYEE: "Employee",
    FRIEND: "Friend",
    GUARDIAN: "Guardian",
    OTHER: "Other",
  };
  return labels[type] || type;
};

export function RelationshipTree({
  contactId,
  relationships,
  onAddRelationship,
}: RelationshipTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build a map of all related contacts
  const relatedContacts = useMemo(() => {
    const map = new Map<string, { contact: Contact; type: string; direction: "outgoing" | "incoming" }[]>();

    relationships.forEach((rel) => {
      if (rel.fromContactId === contactId) {
        if (!map.has(rel.toContactId)) {
          map.set(rel.toContactId, []);
        }
        map.get(rel.toContactId)!.push({
          contact: rel.toContact,
          type: rel.type,
          direction: "outgoing",
        });
      } else if (rel.toContactId === contactId) {
        if (!map.has(rel.fromContactId)) {
          map.set(rel.fromContactId, []);
        }
        map.get(rel.fromContactId)!.push({
          contact: rel.fromContact,
          type: rel.type,
          direction: "incoming",
        });
      }
    });

    return map;
  }, [relationships, contactId]);

  const toggleNode = (contactId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedNodes(newExpanded);
  };

  if (relationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No relationships found.</p>
            {onAddRelationship && (
              <button
                onClick={onAddRelationship}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Add a relationship
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relationships ({relationships.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ minHeight: "400px" }} className="border rounded-lg bg-gray-50 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 1000 500" className="">
              {/* Draw SVG network diagram */}
              {renderNetworkDiagram(contactId, relatedContacts)}
            </svg>
          </div>

          {/* Fallback list view for accessibility */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Relationships List</h3>
            {Array.from(relatedContacts.entries()).map(([contactIdKey, rels]) => {
              const relatedContact = rels[0]?.contact;
              if (!relatedContact) return null;

              return (
                <div
                  key={contactIdKey}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={relatedContact.firstName}
                      lastName={relatedContact.lastName}
                      imageUrl={relatedContact.avatar ?? undefined}
                      size="sm"
                    />

                    <div className="flex-1">
                      <Link
                        href={`/crm/contacts/${relatedContact.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {relatedContact.firstName} {relatedContact.lastName}
                      </Link>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {rels.map((rel, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{
                              backgroundColor: RELATIONSHIP_COLORS[rel.type],
                            }}
                          >
                            {getRelationshipLabel(rel.type)}
                            {rel.direction === "incoming" && " (from)"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onAddRelationship && (
            <button
              onClick={onAddRelationship}
              className="mt-6 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition text-sm font-medium"
            >
              + Add Relationship
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Render SVG network diagram showing relationship tree
 */
function renderNetworkDiagram(
  centralContactId: string,
  relatedContacts: Map<string, { contact: Contact; type: string; direction: "outgoing" | "incoming" }[]>
): React.ReactNode {
  const items = Array.from(relatedContacts.entries());
  const nodeCount = items.length;

  if (nodeCount === 0) {
    return (
      <text x="500" y="250" textAnchor="middle" className="text-gray-400" fontSize="14">
        No relationships to display
      </text>
    );
  }

  // Position nodes in a circle around the central contact
  const centerX = 500;
  const centerY = 250;
  const radius = Math.min(150, 400 / Math.max(1, nodeCount));

  return (
    <g>
      {/* Draw connection lines */}
      {items.map((_, idx) => {
        const angle = (idx / nodeCount) * Math.PI * 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Draw line from center to node
        return (
          <line
            key={`line-${idx}`}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="#d1d5db"
            strokeWidth="2"
          />
        );
      })}

      {/* Draw central contact node */}
      <circle cx={centerX} cy={centerY} r="30" fill="#4f46e5" opacity="0.1" stroke="#4f46e5" strokeWidth="2" />
      <text x={centerX} y={centerY + 5} textAnchor="middle" className="text-xs font-semibold" fill="#4f46e5">
        YOU
      </text>

      {/* Draw related contact nodes */}
      {items.map(([contactId, rels], idx) => {
        const angle = (idx / nodeCount) * Math.PI * 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const relatedContact = rels[0]?.contact;

        if (!relatedContact) return null;

        const color = RELATIONSHIP_COLORS[rels[0]?.type] || RELATIONSHIP_COLORS.OTHER;
        const initials = `${relatedContact.firstName[0]}${relatedContact.lastName[0]}`;

        return (
          <g key={`node-${contactId}`}>
            {/* Node circle */}
            <circle cx={x} cy={y} r="25" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />

            {/* Initials */}
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              className="text-xs font-bold"
              fill={color}
              fontSize="11"
            >
              {initials}
            </text>

            {/* Relationship type label */}
            <text
              x={x}
              y={y + 45}
              textAnchor="middle"
              className="text-xs"
              fill="#374151"
              fontSize="10"
            >
              {getRelationshipLabel(rels[0]?.type || "")}
            </text>
          </g>
        );
      })}
    </g>
  );
}
