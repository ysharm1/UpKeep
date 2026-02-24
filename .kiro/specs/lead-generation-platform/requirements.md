# Requirements Document: Lead Generation Platform

## Introduction

This document specifies the requirements for a lead generation platform that connects homeowners seeking home repair services with local service providers. The platform operates on a pay-per-lead model where homeowners submit problems for FREE, and service providers pay to view and accept leads. The system uses SMS notifications, Stripe payments, and AI-powered diagnostics to facilitate the lead generation process.

## Business Model

- **Homeowners**: Submit problems completely FREE
- **Service Providers**: Pay $15 to view lead details, $50 to accept lead exclusively
- **Platform Revenue**: $95 per lead (3 providers × $15 view + 1 provider × $50 accept)

## Glossary

- **Lead**: A homeowner's service request that is broadcast to service providers
- **Lead_View**: When a provider pays $15 to see full lead details
- **Lead_Acceptance**: When a provider pays $50 to accept a lead exclusively
- **Lead_Status**: Current state of a lead (available, viewed, accepted, expired)
- **Service_Provider**: A verified professional who pays to view and accept leads
- **Homeowner**: A user who submits service requests for FREE
- **Partner**: A pre-configured service provider in the system
- **SMS_Notification**: Text message sent via Twilio to notify providers
- **Payment_Intent**: Stripe object for processing payments
- **AI_Diagnosis**: OpenAI-powered analysis of homeowner's problem

## Requirements

### Requirement 1: Homeowner Problem Submission

**User Story:** As a homeowner, I want to submit my home repair problem for FREE with photos and description, so that I can get help from local service providers.

#### Acceptance Criteria

1. WHEN a homeowner submits a problem, THE System SHALL accept text description of at least 10 characters
2. WHEN a homeowner uploads photos, THE System SHALL accept JPEG and PNG formats up to 50MB per file
3. WHEN a homeowner submits a problem, THE System SHALL store it as a JobRequest with status "submitted"
4. THE System SHALL NOT charge homeowners any fees for submitting problems
5. WHEN a problem is submitted, THE System SHALL provide AI-powered diagnostic suggestions
6. WHEN a homeowner completes submission, THE System SHALL broadcast the lead to matching service providers

### Requirement 2: AI-Powered Diagnostics

**User Story:** As a homeowner, I want to receive AI-powered diagnostic suggestions, so that I might solve the problem myself before hiring a professional.

#### Acceptance Criteria

1. WHEN a homeowner submits a problem with description and photos, THE AI_Diagnosis SHALL analyze the problem
2. THE AI_Diagnosis SHALL provide step-by-step DIY solutions when applicable
3. WHEN the homeowner indicates the problem is resolved, THE System SHALL mark the JobRequest as completed
4. WHEN the homeowner indicates the problem is not resolved, THE System SHALL proceed to broadcast the lead to providers
5. THE AI_Diagnosis SHALL use OpenAI API for problem analysis

### Requirement 3: Lead Broadcasting to Service Providers

**User Story:** As a platform owner, I want to automatically broadcast new leads to 3 matching service providers via SMS, so that providers can compete for the lead.

#### Acceptance Criteria

1. WHEN a lead is created, THE System SHALL identify 3 service providers matching the problem category
2. THE System SHALL filter providers by service area matching the homeowner's location
3. WHEN 3 providers are identified, THE System SHALL send SMS notification to each provider
4. THE SMS notification SHALL include lead category, location, and link to view details
5. THE System SHALL set lead status to "available" after broadcasting
6. WHEN fewer than 3 providers match, THE System SHALL send to all available matching providers

### Requirement 4: SMS Notifications via Twilio

**User Story:** As a service provider, I want to receive SMS notifications about new leads, so that I can respond quickly to opportunities.

#### Acceptance Criteria

1. WHEN a new lead is broadcast, THE System SHALL send SMS via Twilio to each provider
2. THE SMS SHALL include: lead category, location, brief description, and link to view
3. WHEN a provider views a lead, THE System SHALL send SMS confirmation of $15 charge
4. WHEN a provider accepts a lead, THE System SHALL send SMS confirmation with customer contact details
5. WHEN a lead is accepted by another provider, THE System SHALL send SMS notification to other providers
6. WHEN Twilio is not configured, THE System SHALL log SMS content to console

