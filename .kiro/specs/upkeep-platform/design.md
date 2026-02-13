# Design Document: UpKeep Platform

## Overview

UpKeep is a two-sided marketplace web application that connects homeowners with local service providers for home repair and maintenance services. The platform features an AI-powered diagnostic chatbot, location-based matching, job workflows, ratings, messaging, and payment processing.

The system is built as a modern web application with a React/Next.js frontend, Node.js backend API, PostgreSQL database, and integrations with OpenAI for AI diagnostics and cloud storage for media files.

### Key Design Principles

1. **User-Centric Flow**: Streamlined problem submission with AI assistance before professional matching
2. **Trust and Safety**: Two-way ratings, verification badges, and transparent profiles
3. **Real-Time Communication**: WebSocket-based messaging for instant coordination
4. **Scalable Architecture**: Microservices-ready design with clear separation of concerns
5. **Mobile-First Responsive**: Optimized for mobile devices while supporting desktop

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React/Next.js)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Homeowner   │  │   Service    │  │    Admin     │     │
│  │     UI       │  │  Provider UI │  │      UI      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   API Gateway  │
                    │   (Next.js API)│
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services (Node.js)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │   Job Mgmt   │  │   Matching   │     │
│  │   Service    │  │   Service    │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Messaging  │  │   Payment    │  │   Rating     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  AI Chatbot  │  │    Media     │                        │
│  │   Service    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  PostgreSQL   │  │   Cloud Storage │  │  OpenAI API │
│   Database    │  │  (AWS S3/GCS)   │  │             │
└───────────────┘  └─────────────────┘  └─────────────┘
```

### Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Express.js, TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Real-Time**: Socket.io for WebSocket connections
- **AI**: OpenAI GPT-4 API for diagnostic chatbot
- **Storage**: AWS S3 or Google Cloud Storage for media files
- **Authentication**: JWT tokens with refresh token rotation
- **Payment**: Stripe API for payment processing
- **Deployment**: Vercel (frontend), AWS/GCP (backend), managed PostgreSQL

## Components and Interfaces

### 1. Authentication Service

Handles user registration, login, session management, and password reset.

**Interface:**
```typescript
interface AuthService {
  register(email: string, password: string, role: UserRole): Promise<User>
  login(email: string, password: string): Promise<AuthToken>
  logout(userId: string): Promise<void>
  refreshToken(refreshToken: string): Promise<AuthToken>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  validateSession(token: string): Promise<User>
}

interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  profile: HomeownerProfile | ServiceProviderProfile
}

type UserRole = 'homeowner' | 'service_provider' | 'admin'

interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

**Implementation Details:**
- Passwords hashed using bcrypt with salt rounds of 12
- JWT access tokens expire after 15 minutes
- Refresh tokens expire after 7 days and stored in database
- Password reset tokens expire after 1 hour
- Email verification required before full account access

### 2. Job Management Service

Manages job requests, status transitions, and job lifecycle.

**Interface:**
```typescript
interface JobManagementService {
  createJobRequest(homeownerId: string, details: JobDetails): Promise<JobRequest>
  getJobRequest(jobId: string): Promise<JobRequest>
  updateJobStatus(jobId: string, status: JobStatus): Promise<JobRequest>
  assignServiceProvider(jobId: string, providerId: string): Promise<JobRequest>
  cancelJob(jobId: string, userId: string, reason: string): Promise<JobRequest>
  completeJob(jobId: string, providerId: string): Promise<JobRequest>
  confirmCompletion(jobId: string, homeownerId: string): Promise<JobRequest>
  getJobHistory(userId: string, filters: JobFilters): Promise<JobRequest[]>
}

interface JobRequest {
  id: string
  homeownerId: string
  serviceProviderId?: string
  category: ServiceCategory
  description: string
  mediaUrls: string[]
  location: Location
  status: JobStatus
  priceQuote?: number
  createdAt: Date
  updatedAt: Date
  scheduledDate?: Date
}

type JobStatus = 
  | 'submitted' 
  | 'ai_diagnosis' 
  | 'resolved_diy' 
  | 'pending_match' 
  | 'matched' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled'

type ServiceCategory = 'hvac' | 'plumbing' | 'electrical' | 'general_maintenance'

interface Location {
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
}
```

