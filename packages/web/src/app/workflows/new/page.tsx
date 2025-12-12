// ADR: ADR-011-web-api-architecture
"use client";

import { useRouter } from "next/navigation";

import { TemplateForm, type TemplateFormValues } from "@/components/workflows/template-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

const DEFAULT_STAGE: TemplateFormValues["stages"][number] = {
  name: "implementation",
  type: "implementation",
  gate: { type: "chain_complete" },
};

const DEFAULT_TEMPLATE: TemplateFormValues = {
  name: "",
  displayName: "",
  description: "",
  builtin: false,
  version: 1,
  stages: [DEFAULT_STAGE],
};

export default function NewTemplatePage() {
  const router = useRouter();

  const createMutation = trpc.workflowTemplates.create.useMutation({
    onSuccess: (created) => {
      router.push(`/workflows/${created.name}`);
    },
  });

  const handleSubmit = async (values: TemplateFormValues) => {
    await createMutation.mutateAsync({
      name: values.name,
      displayName: values.displayName,
      description: values.description,
      stages: values.stages,
      changedBy: values.changedBy,
      changeDescription: values.changeDescription,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create workflow template</CardTitle>
          <CardDescription>
            Define a reusable workflow template. You can add more stage editing controls in a later step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            mode="create"
            initialTemplate={DEFAULT_TEMPLATE}
            readOnly={false}
            stageEditable
            onSubmit={handleSubmit}
            onCancel={() => router.push("/workflows")}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
