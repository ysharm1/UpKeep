# Requirements Document: Quote and Payment System

## Introduction

This document specifies the requirements for implementing a hybrid quote and payment system for the UpKeep platform. The system enables service providers to set optional base rates on their profiles and submit custom quotes for specific jobs. Homeowners can view, compare, and accept quotes, triggering a secure payment flow through Stripe. The system maintains a 15% platform fee and ensures payment is held until job completion.

## Glossary

- **Provider**: A service provider registered on the UpKeep platform who can submit quotes for jobs
- **Homeowner**: A user who creates job requests and can accept quotes from providers
- **Quote**: A custom price proposal submitted by a provider for a specific job request
- **Base_Rate**: Optional pricing guidelines set by a provider on their profile (not binding)
- **Payment_Intent**: A Stripe object representing authorization to charge a payment method
- **Platform_Fee**: The 15% commission charged by UpKeep on each transaction
- **Job_Request**: A service request created by a homeowner
- **Quote_Acceptance**: The action of a homeowner selecting and approving a specific quote
- **Payment_Authorization**: The process of reserving funds without capturing them
- **Payment_Capture**: The process of actually charging the authorized payment
- **Job_Completion**: The state when a provider marks a job as finished

## Requirements

### Requirement 1: Provider Base Rate Configuration

**User Story:** As a service provider, I want to set optional base rates on my profile, so that homeowners can see my general pricing guidelines.

#### Acceptance Criteria

1. THE Provider_Profile SHALL store hourly rate, diagnostic visit fee, emergency rate, and service call fee as optional fields
2. WHEN a provider updates their base rates, THE System SHALL validate that all rate values are non-negative numbers
3. WHEN a provider saves base rates, THE System SHALL persist the values to the database immediately
4. THE System SHALL allow providers to leave any or all base rate fields empty
5. WHEN displaying a provider profile, THE System SHALL show all configured base rates with appropriate labels

### Requirement 2: Provider Base Rate Display

**User Story:** As a homeowner, I want to see provider base rates on their profiles, so that I can understand their general pricing before requesting quotes.

#### Acceptance Criteria

1. WHEN a homeowner views a provider profile, THE System SHALL display all configured base rates
2. WHERE a base rate is not configured, THE System SHALL omit that rate from the display
3. THE System SHALL display a disclaimer that base rates are guidelines and actual quotes may vary
4. WHEN displaying base rates on provider cards, THE System SHALL show the most relevant rate (hourly or service call fee)

### Requirement 3: Custom Quote Submission

**User Story:** As a service provider, I want to submit custom quotes for specific jobs, so that I can provide accurate pricing based on the job details.

#### Acceptance Criteria

1. WHEN a provider views a job request, THE System SHALL display all job details including description, location, and homeowner information
2. THE Quote_Submission_Form SHALL require labor cost, parts estimate, and total amount fields
3. THE Quote_Submission_Form SHALL allow optional service fees, travel fees, and notes fields
4. WHEN a provider submits a quote, THE System SHALL validate that total amount equals the sum of all cost components
5. WHEN a provider submits a quote, THE System SHALL validate that all monetary values are non-negative
6. WHEN a quote is submitted, THE System SHALL store the quote with timestamp and associate it with the job request and provider
7. THE System SHALL allow multiple providers to submit quotes for the same job request
8. WHEN a quote is successfully submitted, THE System SHALL notify the homeowner

### Requirement 4: Quote Viewing and Comparison

**User Story:** As a homeowner, I want to view all quotes for my job request, so that I can compare providers and select the best option.

#### Acceptance Criteria

1. WHEN a homeowner views their job request, THE System SHALL display all submitted quotes
2. WHEN displaying a quote, THE System SHALL show provider name, rating, total price, cost breakdown, notes, and distance from job location
3. THE System SHALL sort quotes by submission date with newest first
4. THE System SHALL allow homeowners to filter quotes by price range
5. WHEN no quotes exist for a job request, THE System SHALL display a message indicating no quotes have been received

### Requirement 5: Quote Acceptance

**User Story:** As a homeowner, I want to accept a quote from a provider, so that I can proceed with hiring them for the job.

#### Acceptance Criteria

1. WHEN a homeowner accepts a quote, THE System SHALL mark that quote as accepted
2. WHEN a quote is accepted, THE System SHALL mark all other quotes for that job request as rejected
3. WHEN a quote is accepted, THE System SHALL prevent the homeowner from accepting additional quotes for that job request
4. WHEN a quote is accepted, THE System SHALL notify the provider whose quote was accepted
5. WHEN a quote is accepted, THE System SHALL initiate the payment authorization flow

### Requirement 6: Payment Authorization

**User Story:** As a homeowner, I want my payment to be securely authorized when I accept a quote, so that the provider knows I'm committed while funds remain protected until job completion.

#### Acceptance Criteria

1. WHEN a quote is accepted, THE Payment_Service SHALL create a Stripe payment intent with the quote total amount
2. THE Payment_Service SHALL authorize the payment without capturing funds
3. WHEN payment authorization succeeds, THE System SHALL store the payment intent ID with the job request
4. WHEN payment authorization fails, THE System SHALL revert the quote acceptance and notify the homeowner
5. THE System SHALL calculate platform fee as 15% of the quote total amount
6. THE System SHALL calculate provider payout as 85% of the quote total amount

### Requirement 7: Payment Capture on Job Completion

**User Story:** As a service provider, I want to receive payment when I complete a job, so that I'm compensated for my work.

#### Acceptance Criteria

