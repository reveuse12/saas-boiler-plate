/**
 * OAuth State Management
 * Handles encoding/decoding of OAuth state parameter for tenant context preservation
 * and CSRF protection during OAuth flows.
 */
import { z } from "zod";

/**
 * OAuth state parameter structure
 */
export interface OAuthState {
  tenantSlug: string;
  callbackUrl?: string;
  /** Timestamp for state expiration validation */
  timestamp: number;
}

/**
 * Zod schema for validating decoded state
 */
const oauthStateSchema = z.object({
  tenantSlug: z.string().min(1, "Tenant slug is required"),
  callbackUrl: z.string().url().optional(),
  timestamp: z.number().int().positive(),
});

/**
 * State expiration time in milliseconds (10 minutes)
 */
const STATE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Converts a base64 string to URL-safe base64 (base64url)
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts a URL-safe base64 string back to standard base64
 */
function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
}

/**
 * Encodes tenant context and optional callback URL into a base64 state parameter
 * for use in OAuth flows.
 *
 * @param tenantSlug - The tenant slug to preserve through OAuth flow
 * @param callbackUrl - Optional URL to redirect to after OAuth completion
 * @returns Base64-encoded state string
 */
export function encodeState(tenantSlug: string, callbackUrl?: string): string {
  const state: OAuthState = {
    tenantSlug,
    callbackUrl,
    timestamp: Date.now(),
  };

  const jsonString = JSON.stringify(state);
  // Use btoa for browser compatibility, then convert to URL-safe base64
  const base64 = btoa(jsonString);
  return toBase64Url(base64);
}

/**
 * Result type for decodeState function
 */
export type DecodeStateResult =
  | { success: true; data: OAuthState }
  | { success: false; error: string };

/**
 * Decodes and validates an OAuth state parameter.
 * Validates structure, required fields, and expiration.
 *
 * @param state - Base64-encoded state string from OAuth callback
 * @returns Decoded state object or error
 */
export function decodeState(state: string | null | undefined): DecodeStateResult {
  // Check for missing state
  if (!state) {
    return { success: false, error: "State parameter is missing" };
  }

  // Check for empty state
  if (state.trim() === "") {
    return { success: false, error: "State parameter is empty" };
  }

  let jsonString: string;
  try {
    // Convert from URL-safe base64 to standard base64, then decode
    const base64 = fromBase64Url(state);
    jsonString = atob(base64);
  } catch {
    return { success: false, error: "State parameter is not valid base64" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: "State parameter is not valid JSON" };
  }

  // Validate structure with Zod
  const result = oauthStateSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(", ");
    return {
      success: false,
      error: `Invalid state structure: ${issues}`,
    };
  }

  const data = result.data;

  // Check expiration
  const now = Date.now();
  if (now - data.timestamp > STATE_EXPIRATION_MS) {
    return { success: false, error: "State parameter has expired" };
  }

  return { success: true, data };
}

/**
 * Validates that a state parameter is present and well-formed.
 * This is a convenience function for CSRF validation in OAuth callbacks.
 *
 * @param state - State parameter from OAuth callback
 * @returns true if state is valid, false otherwise
 */
export function isValidState(state: string | null | undefined): boolean {
  const result = decodeState(state);
  return result.success;
}
