// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProjectBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (path: string) => void;
  isLoading?: boolean;
  initialPath?: string;
}

export function ProjectBrowser({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialPath = "",
}: ProjectBrowserProps) {
  const [projectPath, setProjectPath] = useState(initialPath);

  useEffect(() => {
    if (open) {
      setProjectPath(initialPath);
    }
  }, [initialPath, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(projectPath);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Choose Project Directory
          </DialogTitle>
          <DialogDescription>
            Enter the path to a Choragen project. The directory must contain a <code>.choragen</code> folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="project-path"
              className="text-sm font-medium text-foreground"
            >
              Project path
            </label>
            <Input
              id="project-path"
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
              placeholder="/Users/you/Projects/choragen"
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Recent selections are saved locally for quick access.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || projectPath.trim().length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4" />
                  Use Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
