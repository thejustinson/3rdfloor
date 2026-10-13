export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: '3rdfloor RWA Tokenization Infrastructure API',
      version: '1.0.0',
      description:
        'Programmable real-world asset registration, offering configuration, investor subscription settlement, Solana Token-2022 allocation, cap table reconciliation, and yield distributions.',
    },
    servers: [
      {
        url: '/api/v1',
        description: '3rdfloor v1 REST API',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: '3f_live_<secret>',
          description:
            'Workspace-scoped secret key generated in the Developers & API Keys dashboard.',
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/assets': {
        get: {
          summary: 'List organization assets',
          tags: ['Assets'],
          responses: {
            '200': { description: 'Array of assets belonging to the organization' },
            '401': { description: 'Missing or invalid API key' },
          },
        },
        post: {
          summary: 'Register a new real-world asset',
          tags: ['Assets'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'category'],
                  properties: {
                    name: { type: 'string', example: 'Mayfair Commercial Plaza' },
                    category: { type: 'string', example: 'Real Estate' },
                    declaredValuation: { type: 'number', example: 4500000 },
                    currency: { type: 'string', example: 'USD' },
                    description: {
                      type: 'string',
                      example: 'Class-A commercial property held via SPV.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created asset record' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/assets/{assetId}': {
        get: {
          summary: 'Get asset details and linked offerings',
          tags: ['Assets'],
          parameters: [
            {
              name: 'assetId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Asset details with linked offerings' },
            '404': { description: 'Asset not found' },
          },
        },
      },
      '/offerings': {
        get: {
          summary: 'List organization offerings',
          tags: ['Offerings'],
          responses: {
            '200': { description: 'Array of offerings with asset and token records' },
          },
        },
        post: {
          summary: 'Create a new investment offering',
          tags: ['Offerings'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assetId', 'name'],
                  properties: {
                    assetId: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Mayfair Plaza Series A' },
                    description: { type: 'string', example: 'Fractionalized SPV notes.' },
                    targetRaise: { type: 'number', example: 1000000 },
                    tokenName: { type: 'string', example: 'Mayfair Note' },
                    tokenSymbol: { type: 'string', example: 'MFR' },
                    tokenStandard: { type: 'string', example: 'Token-2022' },
                    tokenSupply: { type: 'number', example: 100000 },
                    tokenPrice: { type: 'number', example: 10 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created offering draft' },
          },
        },
      },
      '/offerings/{offeringId}': {
        get: {
          summary: 'Get offering details, Token-2022 mint, subscriptions & distributions',
          tags: ['Offerings'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Offering details' },
            '404': { description: 'Offering not found' },
          },
        },
      },
      '/offerings/{offeringId}/status': {
        post: {
          summary: 'Transition offering status & optionally deploy Solana Token-2022 mint',
          tags: ['Offerings'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['draft', 'under_review', 'approved', 'open', 'paused', 'closed'],
                      example: 'open',
                    },
                    deployToken: {
                      type: 'boolean',
                      example: true,
                      description:
                        'If true and no token mint exists yet, deploys the Solana Token-2022 mint and initial supply.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated offering and deployed token details' },
          },
        },
      },
      '/offerings/{offeringId}/subscriptions': {
        get: {
          summary: 'List investor subscriptions for an offering',
          tags: ['Subscriptions'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Array of subscriptions' },
          },
        },
        post: {
          summary: 'Create an investor subscription',
          tags: ['Subscriptions'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['investorWallet', 'amountUsd'],
                  properties: {
                    investorWallet: {
                      type: 'string',
                      example: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
                    },
                    amountUsd: { type: 'number', example: 5000 },
                    tokenQuantity: { type: 'number', example: 500 },
                    investorEmail: { type: 'string', example: 'investor@fund.io' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created pending subscription' },
          },
        },
      },
      '/investors': {
        get: {
          summary: 'List organization investors & aggregated holdings',
          tags: ['Investors'],
          responses: {
            '200': {
              description:
                'Array of registered investors with KYC status and settled capital metrics',
            },
          },
        },
        post: {
          summary: 'Onboard a new investor profile',
          tags: ['Investors'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string', example: 'Aether Institutional Fund LP' },
                    email: { type: 'string', example: 'allocations@aether-lp.io' },
                    walletAddress: {
                      type: 'string',
                      example: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
                    },
                    investorType: {
                      type: 'string',
                      enum: [
                        'individual',
                        'accredited',
                        'institutional',
                        'qualified_purchaser',
                      ],
                      example: 'institutional',
                    },
                    jurisdiction: { type: 'string', example: 'US' },
                    kycStatus: {
                      type: 'string',
                      enum: ['pending', 'approved', 'rejected', 'suspended'],
                      example: 'approved',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created investor profile' },
          },
        },
      },
      '/investors/{investorId}': {
        get: {
          summary: 'Get investor profile, KYC status & subscription history',
          tags: ['Investors'],
          parameters: [
            {
              name: 'investorId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Investor profile and subscriptions' },
            '404': { description: 'Investor not found' },
          },
        },
        patch: {
          summary: 'Update investor KYC status, wallet address, or classification',
          tags: ['Investors'],
          parameters: [
            {
              name: 'investorId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kycStatus: {
                      type: 'string',
                      enum: ['pending', 'approved', 'rejected', 'suspended'],
                      example: 'approved',
                    },
                    walletAddress: { type: 'string' },
                    investorType: { type: 'string' },
                    jurisdiction: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated investor profile' },
          },
        },
      },
      '/investors/{investorId}/kyc': {
        get: {
          summary: 'Get investor KYC verification state & settlement eligibility',
          tags: ['Investor KYC'],
          parameters: [
            {
              name: 'investorId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description:
                'KYC verification status, accreditation attestation, wallet whitelist state, and settlement eligibility boolean',
            },
            '404': { description: 'Investor not found in workspace' },
          },
        },
        post: {
          summary: 'Submit or update investor KYC determination & wallet whitelist',
          tags: ['Investor KYC'],
          parameters: [
            {
              name: 'investorId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kycStatus: {
                      type: 'string',
                      enum: ['pending', 'approved', 'rejected', 'suspended'],
                      example: 'approved',
                    },
                    investorType: {
                      type: 'string',
                      enum: [
                        'individual',
                        'accredited',
                        'institutional',
                        'qualified_purchaser',
                      ],
                      example: 'institutional',
                    },
                    jurisdiction: {
                      type: 'string',
                      example: 'US',
                    },
                    walletAddress: {
                      type: 'string',
                      example: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
                    },
                    provider: {
                      type: 'string',
                      example: 'sumsub',
                    },
                    referenceId: {
                      type: 'string',
                      example: 'inq_98a7b6c5d4e3',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'Updated KYC compliance record and computed settlement eligibility',
            },
            '422': { description: 'Invalid KYC status or investor classification' },
          },
        },
      },
      '/subscriptions/{subscriptionId}/settle': {
        post: {
          summary: 'Settle subscription & allocate Token-2022 tokens on Solana',
          tags: ['Subscriptions'],
          parameters: [
            {
              name: 'subscriptionId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description:
                'Settled subscription with Solana Devnet transaction signature',
            },
          },
        },
      },
      '/offerings/{offeringId}/holdings': {
        get: {
          summary: 'Get reconciled on-chain token ownership Cap Table',
          tags: ['Lifecycle'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Reconciled ownership table and supply metrics' },
          },
        },
      },
      '/offerings/{offeringId}/distributions': {
        get: {
          summary: 'List distributions and calculated pro-rata entitlements',
          tags: ['Lifecycle'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Distributions with holder entitlements' },
          },
        },
        post: {
          summary: 'Declare & execute a pro-rata distribution to token holders',
          tags: ['Lifecycle'],
          parameters: [
            {
              name: 'offeringId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'totalAmountUsd'],
                  properties: {
                    title: { type: 'string', example: 'Q4 2026 Rental Yield Payout' },
                    totalAmountUsd: { type: 'number', example: 25000 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description:
                'Executed distribution record with per-holder payout entitlements',
            },
          },
        },
      },
    },
  };

  return Response.json(spec, { status: 200 });
}
