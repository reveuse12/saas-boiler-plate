/**
 * Accounts Data Access Layer
 * Handles OAuth account linking operations
 * Note: Accounts are linked to users (who are tenant-scoped), but the accounts
 * table itself is not directly tenant-scoped since provider+providerAccountId
 * must be globally unique.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, type Account, type NewAccount } from "@/db/schema";
import { NotFoundError, DatabaseError } from "./errors";

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface LinkAccountInput {
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Find an account by provider and provider account ID
 * Used to check if a Google account is already linked to any user
 */
export async function findAccountByProvider(
  provider: string,
  providerAccountId: string
): Promise<Account | null> {
  try {
    const result = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId)
      ),
    });
    return result ?? null;
  } catch (error) {
    console.error("Failed to find account by provider:", error);
    throw new DatabaseError("Failed to lookup account");
  }
}

/**
 * Find all accounts linked to a user
 */
export async function findAccountsByUserId(userId: string): Promise<Account[]> {
  try {
    return await db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
    });
  } catch (error) {
    console.error("Failed to find accounts by user:", error);
    throw new DatabaseError("Failed to lookup accounts");
  }
}

/**
 * Find a specific account for a user by provider
 */
export async function findUserAccountByProvider(
  userId: string,
  provider: string
): Promise<Account | null> {
  try {
    const result = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.provider, provider)
      ),
    });
    return result ?? null;
  } catch (error) {
    console.error("Failed to find user account by provider:", error);
    throw new DatabaseError("Failed to lookup account");
  }
}

// ============================================================================
// MUTATION OPERATIONS
// ============================================================================

/**
 * Link an OAuth account to a user
 * Creates a new account record connecting the OAuth provider to the user
 */
export async function linkAccount(
  userId: string,
  accountData: LinkAccountInput
): Promise<Account> {
  try {
    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        refresh_token: accountData.refresh_token,
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
      })
      .returning();

    return account;
  } catch (error) {
    console.error("Failed to link account:", error);
    throw new DatabaseError("Failed to link account");
  }
}

/**
 * Unlink an OAuth account from a user
 * Removes the connection between the OAuth provider and the user
 */
export async function unlinkAccount(
  userId: string,
  provider: string
): Promise<void> {
  try {
    const result = await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Account", `${provider} for user ${userId}`);
    }
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error("Failed to unlink account:", error);
    throw new DatabaseError("Failed to unlink account");
  }
}

/**
 * Update OAuth tokens for an existing account
 * Used when tokens are refreshed
 */
export async function updateAccountTokens(
  userId: string,
  provider: string,
  tokens: {
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
  }
): Promise<Account> {
  try {
    const [updated] = await db
      .update(accounts)
      .set(tokens)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, provider)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Account", `${provider} for user ${userId}`);
    }

    return updated;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error("Failed to update account tokens:", error);
    throw new DatabaseError("Failed to update account tokens");
  }
}
