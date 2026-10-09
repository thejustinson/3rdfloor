# 3rdfloor: Product Requirements Document

*Infrastructure for programmable ownership.*

3rdfloor is a Solana-native infrastructure platform that enables companies to create, launch, and manage tokenized real-world asset investment offerings throughout their lifecycle.

---

## 1. Executive summary

3rdfloor provides the infrastructure between owning a real-world asset and operating an onchain investment product around it.

Today, a company seeking to tokenize an asset may need to assemble its own asset registry, investment flows, token contracts, investor records, payment settlement, compliance providers, ownership reporting, distribution mechanisms, and redemption processes.

3rdfloor brings these capabilities together behind one platform and, eventually, one API.

An issuer should be able to register an asset, configure an offering, onboard investors, allocate tokens, manage ownership, distribute proceeds, and close the offering without building an entire blockchain financial stack from scratch.

The initial product will focus on one complete asset lifecycle on Solana, rather than attempting to support every asset class and financial workflow from day one.

---

## 2. Vision and positioning

**Vision:** Make issuing and managing tokenized real-world assets as accessible as building a modern software application.

**Mission:** Abstract the technical complexity of onchain asset issuance and lifecycle management while preserving transparent ownership records, configurable controls, and integrations with the services issuers need.

**Positioning statement:** 3rdfloor is the operating infrastructure for companies building tokenized real-world investment products on Solana.

### Product principles

1. **Lifecycle over token creation.** Issuing a token is the beginning, not the whole product.
2. **Infrastructure over speculation.** Focus on issuers and real economic activity.
3. **Compliance-aware by design.** Support configurable controls without claiming that software alone establishes legal compliance.
4. **Provider-agnostic.** Identity verification and other external services should be replaceable.
5. **Auditable by default.** Important actions must be traceable.
6. **Solana-first, not Solana-locked.** Build deeply for Solana initially without unnecessarily coupling the whole application to one chain.

---

## 3. The problem

An issuer wanting to tokenize an asset faces several interconnected problems:

| Problem | What 3rdfloor provides |
|---|---|
| Asset and offering data are fragmented | Centralized asset and offering management |
| Token issuance requires blockchain expertise | Guided token creation and configuration |
| Investor eligibility is difficult to coordinate | Investor records and configurable eligibility rules |
| Investments and token allocations must stay synchronized | Investment and allocation workflows |
| Ownership data is difficult to interpret | Investor portfolio and issuer cap table |
| Distributions require manual calculations and reconciliation | Distribution scheduling, calculation, and execution |
| Transfers and redemptions create operational complexity | Configurable lifecycle and transfer workflows |
| Multiple providers require separate integrations | A unified integration layer and API |

The goal is not to eliminate legal, financial, or operational responsibilities. It is to make those responsibilities easier to coordinate through a single infrastructure platform.

---

## 4. Target customers

### Primary customer: RWA issuers and platforms

Companies building investment products around real-world assets, including:

- Art investment platforms
- Real estate investment platforms
- Private credit originators
- Asset managers
- Tokenization startups
- Financial technology companies building investment products

### Secondary customer: Developers

Teams that want to integrate tokenized asset functionality into their own applications through an API or SDK rather than use a hosted dashboard.

### Initial design partner

Yartuu could serve as an early design partner or pilot customer for tokenized art, provided the product and commercial arrangement are independently agreed.

Yartuu is a potential customer, not the definition of 3rdfloor. The underlying platform should be reusable across asset classes.

---

## 5. Product scope

The product will evolve through three stages.

### Phase 1: Core issuance and lifecycle MVP

**Build first.** Issuer dashboard, assets, offerings, Solana token creation, manually approved investors, allocations, ownership records, distributions, and basic closure workflows.

### Phase 2: Compliance and operational automation

External KYC/KYB and screening providers, offering-specific eligibility, wallet screening, transfer controls, automated reconciliation, and richer reporting.

### Phase 3: Infrastructure platform

Public developer API, webhooks, issuer-configurable integrations, secondary transfers, advanced reporting, and additional supported asset structures.

---

## 6. Users and permissions

The MVP supports four roles.

| Role | Core permissions |
|---|---|
| Platform administrator | Manage issuers, platform configuration, and operational exceptions |
| Issuer administrator | Create assets and offerings, manage investors, initiate distributions |
| Issuer operator | Perform explicitly granted operational tasks |
| Investor | View eligible offerings, investments, holdings, and distributions |