### 3. AI Chatbot Service

Provides diagnostic assistance and DIY solution suggestions using OpenAI API.

**Interface:**
```typescript
interface AIChatbotService {
  analyzeProblem(description: string, category: ServiceCategory, mediaUrls: string[]): Promise<DiagnosticResponse>
  getChatResponse(conversationId: string, userMessage: string): Promise<ChatMessage>
  createConversation(jobRequestId: string): Promise<Conversation>
  endConversation(conversationId: string, resolved: boolean): Promise<void>
}

interface DiagnosticResponse {
  conversationId: string
  diagnosis: string
  diySteps: DIYStep[]
  confidence: number
  requiresProfessional: boolean
}

interface DIYStep {
  stepNumber: number
  instruction: string
  safetyWarning?: string
  estimatedTime: string
}

interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  jobRequestId: string
  messages: ChatMessage[]
  resolved: boolean
  createdAt: Date
}
```

**Implementation Details:**
- Uses OpenAI GPT-4 with custom system prompts for home repair diagnostics
- Includes safety guidelines to prevent dangerous DIY suggestions
- Analyzes uploaded images using GPT-4 Vision API
- Maintains conversation context for follow-up questions
- Confidence threshold of 0.7 to recommend professional help

### 4. Matching Engine

Matches job requests with appropriate service providers based on location, specialty, and ratings.

**Interface:**
```typescript
interface MatchingEngine {
  findMatches(jobRequest: JobRequest): Promise<ServiceProviderMatch[]>
  rankProviders(providers: ServiceProvider[], jobRequest: JobRequest): ServiceProviderMatch[]
  notifyProviders(jobRequestId: string, providerIds: string[]): Promise<void>
  checkAvailability(providerId: string, date: Date): Promise<boolean>
}

interface ServiceProviderMatch {
  provider: ServiceProvider
  matchScore: number
  distance: number
  estimatedResponseTime: string
}

interface ServiceProvider {
  id: string
  userId: string
  businessName: string
  specialties: ServiceCategory[]
  serviceArea: ServiceArea
  rating: number
  reviewCount: number
  verified: boolean
  insuranceVerified: boolean
  licenseNumber: string
  profilePhotoUrl?: string
}

interface ServiceArea {
  centerLocation: Location
  radiusMiles: number
  zipCodes: string[]
}
```

**Implementation Details:**
- Uses PostGIS extension for geographic queries
- Matching algorithm:
  1. Filter by service area (within radius or zip code match)
  2. Filter by specialty match
  3. Rank by rating (weight: 0.5), distance (weight: 0.3), response time (weight: 0.2)
- Returns top 5 matches by default
- Caches provider availability for 5 minutes

### 5. Messaging Service

Enables real-time communication between homeowners and service providers.

**Interface:**
```typescript
interface MessagingService {
  createThread(jobRequestId: string, homeownerId: string, providerId: string): Promise<MessageThread>
  sendMessage(threadId: string, senderId: string, content: string, mediaUrl?: string): Promise<Message>
  getThread(threadId: string): Promise<MessageThread>
  getThreadsByUser(userId: string): Promise<MessageThread[]>
  markAsRead(threadId: string, userId: string): Promise<void>
  archiveThread(threadId: string): Promise<void>
}

interface MessageThread {
  id: string
  jobRequestId: string
  homeownerId: string
  serviceProviderId: string
  messages: Message[]
  archived: boolean
  createdAt: Date
  lastMessageAt: Date
}

interface Message {
  id: string
  threadId: string
  senderId: string
  content: string
  mediaUrl?: string
  readBy: string[]
  timestamp: Date
}
```

