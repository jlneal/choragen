/**
 * @design-doc docs/design/core/features/design-contract.md
 * @test-type unit
 * @user-intent "Verify DesignContract, ApiError, and HttpStatus work correctly"
 */

import { describe, it, expect } from "vitest";
import {
  DesignContract,
  DesignContractBuilder,
  isDesignContract,
  getDesignContractMetadata,
  ApiError,
  HttpStatus,
} from "../index.js";

describe("DesignContract", () => {
  describe("function wrapper creation", () => {
    it("should wrap a sync handler", () => {
      const handler = DesignContract({
        designDoc: "docs/design/core/features/test.md",
        handler: (request: string) => `response: ${request}`,
      });

      expect(typeof handler).toBe("function");
      const result = handler("test");
      expect(result).toBe("response: test");
    });

    it("should wrap an async handler", async () => {
      const handler = DesignContract({
        designDoc: "docs/design/core/features/test.md",
        handler: async (request: string) => `async response: ${request}`,
      });

      expect(typeof handler).toBe("function");
      const result = await handler("test");
      expect(result).toBe("async response: test");
    });

    it("should preserve handler behavior exactly", async () => {
      const originalHandler = async (input: { value: number }) => ({
        doubled: input.value * 2,
      });

      const wrapped = DesignContract({
        designDoc: "docs/design/core/features/test.md",
        handler: originalHandler,
      });

      const result = await wrapped({ value: 21 });
      expect(result).toEqual({ doubled: 42 });
    });
  });

  describe("metadata attachment", () => {
    it("should attach designDoc metadata to wrapped handler", () => {
      const designDocPath = "docs/design/core/features/task-management.md";
      const handler = DesignContract({
        designDoc: designDocPath,
        handler: () => "result",
      });

      const metadata = getDesignContractMetadata(handler);
      expect(metadata).not.toBeNull();
      expect(metadata?.designDoc).toBe(designDocPath);
    });

    it("should preserve different design doc paths", () => {
      const handler1 = DesignContract({
        designDoc: "docs/design/core/features/feature-a.md",
        handler: () => "a",
      });

      const handler2 = DesignContract({
        designDoc: "docs/design/core/features/feature-b.md",
        handler: () => "b",
      });

      expect(getDesignContractMetadata(handler1)?.designDoc).toBe(
        "docs/design/core/features/feature-a.md"
      );
      expect(getDesignContractMetadata(handler2)?.designDoc).toBe(
        "docs/design/core/features/feature-b.md"
      );
    });
  });

  describe("isDesignContract helper", () => {
    it("should return true for wrapped handlers", () => {
      const handler = DesignContract({
        designDoc: "docs/design/core/features/test.md",
        handler: () => "result",
      });

      expect(isDesignContract(handler)).toBe(true);
    });

    it("should return false for regular functions", () => {
      const regularFunction = () => "result";
      expect(isDesignContract(regularFunction)).toBe(false);
    });

    it("should return false for non-functions", () => {
      expect(isDesignContract(null)).toBe(false);
      expect(isDesignContract(undefined)).toBe(false);
      expect(isDesignContract("string")).toBe(false);
      expect(isDesignContract(123)).toBe(false);
      expect(isDesignContract({})).toBe(false);
      expect(isDesignContract([])).toBe(false);
    });
  });

  describe("getDesignContractMetadata helper", () => {
    it("should return metadata for wrapped handlers", () => {
      const handler = DesignContract({
        designDoc: "docs/design/core/features/test.md",
        handler: () => "result",
      });

      const metadata = getDesignContractMetadata(handler);
      expect(metadata).toEqual({
        designDoc: "docs/design/core/features/test.md",
      });
    });

    it("should return null for regular functions", () => {
      const regularFunction = () => "result";
      expect(getDesignContractMetadata(regularFunction)).toBeNull();
    });

    it("should return null for non-functions", () => {
      expect(getDesignContractMetadata(null)).toBeNull();
      expect(getDesignContractMetadata(undefined)).toBeNull();
      expect(getDesignContractMetadata("string")).toBeNull();
      expect(getDesignContractMetadata({})).toBeNull();
    });
  });
});