Permissions must be enforced on the server, not merely hidden in the interface.

Every issuer must have an isolated organizational workspace. One issuer must never be able to access another issuer's private records without explicit authorization.

---

## 7. Core product modules

### 7.1 Organization and issuer management

Each issuer has an organization profile containing its name, contact information, authorized users, configuration, and associated assets.

Requirements:

- Create and edit organizations.
- Invite team members.
- Assign roles and permissions.
- Associate assets and offerings with the correct organization.
- Maintain an audit trail of administrative changes.

For the MVP, issuer identity and authorization can be manually reviewed. Automated KYB is deferred.

### 7.2 Asset management

An asset represents the underlying real-world item or financial arrangement.

Each asset should support:

- Name, description, and asset category.
- Issuer and legal-owner references.
- Declared valuation and valuation date.
- Currency.
- Supporting documents and media.
- Custody or ownership information.
- Relevant legal structure references.
- Verification status.
- Linked offerings and lifecycle events.

Asset categories should be extensible. Do not hard-code artwork-specific fields into the universal asset model.

> **Important:** 3rdfloor records issuer-provided information and verification status. Creating an asset record does not prove that the asset exists, that the valuation is accurate, or that the issuer has legal title.

### 7.3 Offering management

An offering defines the investment opportunity associated with an asset.

Configurable fields:

- Asset reference.
- Offering name and description.
- Token mint and token configuration.
- Target raise and maximum raise.
- Token supply and pricing.
- Accepted payment currency.
- Minimum and maximum investment.
- Start and end dates.
- Investor eligibility policy.
- Transfer restrictions.
- Distribution policy.
- Redemption or closure conditions.
- Offering documents and disclosures.

Required lifecycle statuses:

`Draft → Review → Approved → Scheduled → Open → Paused / Closed`

Additional statuses must cover cancellation, failed issuance, and completed closure.

An offering must not become investable merely because a token exists. Issuer authorization, required disclosures, applicable approvals, and operational readiness must be checked separately.

### 7.4 Solana tokenization

The first implementation targets Solana, with Token-2022 as the primary candidate token standard.

Required capabilities:

- Create or configure a token mint.
- Define supply, decimals, and metadata.
- Associate a mint with an offering.
- Track mint, freeze, and relevant authority configuration.
- Support approved-wallet restrictions where the chosen token extensions and architecture permit.
- Record transaction signatures and confirmation status.
- Display onchain ownership and mint information.
- Reconcile onchain state against the platform's internal records.

Some transfer restrictions require specific Token-2022 extensions, authorities, and deployment configuration. These must be validated before finalizing the token architecture.

**Design requirement:** Token creation must be idempotent and recoverable. A failed API call or interrupted browser session must not silently create duplicate assets, offerings, or token mints.

### 7.5 Investor management

Investors have a platform profile linked to one or more wallets.

Required capabilities:

- Create investor profiles.
- Link and verify wallet control.
- Record investor category and relevant jurisdiction.
- Track manual review and approval status.
- Display investments, holdings, and distribution history.
- Maintain offering-specific eligibility decisions.
- Support account and wallet status changes.

KYC automation is not required for the first MVP, but the data model must distinguish manual approval from verification performed by an external provider.

### 7.6 Eligibility engine

Eligibility is evaluated against the particular offering, not simply against a global investor status.

A decision may depend on:

- Identity verification.
- Business verification, when relevant.
- Sanctions or watchlist screening.
- Wallet risk screening.
- Jurisdiction.
- Investor classification.
- Offering-specific restrictions.
- Expiry or re-verification requirements.

The MVP uses an explicit manual-review workflow.

Future integrations may supply evidence to the eligibility engine, but provider results must not automatically override offering-specific rules.

### 7.7 Investment and allocation

The investment workflow records an investor's subscription and coordinates payment with token allocation.

Expected workflow:

1. Investor selects an open offering.
2. Platform validates eligibility and investment limits.
3. Subscription is created.
4. Payment instructions or settlement transaction are initiated.
5. Payment is confirmed.
6. Tokens are allocated.
7. Internal ownership records are reconciled.
8. The investor and issuer receive an updated status.

Every subscription needs a unique identifier and an explicit state machine.

For the first MVP, use a narrowly defined settlement method, such as USDC on Solana, and test it end to end. Manual funding confirmation may be used in a sandbox or controlled pilot, but must not be represented as automated onchain settlement.

