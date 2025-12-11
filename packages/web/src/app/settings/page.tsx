// ADR: ADR-011-web-api-architecture
"use client";

import { ShieldCheck, WifiOff, Zap, Brain, Home } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ProviderCard } from "@/components/settings/provider-card";
import { Skeleton } from "@/components/ui/skeleton";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    name: "Anthropic",
    description: "Claude models for high-quality reasoning",
    icon: ShieldCheck,
    fieldLabel: "API Key",
    placeholder: "sk-ant-...",
  },
  {
    id: "openai" as const,
    name: "OpenAI",
    description: "GPT models for versatile generation",
    icon: Zap,
    fieldLabel: "API Key",
    placeholder: "sk-...",
  },
  {
    id: "google" as const,
    name: "Google",
    description: "Gemini models for multimodal tasks",
    icon: Brain,
    fieldLabel: "API Key",
    placeholder: "AIza...",
  },
  {
    id: "ollama" as const,
    name: "Ollama",
    description: "Local models via Ollama runtime",
    icon: Home,
    fieldLabel: "Base URL",
    placeholder: "http://localhost:11434",
  },
];

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = trpc.settings.getProviders.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure provider credentials for Anthropic, OpenAI, Google, and Ollama.
        </p>
      </div>

      {isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <WifiOff className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load provider status</p>
            <p className="text-destructive/80">
              Check your connection and try again.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(isLoading ? PROVIDERS : PROVIDERS).map((provider) => {
            const configured = data?.[provider.id] ?? false;

            return (
              <ProviderCard
                key={provider.id}
                name={provider.name}
                description={provider.description}
                configured={configured}
                icon={provider.icon}
              >
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Skeleton className="h-10 w-full sm:w-32" />
                      <Skeleton className="h-10 w-full sm:w-40" />
                    </div>
                  </div>
                ) : (
                  <ApiKeyForm
                    provider={provider.id}
                    configured={configured}
                    fieldLabel={provider.fieldLabel}
                    placeholder={provider.placeholder}
                    onStatusChange={refetch}
                  />
                )}
              </ProviderCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