describe("DesignContractBuilder", () => {
  interface TaskInput {
    title: string;
    priority?: number;
  }

  interface TaskOutput {
    id: string;
    title: string;
    createdAt: string;
  }

  describe("constructor and metadata", () => {
    it("should create builder with designDoc", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      });

      const metadata = builder.getMetadata();
      expect(metadata.designDoc).toBe(
        "docs/design/core/features/task-management.md"
      );
    });

    it("should create builder with userIntent", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
        userIntent: "Create a new task",
      });

      const metadata = builder.getMetadata();
      expect(metadata.userIntent).toBe("Create a new task");
    });

    it("should track precondition and postcondition counts", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      })
        .pre(() => null)
        .pre(() => null)
        .post(() => null);

      const metadata = builder.getMetadata();
      expect(metadata.preconditionCount).toBe(2);
      expect(metadata.postconditionCount).toBe(1);
    });
  });

  describe("precondition validation", () => {
    it("should pass validation when all preconditions are met", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      }).pre((input) => (input.title ? null : "Title is required"));

      const result = builder.validateInput({ title: "My Task" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ title: "My Task" });
      expect(result.violations).toBeUndefined();
    });

    it("should fail validation when precondition is violated", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      }).pre((input) => (input.title ? null : "Title is required"));

      const result = builder.validateInput({ title: "" });
      expect(result.success).toBe(false);
      expect(result.violations).toContain("Title is required");
      expect(result.data).toBeUndefined();
    });

    it("should collect multiple violations", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      })
        .pre((input) => (input.title ? null : "Title is required"))
        .pre((input) =>
          input.title.length >= 3 ? null : "Title must be at least 3 characters"
        );

      const result = builder.validateInput({ title: "" });
      expect(result.success).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations).toContain("Title is required");
      expect(result.violations).toContain(
        "Title must be at least 3 characters"
      );
    });

    it("should pass with no preconditions defined", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      });

      const result = builder.validateInput({ title: "Any" });
      expect(result.success).toBe(true);
    });
  });

  describe("postcondition validation", () => {
    it("should pass validation when all postconditions are met", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      }).post((output) => (output.id ? null : "Must return ID"));

      const result = builder.validateOutput({
        id: "task-123",
        title: "Test",
        createdAt: "2025-01-01",
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: "task-123",
        title: "Test",
        createdAt: "2025-01-01",
      });
    });

    it("should fail validation when postcondition is violated", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      }).post((output) => (output.id ? null : "Must return ID"));

      const result = builder.validateOutput({
        id: "",
        title: "Test",
        createdAt: "2025-01-01",
      });
      expect(result.success).toBe(false);
      expect(result.violations).toContain("Must return ID");
    });

    it("should collect multiple postcondition violations", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
      })
        .post((output) => (output.id ? null : "Must return ID"))
        .post((output) => (output.createdAt ? null : "Must have createdAt"));

      const result = builder.validateOutput({
        id: "",
        title: "Test",
        createdAt: "",
      });
      expect(result.success).toBe(false);
      expect(result.violations).toHaveLength(2);
    });
  });

  describe("method chaining", () => {
    it("should support fluent API with chained pre/post calls", () => {
      const builder = new DesignContractBuilder<TaskInput, TaskOutput>({
        designDoc: "docs/design/core/features/task-management.md",
        userIntent: "Create task",
      })
        .pre((input) => (input.title ? null : "Title required"))
        .pre((input) =>
          input.title.length <= 100 ? null : "Title too long"
        )
        .post((output) => (output.id ? null : "ID required"))
        .post((output) => (output.createdAt ? null : "CreatedAt required"));

      const metadata = builder.getMetadata();
      expect(metadata.preconditionCount).toBe(2);
      expect(metadata.postconditionCount).toBe(2);
    });
  });
});