### 7.8 Ownership and cap table

The platform provides a human-readable representation of investor holdings.

Requirements:

- Show token balances by investor and wallet.
- Calculate ownership percentages against the correct supply or defined economic-interest denominator.
- Record allocations and transfers.
- Reconcile balances with onchain data.
- Show historical ownership snapshots where required.
- Export ownership records for reporting.

A token balance must not automatically be described as legal equity or direct ownership of the underlying asset. Its meaning depends on the offering's legal structure and contractual rights.

### 7.9 Distributions

Issuers can create and manage distributions associated with an offering.

Requirements:

- Create a distribution event.
- Specify the distribution amount and currency.
- Define the record date and eligibility rules.
- Calculate investor entitlements from a defined ownership snapshot.
- Apply configured rounding and minimum-payout rules.
- Generate a preview for issuer approval.
- Execute or record payments.
- Track pending, successful, failed, and retried payments.
- Maintain a complete distribution ledger.

For example, if an eligible holder has 10% of the defined economic interest in an offering with $20,000 available for distribution, their gross entitlement would be $2,000 before any applicable fees, taxes, or contractual adjustments.

The platform must distinguish calculating an entitlement from actually paying it.

### 7.10 Redemption and closure

The issuer can initiate an offering's closure or redemption process according to its configured terms.

Requirements:

- Initiate closure.
- Prevent new subscriptions where appropriate.
- Record the triggering event and supporting evidence.
- Calculate final investor entitlements.
- Track payments and outstanding claims.
- Record token redemption or burning when applicable.
- Reconcile final ownership and payment records.
- Mark the offering as closed only after required closure conditions are satisfied.

Closure should be a controlled workflow, not a single destructive database update.

---

## 8. System architecture

The platform should separate business logic from blockchain execution and external providers.

```
┌─────────────────────────────────────────────────────┐
│ Presentation layer                                  │
│ Issuer dashboard · Investor portal · Admin console  │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│ Application API                                     │
│ Authentication · Authorization · Validation ·       │
│ Rate limits                                         │
└─────────────────────────────────────────────────────┘
                         │
┌──────────────────┬──────────────────┬───────────────┐
│ Asset & offering │ Investor &       │ Investment &  │
│ engine           │ eligibility      │ allocation    │
│                  │ engine           │               │
├──────────────────┴──────────────────┴───────────────┤
│ Distribution & redemption                           │
└─────────────────────────────────────────────────────┘
                         │
┌──────────────────┬──────────────────┬───────────────┐
│ Data layer       │ Provider         │ Solana        │
│ PostgreSQL ·     │ adapters         │ adapter       │
│ Audit log ·      │ Compliance ·     │ Token-2022 ·  │
│ Documents        │ Storage ·        │ USDC          │
│                  │ Notifications    │ settlement ·  │
│                  │                  │ Wallets ·     │
│                  │                  │ Transaction   │
│                  │                  │ reconciliation│
└──────────────────┴──────────────────┴───────────────┘
```

### Suggested initial stack

The following is a reasonable starting point rather than a permanent architectural commitment.

| Layer | Initial choice |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | TypeScript API within the same codebase initially |
| Database | PostgreSQL |
| Authentication | Established authentication provider |
| Solana integration | Solana TypeScript SDKs and Token-2022 libraries |
| File storage | Private object storage |
| Background jobs | Durable job queue for payments, webhooks, and reconciliation |
| Hosting | Managed application and database infrastructure |
| Monitoring | Structured logs, error tracking, transaction monitoring |

Use TypeScript throughout. Avoid microservices until deployment complexity or workload genuinely requires them.

For the first version, a modular monolith is likely the most practical architecture.

---

## 9. Core data model

The initial database should support these entities:

| Entity | Purpose |
|---|---|
| Organization | Issuer and its workspace |
| User | Account and authentication identity |
| Membership | User's role within an organization |
| Asset | Underlying real-world asset |
| AssetDocument | Supporting documents and evidence |
| Offering | Investment opportunity and its terms |
| Token | Onchain mint and configuration |
| Investor | Investor profile |
| Wallet | Investor-controlled blockchain address |
| EligibilityAssessment | Decision and supporting evidence for an offering |
| Subscription | Investor's investment request |
| Payment | Payment instruction and settlement status |
| Allocation | Tokens allocated to an investor |
| HoldingSnapshot | Ownership at a specific point in time |
| Distribution | Issuer-created distribution event |
| DistributionPayment | Individual investor payout |
| Redemption | Redemption request or closure entitlement |
| BlockchainTransaction | Transaction signature and processing status |
| AuditEvent | Record of significant platform actions |