**Implementation Details:**
- Uses Socket.io for WebSocket connections
- Messages stored in PostgreSQL with full-text search capability
- Real-time delivery with fallback to polling for unstable connections
- Typing indicators and read receipts
- Media uploads limited to 10MB, stored in cloud storage

### 6. Rating Service

Manages two-way ratings and reviews between homeowners and service providers.

**Interface:**
```typescript
interface RatingService {
  submitRating(jobId: string, reviewerId: string, revieweeId: string, rating: RatingSubmission): Promise<Rating>
  getRatingsForUser(userId: string): Promise<Rating[]>
  getAverageRating(userId: string): Promise<number>
  canSubmitRating(jobId: string, userId: string): Promise<boolean>
  flagReview(ratingId: string, reason: string): Promise<void>
}

interface RatingSubmission {
  score: number // 1-5
  review?: string // max 500 chars
}

interface Rating {
  id: string
  jobId: string
  reviewerId: string
  revieweeId: string
  score: number
  review?: string
  createdAt: Date
  flagged: boolean
}
```

**Implementation Details:**
- Ratings can only be submitted after job completion
- 7-day window for rating submission
- Average rating calculated with weighted recent ratings (last 20 reviews weighted 1.5x)
- Reviews flagged for moderation if they contain profanity or personal information
- Both parties must rate before ratings become visible

### 7. Payment Service

Handles payment authorization, processing, and fund transfers.

**Interface:**
```typescript
interface PaymentService {
  createPaymentIntent(jobId: string, amount: number): Promise<PaymentIntent>
  authorizePayment(paymentIntentId: string, paymentMethodId: string): Promise<Authorization>
  capturePayment(authorizationId: string): Promise<Payment>
  refundPayment(paymentId: string, amount: number, reason: string): Promise<Refund>
  getTransactionHistory(userId: string): Promise<Transaction[]>
  addPaymentMethod(userId: string, paymentMethodDetails: PaymentMethodDetails): Promise<PaymentMethod>
}

interface PaymentIntent {
  id: string
  jobId: string
  amount: number
  currency: string
  status: 'pending' | 'authorized' | 'captured' | 'failed'
}

interface Authorization {
  id: string
  paymentIntentId: string
  authorizedAmount: number
  expiresAt: Date
}

interface Payment {
  id: string
  jobId: string
  amount: number
  platformFee: number
  providerAmount: number
  status: 'processing' | 'completed' | 'failed'
  createdAt: Date
}

interface Transaction {
  id: string
  userId: string
  type: 'charge' | 'payout' | 'refund'
  amount: number
  status: string
  createdAt: Date
}
```

**Implementation Details:**
- Uses Stripe for payment processing
- Platform fee: 15% of transaction amount
- Payment authorization on quote acceptance (hold for 7 days)
- Automatic capture on homeowner confirmation of completion
- Payout to service provider within 2 business days
- Refund policy: full refund if cancelled before acceptance, partial refund based on work completed

### 8. Media Service

Manages upload, storage, and retrieval of photos and videos.

**Interface:**
```typescript
interface MediaService {
  uploadMedia(file: File, userId: string, context: MediaContext): Promise<MediaFile>
  getMediaUrl(mediaId: string): Promise<string>
  deleteMedia(mediaId: string, userId: string): Promise<void>
  validateMedia(file: File): Promise<ValidationResult>
}

interface MediaFile {
  id: string
  userId: string
  filename: string
  mimeType: string
  sizeBytes: number
  url: string
  thumbnailUrl?: string
  context: MediaContext
  uploadedAt: Date
}

type MediaContext = 'job_request' | 'message' | 'profile' | 'verification'

interface ValidationResult {
  valid: boolean
  errors: string[]
}
```

**Implementation Details:**
- Accepted formats: JPEG, PNG, MP4, MOV
- Max file size: 50MB for job requests, 10MB for messages
- Files stored in cloud storage with CDN distribution
- Automatic thumbnail generation for images
- Video transcoding to web-optimized formats
- Virus scanning on upload
- Signed URLs with 1-hour expiration for security

