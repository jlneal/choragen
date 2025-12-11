// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Provider = "anthropic" | "openai" | "google" | "ollama";

interface ApiKeyFormProps {
  provider: Provider;
  configured: boolean;
  fieldLabel: string;
  placeholder?: string;
  onStatusChange?: () => void;
}

export function ApiKeyForm({
  provider,
  configured,
  fieldLabel,
  placeholder,
  onStatusChange,
}: ApiKeyFormProps) {
  const [secret, setSecret] = useState("");
  const utils = trpc.useUtils();

  const updateMutation = trpc.settings.updateApiKey.useMutation({
    onMutate: async (input) => {
      const previous = utils.settings.getProviders.getData();
      if (previous) {
        utils.settings.getProviders.setData(undefined, {
          ...previous,
          [input.provider]: true,
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Saved provider configuration");
      setSecret("");
      onStatusChange?.();
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        utils.settings.getProviders.setData(undefined, context.previous);
      }
      toast.error("Failed to save configuration", {
        description: error.message,
      });
    },
    onSettled: () => {
      utils.settings.getProviders.invalidate();
    },
  });

  const testMutation = trpc.settings.testConnection.useMutation({
    onSuccess: () => {
      toast.success("Connection successful");
    },
    onError: (error) => {
      toast.error("Connection failed", {
        description: error.message,
      });
    },
  });

  const handleSave = () => {
    const trimmed = secret.trim();
    if (!trimmed) {
      toast.error(`Enter a ${fieldLabel.toLowerCase()} before saving`);
      return;
    }
    updateMutation.mutate({ provider, apiKey: trimmed });
  };

  const handleTest = () => {
    const trimmed = secret.trim();
    if (!trimmed) {
      toast.error(`Enter a ${fieldLabel.toLowerCase()} to test`);
      return;
    }
    testMutation.mutate({ provider, apiKey: trimmed });
  };

  const isPending = updateMutation.isPending || testMutation.isPending;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        {fieldLabel}
      </label>
      <Input
        type={provider === "ollama" ? "url" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        value={secret}
        onChange={(event) => setSecret(event.target.value)}
        className="font-mono"
        aria-label={`${fieldLabel} input`}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          className="min-h-[44px] sm:w-auto"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          variant="outline"
          className="min-h-[44px] sm:w-auto"
          onClick={handleTest}
          disabled={isPending}
        >
          {testMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>
    </div>
  );
}
