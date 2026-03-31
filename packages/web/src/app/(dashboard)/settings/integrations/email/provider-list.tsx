import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Star, Send, CheckCircle, XCircle } from "lucide-react";
import { removeEmailProvider, setDefaultProvider, sendTestEmail } from "./actions";

interface Provider {
  id: string;
  name: string;
  provider: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string | null;
  isDefault: boolean;
  lastTestedAt: Date | null;
  lastTestResult: string | null;
  createdBy: { name: string | null };
}

const providerColors: Record<string, { bg: string; text: string }> = {
  SENDGRID: { bg: "bg-blue-100", text: "text-blue-600" },
  SES: { bg: "bg-orange-100", text: "text-orange-600" },
  MAILGUN: { bg: "bg-red-100", text: "text-red-600" },
  MAILCHIMP: { bg: "bg-yellow-100", text: "text-yellow-600" },
};

export function ProviderList({
  providers,
  returnTo,
}: {
  providers: Provider[];
  returnTo: string;
}) {
  if (providers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Configured</h2>
      {providers.map((p) => {
        const colors = providerColors[p.provider] || { bg: "bg-gray-100", text: "text-gray-600" };
        return (
          <Card key={p.id} className={`p-5 ${p.isDefault ? "ring-2 ring-indigo-500" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Mail className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.fromName} &lt;{p.fromEmail}&gt;
                    {p.replyToEmail && ` • Reply-to: ${p.replyToEmail}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Added by {p.createdBy.name}
                    {p.lastTestedAt && (
                      <>
                        {" • Last tested: "}
                        {p.lastTestResult === "success" ? (
                          <span className="text-green-600 inline-flex items-center gap-0.5">
                            <CheckCircle className="h-3 w-3 inline" /> Passed
                          </span>
                        ) : (
                          <span className="text-red-600 inline-flex items-center gap-0.5">
                            <XCircle className="h-3 w-3 inline" /> {p.lastTestResult}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={sendTestEmail}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="outline" size="sm" className="gap-1">
                    <Send className="h-3 w-3" /> Test
                  </Button>
                </form>
                {!p.isDefault && (
                  <form action={setDefaultProvider}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <Button type="submit" variant="outline" size="sm" className="gap-1">
                      <Star className="h-3 w-3" /> Make Default
                    </Button>
                  </form>
                )}
                <form action={removeEmailProvider}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