## Data Models

### Database Schema

```typescript
// User and Authentication
model User {
  id: string @id @default(uuid())
  email: string @unique
  passwordHash: string
  role: UserRole
  emailVerified: boolean @default(false)
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  homeownerProfile: HomeownerProfile?
  serviceProviderProfile: ServiceProviderProfile?
  refreshTokens: RefreshToken[]
}

model HomeownerProfile {
  id: string @id @default(uuid())
  userId: string @unique
  user: User @relation(fields: [userId], references: [id])
  firstName: string
  lastName: string
  phoneNumber: string
  address: Address
  averageRating: float @default(0)
  jobRequests: JobRequest[]
}

model ServiceProviderProfile {
  id: string @id @default(uuid())
  userId: string @unique
  user: User @relation(fields: [userId], references: [id])
  businessName: string
  phoneNumber: string
  specialties: ServiceCategory[]
  serviceArea: ServiceArea
  licenseNumber: string
  verified: boolean @default(false)
  insuranceVerified: boolean @default(false)
  profilePhotoUrl: string?
  averageRating: float @default(0)
  reviewCount: int @default(0)
  jobRequests: JobRequest[]
}

model Address {
  id: string @id @default(uuid())
  street: string
  city: string
  state: string
  zipCode: string
  latitude: float
  longitude: float
}

// Job Management
model JobRequest {
  id: string @id @default(uuid())
  homeownerId: string
  homeowner: HomeownerProfile @relation(fields: [homeownerId], references: [id])
  serviceProviderId: string?
  serviceProvider: ServiceProviderProfile? @relation(fields: [serviceProviderId], references: [id])
  category: ServiceCategory
  description: string
  mediaFiles: MediaFile[]
  location: Address
  status: JobStatus
  priceQuote: float?
  scheduledDate: DateTime?
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  conversation: Conversation?
  messageThread: MessageThread?
  ratings: Rating[]
  payment: Payment?
}

// AI Chatbot
model Conversation {
  id: string @id @default(uuid())
  jobRequestId: string @unique
  jobRequest: JobRequest @relation(fields: [jobRequestId], references: [id])
  messages: ChatMessage[]
  resolved: boolean @default(false)
  createdAt: DateTime @default(now())
}

model ChatMessage {
  id: string @id @default(uuid())
  conversationId: string
  conversation: Conversation @relation(fields: [conversationId], references: [id])
  role: string // 'user' | 'assistant'
  content: string
  timestamp: DateTime @default(now())
}

// Messaging
model MessageThread {
  id: string @id @default(uuid())
  jobRequestId: string @unique
  jobRequest: JobRequest @relation(fields: [jobRequestId], references: [id])
  homeownerId: string
  serviceProviderId: string
  messages: Message[]
  archived: boolean @default(false)
  createdAt: DateTime @default(now())
  lastMessageAt: DateTime @updatedAt
}

model Message {
  id: string @id @default(uuid())
  threadId: string
  thread: MessageThread @relation(fields: [threadId], references: [id])
  senderId: string
  content: string
  mediaUrl: string?
  readBy: string[]
  timestamp: DateTime @default(now())
}

// Ratings
model Rating {
  id: string @id @default(uuid())
  jobId: string
  job: JobRequest @relation(fields: [jobId], references: [id])
  reviewerId: string
  revieweeId: string
  score: int // 1-5
  review: string?
  flagged: boolean @default(false)
  createdAt: DateTime @default(now())
  
  @@unique([jobId, reviewerId])
}

// Payments
model Payment {
  id: string @id @default(uuid())
  jobId: string @unique
  job: JobRequest @relation(fields: [jobId], references: [id])
  stripePaymentIntentId: string
  amount: float
  platformFee: float
  providerAmount: float
  status: PaymentStatus
  authorizedAt: DateTime?
  capturedAt: DateTime?
  createdAt: DateTime @default(now())
}

// Media
model MediaFile {
  id: string @id @default(uuid())
  userId: string
  jobRequestId: string?
  jobRequest: JobRequest? @relation(fields: [jobRequestId], references: [id])
  filename: string
  mimeType: string
  sizeBytes: int
  storageKey: string
  url: string
  thumbnailUrl: string?
  context: MediaContext
  uploadedAt: DateTime @default(now())
}
```