Use immutable identifiers, explicit statuses, timestamps, and relationships between records.

Do not treat the database as the source of truth for actual onchain token balances. The platform must reconcile its records with Solana.

---

## 10. API requirements

The architecture should be API-first, even if the initial customer experience is a dashboard.

Representative future endpoints:

```
POST   /v1/assets
GET    /v1/assets/:assetId
POST   /v1/assets/:assetId/offerings

GET    /v1/offerings
GET    /v1/offerings/:offeringId
POST   /v1/offerings/:offeringId/approve
POST   /v1/offerings/:offeringId/close

POST   /v1/investors
POST   /v1/offerings/:offeringId/eligibility-assessments

POST   /v1/offerings/:offeringId/subscriptions
GET    /v1/subscriptions/:subscriptionId

GET    /v1/offerings/:offeringId/holdings
POST   /v1/offerings/:offeringId/distributions
POST   /v1/distributions/:distributionId/execute

POST   /v1/offerings/:offeringId/redemptions
GET    /v1/transactions/:transactionId
```

All state-changing endpoints must validate permissions, support idempotency where appropriate, and return clear processing states.

Webhooks should eventually notify issuer applications of important events such as payment confirmation, token allocation, failed transactions, completed distributions, and offering closure.

---

## 11. Security and reliability

Security requirements are part of the MVP, not a later enhancement.

- Enforce organization-level data isolation.
- Verify wallet signatures when proving wallet control.
- Never collect or store investor seed phrases or private keys.
- Keep secrets and signing credentials out of frontend code.
- Use least-privilege authority and signing arrangements.
- Protect private legal and identity documents.
- Record sensitive administrative actions in an audit log.
- Validate all payment and allocation state transitions.
- Use idempotency keys to prevent duplicate processing.
- Verify blockchain transaction outcomes before marking actions complete.
- Reconcile internal records with onchain state.
- Support failed-transaction recovery and safe retries.
- Rate-limit sensitive endpoints and protect against unauthorized access.
- Maintain backups and test restoration procedures.

For production investment flows, define who controls minting, freezing, treasury funds, and distribution authority. Consider multisignature or other appropriate controls before handling meaningful customer funds.

---

## 12. Compliance boundary

3rdfloor should be designed to accommodate compliance requirements without pretending that the platform itself resolves every legal obligation.

The platform can coordinate:

- KYC and KYB verification.
- Watchlist and sanctions screening.
- Wallet-risk screening.
- Investor eligibility rules.
- Offering-specific transfer restrictions.
- Evidence collection and retention.
- Audit logs and compliance reporting.

These functions are distinct. Identity verification does not establish that a wallet is safe, and neither automatically determines whether an investor may legally participate in a specific securities offering.

### Initial implementation

Use a manual review workflow with clearly labelled states.

Later, introduce replaceable provider adapters for services such as MetaMap or other suitable providers. The issuer's account should ultimately be able to support transparent usage-based billing or its own provider credentials where commercially and technically supported.

Do not launch a live public investment offering merely because the technical workflow works. The legal rights represented by the tokens, applicable securities and financial-services rules, custody arrangements, investor restrictions, and funds-handling obligations must be assessed for the relevant jurisdiction and offering structure.

---

## 13. UX requirements

The issuer dashboard should prioritize operational clarity over visual complexity.

### Issuer dashboard

The home screen should show:

- Total assets.
- Draft, open, and closed offerings.
- Capital raised, with the calculation clearly defined.
- Number of investors.
- Pending subscriptions.
- Pending distributions.
- Failed or unresolved transactions.
- Recent audit events.

### Asset detail page

Should contain:

- Asset summary and status.
- Valuation and supporting documents.
- Legal-owner references.
- Linked offerings.
- Token and blockchain details.
- Lifecycle timeline.

### Offering detail page

Should contain:

- Offering terms.
- Fundraising progress.
- Investor list.
- Token supply and outstanding allocations.
- Ownership table.
- Eligibility and transfer settings.
- Distribution history.
- Onchain transactions.
- Closure status.

### Investor portal

Investors should be able to view:

- Available offerings for which they qualify.
- Offering terms and relevant documents.
- Subscription status.
- Wallet holdings.
- Investment history.
- Distribution history.
- Redemption and closure updates.

