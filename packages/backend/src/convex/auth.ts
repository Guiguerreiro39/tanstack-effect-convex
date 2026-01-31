import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await ctx.db.insert("userProfiles", {
          userId: doc._id,
          name: doc.name,
        });
      },
      onUpdate: async (ctx, doc) => {
        const userProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", doc._id))
          .unique();

        if (userProfile) {
          await ctx.db.patch(userProfile._id, {
            name: doc.name,
          });
        }
      },
      onDelete: async (ctx, doc) => {
        const userProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", doc._id))
          .unique();

        if (userProfile) {
          await ctx.db.delete(userProfile._id);
        }
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
    logger: {
      disabled: optionsOnly,
    },
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