### Data Validation Rules

1. **Email**: Must match RFC 5322 format
2. **Password**: Minimum 8 characters, at least one uppercase, one lowercase, one number
3. **Phone**: E.164 format (e.g., +1234567890)
4. **Zip Code**: 5-digit US format
5. **Rating Score**: Integer between 1 and 5 inclusive
6. **Review Text**: Maximum 500 characters
7. **Job Description**: Minimum 10 characters, maximum 2000 characters
8. **Price Quote**: Positive number, maximum $50,000
9. **Service Area Radius**: Between 1 and 100 miles


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I've identified opportunities to consolidate redundant properties:

- **Authentication properties**: Multiple criteria about session management and password handling can be combined into comprehensive authentication properties
- **Profile display properties**: Several criteria about displaying profile information (3.4, 3.5, 3.7) can be consolidated into a single property about profile data completeness
- **Job status transitions**: Multiple criteria about status changes (2.6, 2.7, 5.3, 5.7) share the same underlying property about state machine correctness
- **Matching engine properties**: Criteria 4.4 and 4.5 both test result count logic and can be combined
- **Rating calculation**: Criteria 3.4 and 6.4 both test average rating calculation and can be unified
- **Dashboard display**: Criteria 10.1 and 10.2 test the same display logic for different user roles

### Authentication and Session Management

Property 1: Account creation completeness
*For any* valid registration data (email, password, role), creating an account should result in a user record with all required fields populated and password properly hashed
**Validates: Requirements 1.1, 1.5**

Property 2: Valid authentication creates sessions
*For any* registered user with valid credentials, authentication should create a valid session token that can be used for subsequent requests
**Validates: Requirements 1.2**

Property 3: Invalid credentials are rejected
*For any* invalid credential combination (wrong password, non-existent email, malformed input), authentication should fail and return an appropriate error
**Validates: Requirements 1.3**

Property 4: Expired sessions require re-authentication
*For any* expired session token, attempting to use it should fail and require the user to re-authenticate
**Validates: Requirements 1.4**

Property 5: Password reset round trip
*For any* registered user, requesting a password reset should generate a valid token that can be used to successfully reset the password
**Validates: Requirements 1.6**

### Problem Submission and AI Diagnosis

Property 6: Description length validation
*For any* problem submission, descriptions with fewer than 10 characters should be rejected, and descriptions with 10 or more characters should be accepted
**Validates: Requirements 2.1**

Property 7: Media file validation
*For any* uploaded file, files in accepted formats (JPEG, PNG, MP4, MOV) under 50MB should be accepted, and files outside these criteria should be rejected
**Validates: Requirements 2.2**

Property 8: Media association with job requests
*For any* uploaded media file, it should be stored in cloud storage and correctly associated with its job request, retrievable via the job request ID
**Validates: Requirements 2.3**

Property 9: DIY solutions contain structured steps
*For any* AI chatbot response with DIY suggestions, the response should contain a list of steps with step numbers and instructions
**Validates: Requirements 2.5**

Property 10: Job status transitions are valid
*For any* job request, status transitions should follow the valid state machine: submitted → ai_diagnosis → (resolved_diy OR pending_match) → matched → accepted → in_progress → completed, with cancelled as a valid transition from any state
**Validates: Requirements 2.6, 2.7, 5.3, 5.7**

### Service Provider Profiles

Property 11: Profile creation requires all fields
*For any* service provider profile creation attempt, profiles missing required fields (business name, contact info, specialties, service area) should be rejected
**Validates: Requirements 3.1**