The visual direction should be minimal, mobile-friendly, and credible for financial infrastructure. Avoid making the product feel like a speculative trading app.

---

## 14. MVP acceptance criteria

The MVP is complete only when a controlled test offering can progress through the lifecycle without manual database edits.

- [ ] An issuer can create an organization and asset.
- [ ] An issuer can configure and approve an offering.
- [ ] The platform can create and record a Solana token mint.
- [ ] An investor can connect and prove control of a wallet.
- [ ] An administrator can review and approve an investor.
- [ ] The system rejects subscriptions that violate offering rules.
- [ ] A test subscription can be recorded and settled.
- [ ] Tokens can be allocated and verified against onchain state.
- [ ] The issuer can view a reconciled ownership table.
- [ ] The issuer can create a distribution and preview entitlements.
- [ ] A test distribution can be executed or safely recorded in the sandbox.
- [ ] Failed operations can be retried without duplicate allocations or payouts.
- [ ] The offering can go through a controlled closure workflow.
- [ ] Significant actions are recorded in an audit trail.
- [ ] Organization-level access controls prevent unauthorized data access.

---

## 15. Success metrics

The first objective is proving the infrastructure works for a real issuer, not maximizing signups.

Track:

- Time required to configure an offering.
- Time required to complete token issuance.
- Percentage of investment flows completed successfully.
- Percentage of onchain operations reconciled automatically.
- Failed or duplicated allocations and payouts.
- Time required to prepare a distribution.
- Time required to close an offering.
- Number of issuers progressing from onboarding to a completed pilot.
- Infrastructure and third-party costs per active offering.

A particularly meaningful early milestone is one pilot issuer completing the entire lifecycle with no manual database intervention and a complete audit trail.

---

## 16. Explicitly out of scope for the MVP

Do not build these yet:

- Your own KYC or biometric verification system.
- Your own sanctions or AML database.
- A general-purpose decentralized exchange.
- An unrestricted secondary marketplace.
- Multiple blockchain integrations.
- Automated valuation or investment advice.
- Every possible asset class.
- Complex cross-chain bridging.
- A complete legal-services platform.
- An enterprise public API with every possible feature.

These can be evaluated once a real issuer has successfully used the core product.

---

## 17. Build roadmap

| Sprint | Theme | Focus |
|---|---|---|
| 1 | **Foundation:** Organizations, assets, and offerings | Authentication, database schema, role-based access, asset creation, offering configuration, audit events |
| 2 | **Onchain:** Solana tokenization | Token mint creation, authority configuration, transaction tracking, error recovery, and onchain reconciliation |
| 3 | **Investing:** Investors, subscriptions, and allocation | Wallet verification, manual eligibility approval, test settlement, token allocation, and cap table |
| 4 | **Lifecycle:** Distributions and closure | Holder snapshots, entitlement calculations, test payouts, redemption workflow, audit review, and pilot testing |

These are planning milestones, not guaranteed delivery dates. Actual duration depends on token-extension decisions, payment architecture, testing, and the legal structure of the pilot.

---

## 18. Key decisions before production

The following questions need explicit answers before moving from a working prototype to a live investment product:

1. **What does the token legally represent?** Direct ownership, beneficial interest through an SPV, a contractual revenue share, debt, or something else?
2. **Who controls the funds?** The issuer, a regulated payment provider, a custodian, or another authorized entity?
3. **How are tokens restricted?** Which Token-2022 extensions and authority arrangements are required?
4. **How are payments settled?** Which USDC flow, treasury model, and failure-recovery mechanism will be used?
5. **How are distributions calculated?** Which ownership snapshot, record date, contractual rules, and rounding policy apply?
6. **Who is responsible for compliance?** What the issuer must do, what 3rdfloor must do, and what external providers do need to be contractually clear.
7. **What is the first pilot?** Choose one asset structure and one complete lifecycle rather than attempting universal support.

---

## 19. Product definition of done

3rdfloor is ready for its first controlled pilot when an issuer can register an asset, configure an offering, create the associated token, approve investors, record and settle subscriptions, allocate tokens, reconcile ownership, process a distribution, and close the offering through documented workflows.

Every critical action must be permissioned, auditable, recoverable, and verifiable against the relevant onchain or payment records.

The central product thesis remains simple:

> 3rdfloor should let a company focus on its assets and investors while 3rdfloor handles the operational infrastructure that connects them to programmable ownership on Solana.