1. WHEN a provider marks a job as complete, THE System SHALL capture the authorized payment
2. WHEN payment capture succeeds, THE Payment_Service SHALL initiate a transfer of 85% of the total amount to the provider's Stripe account
3. WHEN payment capture succeeds, THE System SHALL retain 15% as the platform fee
4. WHEN payment capture fails, THE System SHALL notify both the provider and homeowner
5. WHEN payment is captured, THE System SHALL update the job status to completed
6. WHEN payment is captured, THE System SHALL notify the homeowner of job completion

### Requirement 8: Payment Refund on Cancellation

**User Story:** As a homeowner, I want to receive a refund if a job is cancelled, so that I'm not charged for work that wasn't performed.

#### Acceptance Criteria

1. WHEN a job is cancelled before completion, THE Payment_Service SHALL cancel the payment intent and release the authorization
2. WHEN a job is cancelled after payment capture, THE Payment_Service SHALL issue a full refund
3. WHEN a refund is processed, THE System SHALL notify both the homeowner and provider
4. THE System SHALL allow cancellation by either homeowner or provider before job completion
5. WHEN a cancellation occurs, THE System SHALL update the job status to cancelled

### Requirement 9: Provider Dashboard - Available Jobs

**User Story:** As a service provider, I want to see jobs available for quoting, so that I can find work opportunities.

#### Acceptance Criteria

1. THE Provider_Dashboard SHALL display all job requests that match the provider's service categories
2. WHEN displaying available jobs, THE System SHALL show job description, location, distance, and posted date
3. THE Provider_Dashboard SHALL exclude jobs where the provider has already submitted a quote
4. THE Provider_Dashboard SHALL exclude jobs where a quote has already been accepted
5. WHEN a provider clicks on an available job, THE System SHALL navigate to the quote submission form

### Requirement 10: Provider Dashboard - Quote Management

**User Story:** As a service provider, I want to see my submitted quotes and their status, so that I can track my business opportunities.

#### Acceptance Criteria

1. THE Provider_Dashboard SHALL display all quotes submitted by the provider
2. WHEN displaying quotes, THE System SHALL show job details, quote amount, submission date, and status (pending/accepted/rejected)
3. THE Provider_Dashboard SHALL allow filtering quotes by status
4. THE Provider_Dashboard SHALL sort quotes by submission date with newest first
5. WHEN a quote is accepted, THE Provider_Dashboard SHALL highlight it prominently

### Requirement 11: Provider Dashboard - Active Jobs

**User Story:** As a service provider, I want to see my active jobs with payment status, so that I can manage my work and track payments.

#### Acceptance Criteria

1. THE Provider_Dashboard SHALL display all jobs where the provider's quote was accepted
2. WHEN displaying active jobs, THE System SHALL show job details, payment status, and homeowner contact information
3. THE Provider_Dashboard SHALL allow providers to mark jobs as complete
4. WHEN a job is marked complete, THE System SHALL trigger payment capture
5. THE Provider_Dashboard SHALL display completed jobs with payment confirmation

### Requirement 12: Homeowner Dashboard - Job Quote Status

**User Story:** As a homeowner, I want to see my jobs with quote counts, so that I can track provider interest and responses.

#### Acceptance Criteria

1. THE Homeowner_Dashboard SHALL display all job requests created by the homeowner
2. WHEN displaying jobs, THE System SHALL show job description, posted date, and number of quotes received
3. THE Homeowner_Dashboard SHALL allow filtering jobs by status (open/quoted/accepted/completed)
4. WHEN a homeowner clicks on a job, THE System SHALL navigate to the quote viewing page
5. THE Homeowner_Dashboard SHALL highlight jobs with new quotes since last view

### Requirement 13: Homeowner Dashboard - Payment Tracking

**User Story:** As a homeowner, I want to see accepted quotes with payment status, so that I can track my financial commitments and job progress.

#### Acceptance Criteria

1. THE Homeowner_Dashboard SHALL display all jobs with accepted quotes
2. WHEN displaying accepted jobs, THE System SHALL show provider name, quote amount, payment status, and job status
3. THE System SHALL display payment status as authorized, captured, or refunded
4. WHEN a job is completed, THE Homeowner_Dashboard SHALL show payment capture confirmation
5. THE Homeowner_Dashboard SHALL display the total amount paid and breakdown of costs

### Requirement 14: Data Persistence and Integrity

**User Story:** As a system administrator, I want all quote and payment data to be reliably stored, so that the platform maintains accurate financial records.

#### Acceptance Criteria

1. THE System SHALL store all quotes with complete cost breakdown and metadata
2. THE System SHALL store all payment intents with associated job and quote references
3. WHEN a database operation fails, THE System SHALL roll back the transaction and maintain data consistency
4. THE System SHALL maintain an audit trail of all quote status changes
5. THE System SHALL maintain an audit trail of all payment state changes

### Requirement 15: Notification System

**User Story:** As a user, I want to receive notifications about quote and payment events, so that I stay informed about important updates.

#### Acceptance Criteria

1. WHEN a quote is submitted, THE System SHALL notify the homeowner
2. WHEN a quote is accepted, THE System SHALL notify the provider
3. WHEN a quote is rejected, THE System SHALL notify the provider
4. WHEN payment authorization fails, THE System SHALL notify the homeowner
5. WHEN a job is marked complete, THE System SHALL notify the homeowner
6. WHEN payment is captured, THE System SHALL notify both homeowner and provider
7. WHEN a job is cancelled, THE System SHALL notify both homeowner and provider