Property 12: Service specialty validation
*For any* specialty selection, only values from the valid set (HVAC, Plumbing, Electrical, General Maintenance) should be accepted
**Validates: Requirements 3.2**

Property 13: Service area format validation
*For any* service area definition, both zip code lists and radius-based definitions should be accepted as valid formats
**Validates: Requirements 3.3**

Property 14: Average rating calculation accuracy
*For any* set of ratings for a user, the displayed average rating should equal the arithmetic mean of all rating scores
**Validates: Requirements 3.4, 6.4**

Property 15: Profile data completeness
*For any* service provider profile, all provided data (ratings, review count, reviews, photos, license info) should be displayed when present
**Validates: Requirements 3.5, 3.7**

Property 16: Profile updates are persisted
*For any* profile update, the changes should be immediately saved and reflected in subsequent profile retrievals
**Validates: Requirements 3.6**

### Location-Based Matching

Property 17: Geographic matching accuracy
*For any* job request location, the matching engine should only return service providers whose service area includes that location
**Validates: Requirements 4.1**

Property 18: Specialty filtering correctness
*For any* job request with a specific category, matched providers should all have that category in their specialties list
**Validates: Requirements 4.2**

Property 19: Rating-based ranking order
*For any* set of matched providers, they should be ordered by average rating in descending order (highest rated first)
**Validates: Requirements 4.3**

Property 20: Match result count correctness
*For any* matching operation, if 3 or more providers match, at least 3 should be returned; if fewer than 3 match, all matches should be returned
**Validates: Requirements 4.4, 4.5**

### Job Request and Acceptance Workflow

Property 21: Provider selection triggers notification
*For any* homeowner selection of a service provider, a job request notification should be sent to that provider
**Validates: Requirements 5.1**

Property 22: Job request data completeness
*For any* job request received by a provider, it should include all required information: problem details, media uploads, location, and homeowner rating
**Validates: Requirements 5.2**

Property 23: Job acceptance is exclusive
*For any* job request, once accepted by one service provider, it should be locked and prevent acceptance by other providers
**Validates: Requirements 5.6**

Property 24: Declined jobs allow reselection
*For any* job request declined by a provider, the homeowner should be able to select a different provider
**Validates: Requirements 5.4**

Property 25: Timeout notifications are sent
*For any* job request unaccepted for 24 hours, the homeowner should receive a notification with alternative provider suggestions
**Validates: Requirements 5.5**

### Rating System

Property 26: Completion triggers rating prompts
*For any* completed job, both the homeowner and service provider should receive prompts to submit ratings
**Validates: Requirements 6.1**

Property 27: Rating score validation
*For any* rating submission, scores outside the range 1-5 should be rejected, and scores within 1-5 should be accepted
**Validates: Requirements 6.2**

Property 28: Review length validation
*For any* review text, reviews up to 500 characters should be accepted, and reviews exceeding 500 characters should be rejected
**Validates: Requirements 6.3**

Property 29: Ratings are visible on profiles
*For any* user with ratings, those ratings and reviews should be displayed on their profile visible to other users
**Validates: Requirements 6.5**

Property 30: Rating process completion
*For any* job, when both parties have submitted ratings, the rating process should be marked as complete
**Validates: Requirements 6.6**

Property 31: Rating time window enforcement
*For any* rating submission, submissions within 7 days of job completion should be accepted, and submissions after 7 days should be rejected
**Validates: Requirements 6.7**

### Messaging System

Property 32: Job acceptance creates message thread
*For any* accepted job request, a message thread should be created with the homeowner and service provider as participants
**Validates: Requirements 7.1**

Property 33: Message delivery and persistence
*For any* sent message, it should be delivered to the recipient and stored in the conversation history, retrievable in subsequent queries
**Validates: Requirements 7.2, 7.4**

Property 34: Message notifications are displayed
*For any* received message, the recipient should see a notification indicator
**Validates: Requirements 7.3**