### Requirement 5: Lead Preview for Providers

**User Story:** As a service provider, I want to see a preview of leads before paying, so that I can decide if the lead is worth viewing.

#### Acceptance Criteria

1. WHEN a provider views available leads, THE System SHALL display preview information only
2. THE preview SHALL include: category, location, brief description (first 100 characters), time posted
3. THE preview SHALL NOT include: customer name, phone, email, full description, photos
4. THE preview SHALL display "Pay $15 to View" button
5. THE System SHALL display number of other providers who have viewed the lead

### Requirement 6: Lead View Payment ($15)

**User Story:** As a service provider, I want to pay $15 to view full lead details, so that I can evaluate if I want to accept the lead.

#### Acceptance Criteria

1. WHEN a provider clicks "Pay $15 to View", THE System SHALL charge $15 via Stripe
2. WHEN payment succeeds, THE System SHALL create a LeadView record with providerId, jobId, amount, timestamp
3. WHEN payment succeeds, THE System SHALL reveal full lead details: customer name, phone, email, full description, photos
4. WHEN payment succeeds, THE System SHALL update provider's totalLeadsViewed and totalSpent
5. WHEN payment succeeds, THE System SHALL increment job's viewCount
6. WHEN payment fails, THE System SHALL display error message and NOT reveal lead details
7. THE System SHALL prevent providers from viewing the same lead twice

### Requirement 7: Lead Acceptance Payment ($50)

**User Story:** As a service provider, I want to pay $50 to accept a lead exclusively, so that I can contact the customer and complete the job.

#### Acceptance Criteria

1. WHEN a provider clicks "Accept This Lead - $50", THE System SHALL charge $50 via Stripe
2. WHEN payment succeeds, THE System SHALL create a LeadAcceptance record with providerId, jobId, amount, timestamp
3. WHEN payment succeeds, THE System SHALL update job status to "accepted" and set acceptedBy to providerId
4. WHEN payment succeeds, THE System SHALL update provider's totalLeadsAccepted and totalSpent
5. WHEN payment succeeds, THE System SHALL send SMS to other providers that lead was accepted
6. WHEN payment succeeds, THE System SHALL display customer contact information to accepting provider
7. WHEN payment fails, THE System SHALL display error message and NOT accept the lead
8. THE System SHALL prevent accepting a lead that is already accepted

### Requirement 8: Provider Lead Marketplace

**User Story:** As a service provider, I want to see all available leads in a marketplace, so that I can browse and select leads to view.

#### Acceptance Criteria

1. THE Provider_Marketplace SHALL display three tabs: Available, I'm Viewing, Won
2. THE Available tab SHALL show leads the provider has not viewed yet (preview only)
3. THE I'm Viewing tab SHALL show leads the provider paid $15 to view (full details + accept button)
4. THE Won tab SHALL show leads the provider accepted (customer contact info)
5. THE System SHALL filter leads by provider's service categories
6. THE System SHALL sort leads by creation date (newest first)
7. THE System SHALL display lead count for each tab

### Requirement 9: Provider Dashboard with Lead Stats

**User Story:** As a service provider, I want to see my lead statistics on my dashboard, so that I can track my performance and spending.

#### Acceptance Criteria

1. THE Provider_Dashboard SHALL display: Available Leads count, Leads I'm Viewing count, Leads Won count, Win Rate %
2. THE Win Rate SHALL be calculated as (totalLeadsAccepted / totalLeadsViewed) × 100
3. THE Provider_Dashboard SHALL display total amount spent on leads
4. THE Provider_Dashboard SHALL provide link to Lead Marketplace
5. THE System SHALL update stats in real-time after each view or acceptance

### Requirement 10: Stripe Payment Integration

**User Story:** As a platform owner, I want to process payments securely via Stripe, so that I can charge providers for viewing and accepting leads.

#### Acceptance Criteria

1. THE System SHALL use Stripe API for all payment processing
2. WHEN charging a provider, THE System SHALL use their stored Stripe customer ID
3. THE System SHALL charge $15 for lead views (1500 cents)
4. THE System SHALL charge $50 for lead acceptances (5000 cents)
5. WHEN payment succeeds, THE System SHALL store transaction details in database
6. WHEN payment fails, THE System SHALL return error message to provider
7. THE System SHALL support Stripe test mode for development

