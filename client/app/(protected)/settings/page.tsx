"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { confirmDialog, notify } from "@/lib/feedback";

export default function SettingsPage() {
  const { profile, firebaseUser, signOutUser } = useAuth();
  const { selectedCaseId, workspace } = useAssessmentWorkspace();
  const [signingOut, setSigningOut] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const activeCaseId =
    selectedCaseId && selectedCaseId !== "undefined" ? selectedCaseId : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setConsentAccepted(
      window.localStorage.getItem("civicbridge.ai-consent") === "accepted",
    );
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[18px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <h2 className="font-heading text-[30px] font-bold tracking-[-0.04em] text-[#173b72]">
          Account Settings
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.8] text-[#62728f]">
          Review your account, consent preferences, and session options.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
            Full Name
          </p>
          <p className="mt-3 font-heading text-[22px] font-bold text-[#173b72]">
            {profile?.name || firebaseUser?.displayName || "Not provided"}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
            Email
          </p>
          <p className="mt-3 font-heading text-[22px] font-bold text-[#173b72]">
            {profile?.email || firebaseUser?.email || "Not provided"}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
            AI Consent
          </p>
          <p className="mt-3 text-[16px] font-semibold text-[#173b72]">
            {consentAccepted ? "Accepted on this browser" : "Not accepted on this browser"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[#62728f]">
            Consent is stored locally so you do not need to confirm it every time.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              const nextValue = !consentAccepted;
              setConsentAccepted(nextValue);

              if (nextValue) {
                window.localStorage.setItem("civicbridge.ai-consent", "accepted");
                notify.success("AI consent has been saved for this browser.");
              } else {
                window.localStorage.removeItem("civicbridge.ai-consent");
                notify.success("AI consent has been removed from this browser.");
              }
            }}
          >
            {consentAccepted ? "Remove Consent" : "Accept Consent"}
          </Button>
        </div>
        {workspace?.currentCase ? (
          <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
              Current Case
            </p>
            <p className="mt-3 font-heading text-[22px] font-bold text-[#173b72]">
              {workspace.currentCase.title}
            </p>
            <p className="mt-2 text-sm text-[#62728f]">
              Current stability score: {workspace.analysis.stabilityScore}
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
            Navigation
          </p>
          <p className="mt-3 text-[15px] leading-[1.8] text-[#62728f]">
            Move back into your current work quickly or review your saved case history.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {activeCaseId ? (
              <Link
                href={`/cases/${activeCaseId}`}
                className="inline-flex rounded-[12px] border border-[#d9deea] bg-white px-4 py-2.5 font-semibold text-[#173b72]"
              >
                Open Active Case
              </Link>
            ) : null}
            <Link
              href="/cases"
              className="inline-flex rounded-[12px] border border-[#d9deea] bg-white px-4 py-2.5 font-semibold text-[#173b72]"
            >
              Open Case History
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-[12px] border border-[#d9deea] bg-white px-4 py-2.5 font-semibold text-[#173b72]"
            >
              Back To Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
            Session
          </p>
          <p className="mt-3 text-[15px] leading-[1.8] text-[#62728f]">
            Sign out when you are done to end this browser session. Your saved
            backend data will remain available the next time you sign in.
          </p>
          <div className="mt-5">
            <Button
              type="button"
              disabled={signingOut}
              onClick={async () => {
                const result = await confirmDialog({
                  title: "Sign out now?",
                  text: "You can sign back in at any time to reopen your saved cases and workspace.",
                  confirmButtonText: "Sign Out",
                });

                if (!result.isConfirmed) {
                  return;
                }

                setSigningOut(true);
                try {
                  await signOutUser();
                  notify.success("You have been signed out.");
                } catch (error) {
                  notify.error(
                    error instanceof Error
                      ? error.message
                      : "We couldn't sign you out right now.",
                  );
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