describe("ApiError", () => {
  describe("constructor", () => {
    it("should create error with message and status code", () => {
      const error = new ApiError("Not found", HttpStatus.NOT_FOUND);

      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.name).toBe("ApiError");
    });

    it("should default to INTERNAL_SERVER_ERROR", () => {
      const error = new ApiError("Something went wrong");

      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it("should accept optional code", () => {
      const error = new ApiError("Validation failed", HttpStatus.BAD_REQUEST, {
        code: "VALIDATION_ERROR",
      });

      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept optional details", () => {
      const error = new ApiError("Validation failed", HttpStatus.BAD_REQUEST, {
        details: { field: "email", reason: "invalid format" },
      });

      expect(error.details).toEqual({ field: "email", reason: "invalid format" });
    });

    it("should accept optional cause", () => {
      const cause = new Error("Original error");
      const error = new ApiError(
        "Wrapped error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause }
      );

      expect(error.cause).toBe(cause);
    });
  });

  describe("toJSON", () => {
    it("should serialize to JSON format", () => {
      const error = new ApiError("Not found", HttpStatus.NOT_FOUND, {
        code: "RESOURCE_NOT_FOUND",
        details: { resourceId: "123" },
      });

      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          message: "Not found",
          code: "RESOURCE_NOT_FOUND",
          statusCode: HttpStatus.NOT_FOUND,
          details: { resourceId: "123" },
        },
      });
    });

    it("should handle missing optional fields", () => {
      const error = new ApiError("Simple error", HttpStatus.BAD_REQUEST);

      const json = error.toJSON();
      expect(json.error.code).toBeUndefined();
      expect(json.error.details).toBeUndefined();
    });
  });

  describe("static factory methods", () => {
    it("should create badRequest error", () => {
      const error = ApiError.badRequest("Invalid input", { field: "name" });

      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual({ field: "name" });
    });

    it("should create unauthorized error", () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe("Unauthorized");
    });

    it("should create unauthorized error with custom message", () => {
      const error = ApiError.unauthorized("Token expired");

      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe("Token expired");
    });

    it("should create forbidden error", () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe("Forbidden");
    });

    it("should create notFound error", () => {
      const error = ApiError.notFound();

      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.message).toBe("Not found");
    });

    it("should create notFound error with custom message", () => {
      const error = ApiError.notFound("Task not found");

      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.message).toBe("Task not found");
    });

    it("should create conflict error", () => {
      const error = ApiError.conflict("Resource already exists", {
        existingId: "123",
      });

      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
      expect(error.message).toBe("Resource already exists");
      expect(error.details).toEqual({ existingId: "123" });
    });

    it("should create internal error", () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe("Internal server error");
    });

    it("should create internal error with cause", () => {
      const cause = new Error("Database connection failed");
      const error = ApiError.internal("Database error", cause);

      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe("Database error");
      expect(error.cause).toBe(cause);
    });
  });

  describe("inheritance", () => {
    it("should be instanceof Error", () => {
      const error = new ApiError("Test", HttpStatus.BAD_REQUEST);
      expect(error instanceof Error).toBe(true);
    });

    it("should be instanceof ApiError", () => {
      const error = new ApiError("Test", HttpStatus.BAD_REQUEST);
      expect(error instanceof ApiError).toBe(true);
    });
  });
});