### Requirement 11: Provider Stripe Customer Setup

**User Story:** As a service provider, I want to securely save my payment method, so that I can quickly view and accept leads without re-entering payment details.

#### Acceptance Criteria

1. WHEN a provider registers, THE System SHALL create a Stripe customer for them
2. THE System SHALL store the Stripe customer ID in ServiceProviderProfile
3. THE System SHALL allow providers to add and update payment methods
4. THE System SHALL use saved payment method for all lead transactions
5. THE System SHALL handle payment method failures gracefully

### Requirement 12: Partner Configuration

**User Story:** As a platform owner, I want to configure partner service providers, so that the system knows which providers to notify for each lead category.

#### Acceptance Criteria

1. THE System SHALL maintain a partners configuration file with provider details
2. EACH partner SHALL have: id, name, email, phone, categories, serviceArea, viewFee, acceptFee
3. THE System SHALL use partner configuration to determine which providers receive lead notifications
4. THE System SHALL allow partners to be marked as active or inactive
5. THE System SHALL filter leads by partner's service categories and service area

### Requirement 13: Lead Expiration

**User Story:** As a platform owner, I want leads to expire after a certain time, so that providers don't see stale leads.

#### Acceptance Criteria

1. WHEN a lead is not accepted within 48 hours, THE System SHALL mark it as "expired"
2. THE System SHALL NOT display expired leads in the Available tab
3. THE System SHALL allow providers who viewed expired leads to still see them in I'm Viewing tab
4. THE System SHALL NOT allow acceptance of expired leads

### Requirement 14: Revenue Tracking

**User Story:** As a platform owner, I want to track revenue from lead views and acceptances, so that I can monitor platform performance.

#### Acceptance Criteria

1. THE System SHALL store all LeadView records with amount and timestamp
2. THE System SHALL store all LeadAcceptance records with amount and timestamp
3. THE System SHALL provide database queries to calculate daily, weekly, and monthly revenue
4. THE System SHALL track revenue per provider
5. THE System SHALL track revenue per lead category

### Requirement 15: Error Handling and Validation

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know how to resolve issues.

#### Acceptance Criteria

1. ALL API endpoints SHALL have try-catch error handling
2. WHEN Stripe payment fails, THE System SHALL display user-friendly error message
3. WHEN validation fails, THE System SHALL return 400 status with clear message
4. WHEN authentication fails, THE System SHALL return 401 status with clear message
5. WHEN resource not found, THE System SHALL return 404 status with clear message
6. WHEN server error occurs, THE System SHALL return 500 status and log details

## Technical Requirements

### Database Schema

- **LeadStatus** enum: available, viewed, accepted, expired
- **LeadView** table: id, providerId, jobRequestId, amount, viewedAt
- **LeadAcceptance** table: id, providerId, jobRequestId, amount, acceptedAt
- **JobRequest** updates: leadStatus, acceptedBy, acceptedAt, viewCount
- **ServiceProviderProfile** updates: stripeCustomerId, totalLeadsViewed, totalLeadsAccepted, totalSpent

### API Endpoints

- `POST /api/jobs` - Create job request (homeowner, FREE)
- `GET /api/leads` - Get available/viewed/won leads (provider)
- `GET /api/leads/[id]` - Get single lead preview or full details
- `POST /api/leads/[id]/view` - Pay $15 to view lead
- `POST /api/leads/[id]/accept` - Pay $50 to accept lead

### External Services

- **Stripe**: Payment processing (test and live modes)
- **Twilio**: SMS notifications
- **OpenAI**: AI-powered diagnostics
- **Supabase**: PostgreSQL database

### Security

- All endpoints require authentication
- Validate provider has permission for actions
- Prevent duplicate views/acceptances
- Validate payment amounts
- Use parameterized queries (Prisma)

## Out of Scope (Future Enhancements)

- Refund system for disputed leads
- Lead quality scoring
- Provider performance analytics
- Automated partner onboarding
- Multi-language support
- Mobile app
- Real-time WebSocket notifications
- Provider payout automation (Stripe Connect)
