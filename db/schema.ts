import { pgTable, serial, integer, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Using text to align with Privy user IDs
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  kybStatus: text('kyb_status').default('not_started').notNull(), // not_started, pending, approved, rejected, requires_information, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  organizationId: serial('organization_id').references(() => organizations.id),
  role: text('role').notNull().default('MEMBER'), // e.g. ADMIN, MEMBER, OPERATOR
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  organizationId: serial('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // e.g. 'Real Estate', 'Art'
  declaredValuation: decimal('declared_valuation', { precision: 12, scale: 2 }),
  currency: text('currency').default('USD'),
  status: text('status').default('draft').notNull(), // draft, under_review, approved, rejected, requires_information, archived
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const offerings = pgTable('offerings', {
  id: serial('id').primaryKey(),
  assetId: serial('asset_id').references(() => assets.id),
  organizationId: serial('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  tokenStandard: text('token_standard').default('Token-2022'),
  tokenName: text('token_name'),
  tokenSymbol: text('token_symbol'),
  tokenSupply: decimal('token_supply', { precision: 20, scale: 0 }),
  tokenPrice: decimal('token_price', { precision: 12, scale: 2 }),
  targetRaise: decimal('target_raise', { precision: 12, scale: 2 }),
  status: text('status').default('draft').notNull(), // draft, under_review, approved, scheduled, open, paused, closed, rejected, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  offeringId: serial('offering_id').references(() => offerings.id),
  mintAddress: text('mint_address').notNull(),
  decimals: serial('decimals'),
  initialSupply: decimal('initial_supply', { precision: 20, scale: 0 }),
  freezeAuthority: text('freeze_authority'),
  mintAuthority: text('mint_authority'),
  transactionSignature: text('transaction_signature'),
  status: text('status').default('pending').notNull(), // pending, confirmed, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  assets: many(assets),
  offerings: many(offerings),
  investors: many(investors),
  apiKeys: many(apiKeys),
}));

export const investors = pgTable('investors', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  walletAddress: text('wallet_address'),
  investorType: text('investor_type').default('accredited').notNull(), // individual, accredited, institutional, qualified_purchaser
  jurisdiction: text('jurisdiction').default('US').notNull(),
  kycStatus: text('kyc_status').default('pending').notNull(), // pending, approved, rejected, suspended
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const investorsRelations = relations(investors, ({ one }) => ({
  organization: one(organizations, {
    fields: [investors.organizationId],
    references: [organizations.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [assets.organizationId],
    references: [organizations.id],
  }),
  offerings: many(offerings),
}));

export const offeringsRelations = relations(offerings, ({ one, many }) => ({
  asset: one(assets, {
    fields: [offerings.assetId],
    references: [assets.id],
  }),
  organization: one(organizations, {
    fields: [offerings.organizationId],
    references: [organizations.id],
  }),
  tokens: many(tokens),
  subscriptions: many(subscriptions),
  distributions: many(distributions),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
  offering: one(offerings, {
    fields: [tokens.offeringId],
    references: [offerings.id],
  }),
}));

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  offeringId: serial('offering_id').references(() => offerings.id),
  userId: text('user_id').references(() => users.id).notNull(),
  investorWallet: text('investor_wallet'),
  amountUsd: decimal('amount_usd', { precision: 12, scale: 2 }).notNull(),
  tokenQuantity: decimal('token_quantity', { precision: 20, scale: 0 }).notNull(),
  status: text('status').default('pending').notNull(), // pending, confirmed, settled, rejected, cancelled
  transactionSignature: text('transaction_signature'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  offering: one(offerings, {
    fields: [subscriptions.offeringId],
    references: [offerings.id],
  }),
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const distributions = pgTable('distributions', {
  id: serial('id').primaryKey(),
  offeringId: serial('offering_id').references(() => offerings.id),
  title: text('title').notNull(),
  totalAmountUsd: decimal('total_amount_usd', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('executed').notNull(), // draft, executed
  transactionSignature: text('transaction_signature'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const distributionsRelations = relations(distributions, ({ one }) => ({
  offering: one(offerings, {
    fields: [distributions.offeringId],
    references: [offerings.id],
  }),
}));

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  status: text('status').default('active').notNull(), // active, revoked
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));