describe("HttpStatus", () => {
  // Expected values for HttpStatus enum verification
  const EXPECTED_OK = 200;
  const EXPECTED_CREATED = 201;
  const EXPECTED_ACCEPTED = 202;
  const EXPECTED_NO_CONTENT = 204;
  const EXPECTED_MOVED_PERMANENTLY = 301;
  const EXPECTED_FOUND = 302;
  const EXPECTED_NOT_MODIFIED = 304;
  const EXPECTED_TEMPORARY_REDIRECT = 307;
  const EXPECTED_PERMANENT_REDIRECT = 308;
  const EXPECTED_BAD_REQUEST = 400;
  const EXPECTED_UNAUTHORIZED = 401;
  const EXPECTED_FORBIDDEN = 403;
  const EXPECTED_NOT_FOUND = 404;
  const EXPECTED_METHOD_NOT_ALLOWED = 405;
  const EXPECTED_CONFLICT = 409;
  const EXPECTED_GONE = 410;
  const EXPECTED_UNPROCESSABLE_ENTITY = 422;
  const EXPECTED_TOO_MANY_REQUESTS = 429;
  const EXPECTED_INTERNAL_SERVER_ERROR = 500;
  const EXPECTED_NOT_IMPLEMENTED = 501;
  const EXPECTED_BAD_GATEWAY = 502;
  const EXPECTED_SERVICE_UNAVAILABLE = 503;
  const EXPECTED_GATEWAY_TIMEOUT = 504;

  describe("2xx Success codes", () => {
    it("should have correct values for success codes", () => {
      expect(HttpStatus.OK).toBe(EXPECTED_OK);
      expect(HttpStatus.CREATED).toBe(EXPECTED_CREATED);
      expect(HttpStatus.ACCEPTED).toBe(EXPECTED_ACCEPTED);
      expect(HttpStatus.NO_CONTENT).toBe(EXPECTED_NO_CONTENT);
    });
  });

  describe("3xx Redirection codes", () => {
    it("should have correct values for redirection codes", () => {
      expect(HttpStatus.MOVED_PERMANENTLY).toBe(EXPECTED_MOVED_PERMANENTLY);
      expect(HttpStatus.FOUND).toBe(EXPECTED_FOUND);
      expect(HttpStatus.NOT_MODIFIED).toBe(EXPECTED_NOT_MODIFIED);
      expect(HttpStatus.TEMPORARY_REDIRECT).toBe(EXPECTED_TEMPORARY_REDIRECT);
      expect(HttpStatus.PERMANENT_REDIRECT).toBe(EXPECTED_PERMANENT_REDIRECT);
    });
  });

  describe("4xx Client Error codes", () => {
    it("should have correct values for client error codes", () => {
      expect(HttpStatus.BAD_REQUEST).toBe(EXPECTED_BAD_REQUEST);
      expect(HttpStatus.UNAUTHORIZED).toBe(EXPECTED_UNAUTHORIZED);
      expect(HttpStatus.FORBIDDEN).toBe(EXPECTED_FORBIDDEN);
      expect(HttpStatus.NOT_FOUND).toBe(EXPECTED_NOT_FOUND);
      expect(HttpStatus.METHOD_NOT_ALLOWED).toBe(EXPECTED_METHOD_NOT_ALLOWED);
      expect(HttpStatus.CONFLICT).toBe(EXPECTED_CONFLICT);
      expect(HttpStatus.GONE).toBe(EXPECTED_GONE);
      expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(EXPECTED_UNPROCESSABLE_ENTITY);
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(EXPECTED_TOO_MANY_REQUESTS);
    });
  });

  describe("5xx Server Error codes", () => {
    it("should have correct values for server error codes", () => {
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(EXPECTED_INTERNAL_SERVER_ERROR);
      expect(HttpStatus.NOT_IMPLEMENTED).toBe(EXPECTED_NOT_IMPLEMENTED);
      expect(HttpStatus.BAD_GATEWAY).toBe(EXPECTED_BAD_GATEWAY);
      expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(EXPECTED_SERVICE_UNAVAILABLE);
      expect(HttpStatus.GATEWAY_TIMEOUT).toBe(EXPECTED_GATEWAY_TIMEOUT);
    });
  });

  describe("usage with ApiError", () => {
    it("should work with ApiError constructor", () => {
      const error = new ApiError("Test", HttpStatus.NOT_FOUND);
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