Property 35: Message media validation
*For any* media upload in a message, image files up to 10MB should be accepted, and files exceeding 10MB or non-image types should be rejected
**Validates: Requirements 7.5**

Property 36: Timezone conversion accuracy
*For any* message timestamp, it should be displayed in the user's local timezone, correctly converted from UTC storage
**Validates: Requirements 7.6**

Property 37: Thread archival preserves history
*For any* job that is completed or cancelled, the message thread should be marked as archived while maintaining all message history
**Validates: Requirements 7.7**

### Payment System

Property 38: Quote acceptance authorizes payment
*For any* homeowner acceptance of a price quote, a payment authorization should be created on their payment method
**Validates: Requirements 8.3**

Property 39: Completion confirmation triggers payment capture
*For any* homeowner confirmation of job completion, the payment should be captured with platform fees correctly calculated
**Validates: Requirements 8.5**

Property 40: Provider payout calculation
*For any* captured payment, the service provider should receive the payment amount minus the platform transaction fee
**Validates: Requirements 8.6**

Property 41: Payment failures trigger notifications
*For any* failed payment processing, both homeowner and service provider should receive notifications with resolution options
**Validates: Requirements 8.7**

Property 42: Transaction record completeness
*For any* completed payment, a transaction record should be created and stored with all payment details
**Validates: Requirements 8.8**

### Service Provider Verification

Property 43: New providers have pending status
*For any* newly registered service provider, their profile should be marked as "pending verification" until documents are reviewed
**Validates: Requirements 9.2**

Property 44: Verified providers display badge
*For any* service provider whose verification is complete, a "Verified" badge should be displayed on their profile
**Validates: Requirements 9.3**

Property 45: Unverified providers cannot receive jobs
*For any* unverified service provider, they should not appear in matching results or receive job request notifications
**Validates: Requirements 9.4**

Property 46: Document expiration triggers notification
*For any* service provider whose verification documents expire, they should receive a notification requesting updated documents
**Validates: Requirements 9.5**

Property 47: Insurance certificate handling
*For any* service provider, they should be able to upload insurance certificates, and the insurance status should be displayed on their profile
**Validates: Requirements 9.6**

### Dashboard and Job History

Property 48: Dashboard displays all user jobs
*For any* user (homeowner or service provider), their dashboard should display all their job requests with current status
**Validates: Requirements 10.1, 10.2**

Property 49: Status filtering correctness
*For any* job history filtered by status, only jobs matching the selected status should be returned
**Validates: Requirements 10.3**

Property 50: Date range filtering correctness
*For any* job history filtered by date range, only jobs within the specified date range should be returned
**Validates: Requirements 10.4**

Property 51: Job detail completeness
*For any* selected job from history, the detail view should include all information: messages, ratings, and payment information
**Validates: Requirements 10.5**

Property 52: Summary statistics accuracy
*For any* user, dashboard statistics (total jobs, average rating, total spent/earned) should be calculated correctly from their job history
**Validates: Requirements 10.6**

Property 53: Export data completeness
*For any* job history export (CSV or PDF), the exported file should contain all job data in the correct format
**Validates: Requirements 10.7**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input data (400 Bad Request)
   - Missing required fields
   - Invalid format (email, phone, etc.)
   - Out-of-range values
   - File size/type violations

2. **Authentication Errors**: Auth failures (401 Unauthorized, 403 Forbidden)
   - Invalid credentials
   - Expired tokens
   - Insufficient permissions
   - Unverified accounts

3. **Resource Errors**: Missing or conflicting resources (404 Not Found, 409 Conflict)
   - Job request not found
   - User not found
   - Duplicate job acceptance
   - Profile already exists

4. **External Service Errors**: Third-party failures (502 Bad Gateway, 503 Service Unavailable)
   - OpenAI API timeout
   - Cloud storage unavailable
   - Stripe payment failure
   - Email service down

5. **Business Logic Errors**: Invalid operations (422 Unprocessable Entity)
   - Rating after deadline
   - Accepting already-accepted job
   - Cancelling completed job
   - Unverified provider receiving jobs

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    requestId: string
  }
}
```

### Error Handling Strategies

1. **Retry Logic**: Automatic retry with exponential backoff for transient failures
   - OpenAI API calls: 3 retries with 1s, 2s, 4s delays
   - Cloud storage uploads: 2 retries with 2s, 4s delays
   - Payment processing: No automatic retry (manual resolution)

2. **Fallback Mechanisms**:
   - AI chatbot unavailable → Skip AI diagnosis, proceed to provider matching
   - Cloud storage unavailable → Queue uploads for later processing
   - Email service down → Queue notifications for retry

3. **Circuit Breaker**: Prevent cascading failures
   - Open circuit after 5 consecutive failures
   - Half-open after 30 seconds to test recovery
   - Close circuit after 2 successful requests

4. **Graceful Degradation**:
   - Real-time messaging unavailable → Fall back to polling
   - Image thumbnails unavailable → Display placeholder
   - Rating calculation slow → Display cached value with staleness indicator

5. **User-Facing Error Messages**:
   - Technical errors translated to user-friendly language
   - Actionable guidance provided when possible
   - Support contact information for unresolvable errors

## Testing Strategy

### Dual Testing Approach

The UpKeep platform requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library Selection**: fast-check for TypeScript/JavaScript

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: upkeep-platform, Property {N}: {property description}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: upkeep-platform, Property 1: Account creation completeness
describe('Authentication', () => {
  it('should create complete user accounts for valid registration data', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        fc.constantFrom('homeowner', 'service_provider'),
        async (email, password, role) => {
          const user = await authService.register(email, password, role);
          
          expect(user.email).toBe(email);
          expect(user.role).toBe(role);
          expect(user.passwordHash).toBeDefined();
          expect(user.passwordHash).not.toBe(password);
          expect(user.id).toBeDefined();
          expect(user.createdAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Jest with React Testing Library for frontend, Jest for backend

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, null/undefined)
- Error conditions and exception handling
- Integration points between components
- UI component rendering and interactions

**Example Unit Test**:
```typescript
describe('Job Status Transitions', () => {
  it('should transition from submitted to ai_diagnosis', async () => {
    const job = await createJobRequest({
      homeownerId: 'user-123',
      description: 'Leaking pipe under sink',
      category: 'plumbing'
    });
    
    expect(job.status).toBe('submitted');
    
    await jobService.updateJobStatus(job.id, 'ai_diagnosis');
    const updated = await jobService.getJobRequest(job.id);
    
    expect(updated.status).toBe('ai_diagnosis');
  });
  
  it('should reject invalid status transitions', async () => {
    const job = await createJobRequest({ status: 'submitted' });
    
    await expect(
      jobService.updateJobStatus(job.id, 'completed')
    ).rejects.toThrow('Invalid status transition');
  });
});
```

### Integration Testing

**Scope**: End-to-end workflows across multiple services

**Key Workflows to Test**:
1. Complete job flow: submission → AI diagnosis → provider matching → acceptance → completion → rating
2. Payment flow: quote → authorization → completion → capture → payout
3. Messaging flow: thread creation → message exchange → archival
4. Authentication flow: registration → verification → login → session management

**Tools**: Supertest for API testing, Playwright for E2E browser testing

### Test Coverage Goals

- **Unit test coverage**: Minimum 80% code coverage
- **Property test coverage**: All 53 correctness properties implemented
- **Integration test coverage**: All critical user workflows
- **E2E test coverage**: Happy path for each user role

### Testing Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Test Data**: Use factories and fixtures for consistent test data generation
3. **Mocking**: Mock external services (OpenAI, Stripe, cloud storage) in unit tests
4. **Database**: Use separate test database with automatic cleanup between tests
5. **Async Handling**: Properly handle async operations with async/await
6. **Error Testing**: Test both success and failure paths
7. **Performance**: Keep unit tests fast (<100ms each), integration tests reasonable (<5s each)

