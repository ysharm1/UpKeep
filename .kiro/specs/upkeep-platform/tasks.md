# Implementation Plan: UpKeep Platform

## Overview

This implementation plan breaks down the UpKeep platform into discrete, incremental tasks. The approach focuses on building core infrastructure first, then implementing features in order of dependency, with testing integrated throughout. The plan follows a vertical slice approach where each major feature is built end-to-end before moving to the next.

## Tasks

- [x] 1. Project setup and infrastructure
  - Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Set up PostgreSQL database with Prisma ORM
  - Configure environment variables and secrets management
  - Set up testing frameworks (Jest, fast-check, React Testing Library)
  - Configure ESLint, Prettier, and TypeScript strict mode
  - Set up CI/CD pipeline basics
  - _Requirements: All (foundational)_

- [ ] 2. Database schema and models
  - [ ] 2.1 Create Prisma schema for all data models
    - Define User, HomeownerProfile, ServiceProviderProfile models
    - Define JobRequest, Address, Location models
    - Define Conversation, ChatMessage, MessageThread, Message models
    - Define Rating, Payment, MediaFile models
    - Set up relationships and indexes
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_
  
  - [ ] 2.2 Write property test for data model validation
    - **Property 11: Profile creation requires all fields**
    - **Validates: Requirements 3.1**
  
  - [ ] 2.3 Run Prisma migrations and seed test data
    - Create initial migration
    - Create seed script with sample users and profiles
    - _Requirements: All (foundational)_

- [ ] 3. Authentication service implementation
  - [ ] 3.1 Implement user registration with password hashing
    - Create registration endpoint with email, password, role
    - Hash passwords using bcrypt with salt rounds of 12
    - Create user record and profile based on role
    - _Requirements: 1.1, 1.5_
  
  - [ ] 3.2 Write property tests for authentication
    - **Property 1: Account creation completeness**
    - **Property 5: Password reset round trip**
    - **Validates: Requirements 1.1, 1.5, 1.6**
  
  - [ ] 3.3 Implement login with JWT token generation
    - Create login endpoint with credential validation
    - Generate access token (15 min expiry) and refresh token (7 day expiry)
    - Store refresh token in database
    - _Requirements: 1.2_
  
  - [ ] 3.4 Write property tests for session management
    - **Property 2: Valid authentication creates sessions**
    - **Property 3: Invalid credentials are rejected**
    - **Property 4: Expired sessions require re-authentication**
    - **Validates: Requirements 1.2, 1.3, 1.4**
  
  - [ ] 3.5 Implement password reset flow
    - Create password reset request endpoint
    - Generate secure reset token with 1-hour expiry
    - Create password reset confirmation endpoint
    - _Requirements: 1.6_
  
  - [ ] 3.6 Create authentication middleware for protected routes
    - Validate JWT tokens on protected endpoints
    - Extract user information from tokens
    - Handle token expiration and refresh
    - _Requirements: 1.4_

- [ ] 4. Media service implementation
  - [ ] 4.1 Set up cloud storage integration (AWS S3 or GCS)
    - Configure cloud storage client
    - Set up bucket with proper permissions
    - Implement signed URL generation
    - _Requirements: 2.2, 2.3_
  
  - [ ] 4.2 Implement media upload endpoint
    - Create upload endpoint with file validation
    - Validate file types (JPEG, PNG, MP4, MOV)
    - Validate file sizes (50MB for job requests, 10MB for messages)
    - Store files in cloud storage
    - Create MediaFile database records
    - _Requirements: 2.2, 2.3, 7.5_
  
  - [ ] 4.3 Write property tests for media validation
    - **Property 7: Media file validation**
    - **Property 8: Media association with job requests**
    - **Property 35: Message media validation**
    - **Validates: Requirements 2.2, 2.3, 7.5**
  
  - [ ] 4.4 Implement thumbnail generation for images
    - Create image processing pipeline
    - Generate thumbnails on upload
    - Store thumbnails alongside originals
    - _Requirements: 2.2_

- [ ] 5. Checkpoint - Ensure authentication and media services work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Job management service implementation
  - [ ] 6.1 Implement job request creation
    - Create job request endpoint
    - Validate problem description (minimum 10 characters)
    - Associate media files with job request
    - Set initial status to 'submitted'
    - _Requirements: 2.1, 2.3_
  
  - [ ] 6.2 Write property tests for job creation
    - **Property 6: Description length validation**
    - **Validates: Requirements 2.1**
  
  - [ ] 6.3 Implement job status management
    - Create status update endpoint
    - Implement state machine validation for status transitions
    - Valid transitions: submitted → ai_diagnosis → (resolved_diy OR pending_match) → matched → accepted → in_progress → completed
    - Allow cancelled from any state
    - _Requirements: 2.6, 2.7, 5.3, 5.7_
  
  - [ ] 6.4 Write property test for status transitions
    - **Property 10: Job status transitions are valid**
    - **Validates: Requirements 2.6, 2.7, 5.3, 5.7**
  
  - [ ] 6.5 Implement job retrieval and history
    - Create endpoint to get single job by ID
    - Create endpoint to get job history with filters (status, date range)
    - Implement pagination for job lists
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 6.6 Write property tests for job history
    - **Property 48: Dashboard displays all user jobs**
    - **Property 49: Status filtering correctness**
    - **Property 50: Date range filtering correctness**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 7. AI chatbot service implementation
  - [ ] 7.1 Set up OpenAI API integration
    - Configure OpenAI client with API key
    - Create system prompts for home repair diagnostics
    - Include safety guidelines in prompts
    - _Requirements: 2.4, 2.5_
  
  - [ ] 7.2 Implement problem analysis endpoint
    - Create endpoint that accepts description, category, and media URLs
    - Call OpenAI GPT-4 API with problem details
    - Use GPT-4 Vision for image analysis
    - Parse response into structured DIY steps
    - Store conversation in database
    - _Requirements: 2.4, 2.5_
  
  - [ ] 7.3 Write property test for DIY response structure
    - **Property 9: DIY solutions contain structured steps**
    - **Validates: Requirements 2.5**
  
  - [ ] 7.4 Implement conversation management
    - Create endpoint for follow-up questions
    - Maintain conversation context
    - Implement conversation end with resolution status
    - _Requirements: 2.4, 2.6, 2.7_

- [ ] 8. Service provider profile management
  - [ ] 8.1 Implement profile creation for service providers
    - Create profile endpoint with required fields validation
    - Validate business name, contact info, specialties, service area
    - Set initial verification status to 'pending'
    - _Requirements: 3.1, 9.1, 9.2_
  
  - [ ] 8.2 Write property tests for profile validation
    - **Property 12: Service specialty validation**
    - **Property 13: Service area format validation**
    - **Property 43: New providers have pending status**
    - **Validates: Requirements 3.2, 3.3, 9.2**
  
  - [ ] 8.3 Implement profile update and retrieval
    - Create profile update endpoint with validation
    - Create profile retrieval endpoint
    - Include ratings, reviews, and verification status
    - _Requirements: 3.6, 3.7_
  
  - [ ] 8.4 Write property test for profile updates
    - **Property 16: Profile updates are persisted**
    - **Validates: Requirements 3.6**
  
  - [ ] 8.5 Implement verification document upload
    - Create endpoint for license and insurance document upload
    - Store documents securely
    - Update verification status
    - _Requirements: 9.1, 9.6_
  
  - [ ] 8.6 Write property tests for verification
    - **Property 44: Verified providers display badge**
    - **Property 45: Unverified providers cannot receive jobs**
    - **Property 47: Insurance certificate handling**
    - **Validates: Requirements 9.3, 9.4, 9.6**

- [ ] 9. Checkpoint - Ensure job and profile services work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Matching engine implementation
  - [ ] 10.1 Set up PostGIS for geographic queries
    - Install PostGIS extension in PostgreSQL
    - Add geographic indexes to location data
    - _Requirements: 4.1_
  
  - [ ] 10.2 Implement location-based matching
    - Create matching endpoint that accepts job request
    - Query providers whose service area includes job location
    - Support both radius-based and zip code-based service areas
    - _Requirements: 4.1_
  
  - [ ] 10.3 Write property test for geographic matching
    - **Property 17: Geographic matching accuracy**
    - **Validates: Requirements 4.1**
  
  - [ ] 10.4 Implement specialty filtering and ranking
    - Filter matched providers by service specialty
    - Rank providers by rating (0.5), distance (0.3), response time (0.2)
    - Return top 5 matches
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 10.5 Write property tests for matching logic
    - **Property 18: Specialty filtering correctness**
    - **Property 19: Rating-based ranking order**
    - **Property 20: Match result count correctness**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
  
  - [ ] 10.6 Implement provider notification system
    - Send notifications to matched providers
    - Track notification delivery
    - _Requirements: 5.1_

- [ ] 11. Job request and acceptance workflow
  - [ ] 11.1 Implement provider selection by homeowner
    - Create endpoint for homeowner to select provider
    - Update job status to 'matched'
    - Send notification to selected provider
    - _Requirements: 5.1_
  
  - [ ] 11.2 Write property test for provider selection
    - **Property 21: Provider selection triggers notification**
    - **Validates: Requirements 5.1**
  
  - [ ] 11.3 Implement job acceptance by provider
    - Create acceptance endpoint for providers
    - Validate provider can accept (job not already accepted)
    - Update job status to 'accepted'
    - Lock job to prevent other acceptances
    - Notify homeowner
    - _Requirements: 5.3, 5.6_
  
  - [ ] 11.4 Write property tests for job acceptance
    - **Property 23: Job acceptance is exclusive**
    - **Validates: Requirements 5.6**
  
  - [ ] 11.5 Implement job decline and cancellation
    - Create decline endpoint for providers
    - Create cancellation endpoint for both parties
    - Update job status appropriately
    - Send notifications
    - _Requirements: 5.4, 5.7_
  
  - [ ] 11.6 Write property tests for workflow transitions
    - **Property 24: Declined jobs allow reselection**
    - **Validates: Requirements 5.4**
  
  - [ ] 11.7 Implement timeout handling for unaccepted jobs
    - Create background job to check for jobs unaccepted after 24 hours
    - Send notifications with alternative providers
    - _Requirements: 5.5_

- [ ] 12. Messaging system implementation
  - [ ] 12.1 Set up Socket.io for WebSocket connections
    - Configure Socket.io server
    - Implement connection authentication
    - Set up room-based messaging
    - _Requirements: 7.2_
  
  - [ ] 12.2 Implement message thread creation
    - Create thread when job is accepted
    - Associate thread with job, homeowner, and provider
    - _Requirements: 7.1_
  
  - [ ] 12.3 Write property test for thread creation
    - **Property 32: Job acceptance creates message thread**
    - **Validates: Requirements 7.1**
  
  - [ ] 12.4 Implement message sending and delivery
    - Create message send endpoint (REST and WebSocket)
    - Store messages in database
    - Deliver messages in real-time via WebSocket
    - Fall back to polling if WebSocket unavailable
    - _Requirements: 7.2, 7.4_
  
  - [ ] 12.5 Write property tests for messaging
    - **Property 33: Message delivery and persistence**
    - **Property 34: Message notifications are displayed**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [ ] 12.6 Implement message thread retrieval and archival
    - Create endpoint to get thread by ID
    - Create endpoint to get all threads for user
    - Implement read receipts
    - Archive threads when job completes or cancels
    - _Requirements: 7.4, 7.7_
  
  - [ ] 12.7 Write property test for thread archival
    - **Property 37: Thread archival preserves history**
    - **Validates: Requirements 7.7**
  
  - [ ] 12.8 Implement timezone handling for timestamps
    - Store all timestamps in UTC
    - Convert to user's local timezone on display
    - _Requirements: 7.6_

- [ ] 13. Checkpoint - Ensure matching and messaging work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Rating system implementation
  - [ ] 14.1 Implement rating submission
    - Create rating submission endpoint
    - Validate score is between 1-5
    - Validate review text is max 500 characters
    - Validate submission is within 7 days of completion
    - Store rating in database
    - _Requirements: 6.2, 6.3, 6.7_
  
  - [ ] 14.2 Write property tests for rating validation
    - **Property 27: Rating score validation**
    - **Property 28: Review length validation**
    - **Property 31: Rating time window enforcement**
    - **Validates: Requirements 6.2, 6.3, 6.7**
  
  - [ ] 14.3 Implement rating calculation and display
    - Calculate average rating after each submission
    - Update user profile with new average
    - Display ratings and reviews on profiles
    - _Requirements: 3.4, 6.4, 6.5_
  
  - [ ] 14.4 Write property test for rating calculation
    - **Property 14: Average rating calculation accuracy**
    - **Validates: Requirements 3.4, 6.4**
  
  - [ ] 14.5 Implement rating prompts and completion tracking
    - Trigger rating prompts when job is completed
    - Track which parties have submitted ratings
    - Mark rating process complete when both submit
    - _Requirements: 6.1, 6.6_
  
  - [ ] 14.6 Write property tests for rating workflow
    - **Property 26: Completion triggers rating prompts**
    - **Property 30: Rating process completion**
    - **Validates: Requirements 6.1, 6.6**

- [ ] 15. Payment system implementation
  - [ ] 15.1 Set up Stripe integration
    - Configure Stripe API client
    - Set up webhook endpoints for payment events
    - Create Stripe customer records for users
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 15.2 Implement price quote workflow
    - Create endpoint for provider to submit quote
    - Create endpoint for homeowner to view and accept quote
    - Display quote with acceptance/negotiation options
    - _Requirements: 8.1, 8.2_
  
  - [ ] 15.3 Implement payment authorization
    - Create payment intent when quote is accepted
    - Authorize hold on homeowner's payment method
    - Store authorization with 7-day expiry
    - _Requirements: 8.3_
  
  - [ ] 15.4 Write property test for payment authorization
    - **Property 38: Quote acceptance authorizes payment**
    - **Validates: Requirements 8.3**
  
  - [ ] 15.5 Implement payment capture and payout
    - Create endpoint for provider to mark job complete
    - Request homeowner confirmation
    - Capture payment on confirmation
    - Calculate platform fee (15%)
    - Transfer funds to provider account
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [ ] 15.6 Write property tests for payment processing
    - **Property 39: Completion confirmation triggers payment capture**
    - **Property 40: Provider payout calculation**
    - **Validates: Requirements 8.5, 8.6**
  
  - [ ] 15.7 Implement payment error handling
    - Handle payment failures gracefully
    - Notify both parties of failures
    - Provide resolution options
    - _Requirements: 8.7_
  
  - [ ] 15.8 Write property test for payment failures
    - **Property 41: Payment failures trigger notifications**
    - **Validates: Requirements 8.7**
  
  - [ ] 15.9 Implement transaction history
    - Store all payment transactions
    - Create endpoint to retrieve transaction history
    - _Requirements: 8.8, 10.6_

- [ ] 16. Dashboard and statistics implementation
  - [ ] 16.1 Implement dashboard data aggregation
    - Create endpoint for homeowner dashboard
    - Create endpoint for provider dashboard
    - Aggregate job counts, statuses, and recent activity
    - _Requirements: 10.1, 10.2_
  
  - [ ] 16.2 Implement summary statistics calculation
    - Calculate total jobs for user
    - Calculate average rating
    - Calculate total spent (homeowner) or earned (provider)
    - _Requirements: 10.6_
  
  - [ ] 16.3 Write property test for statistics
    - **Property 52: Summary statistics accuracy**
    - **Validates: Requirements 10.6**
  
  - [ ] 16.3 Implement job history export
    - Create CSV export endpoint
    - Create PDF export endpoint
    - Include all job data in exports
    - _Requirements: 10.7_
  
  - [ ] 16.4 Write property test for export completeness
    - **Property 53: Export data completeness**
    - **Validates: Requirements 10.7**

- [ ] 17. Checkpoint - Ensure payment and dashboard work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Frontend - Authentication UI
  - [ ] 18.1 Create registration page
    - Build registration form with email, password, role selection
    - Implement client-side validation
    - Connect to registration API
    - Handle success and error states
    - _Requirements: 1.1_
  
  - [ ] 18.2 Create login page
    - Build login form with email and password
    - Implement client-side validation
    - Connect to login API
    - Store JWT tokens securely
    - Redirect based on user role
    - _Requirements: 1.2_
  
  - [ ] 18.3 Create password reset flow
    - Build password reset request page
    - Build password reset confirmation page
    - Connect to password reset APIs
    - _Requirements: 1.6_
  
  - [ ] 18.4 Implement authentication context and protected routes
    - Create React context for auth state
    - Implement route guards for protected pages
    - Handle token refresh
    - _Requirements: 1.4_

- [ ] 19. Frontend - Homeowner problem submission flow
  - [ ] 19.1 Create problem submission form
    - Build form with description textarea
    - Implement character count (minimum 10)
    - Add category selection dropdown
    - _Requirements: 2.1_
  
  - [ ] 19.2 Implement media upload component
    - Build drag-and-drop file upload
    - Show upload progress
    - Display uploaded media thumbnails
    - Validate file types and sizes
    - _Requirements: 2.2_
  
  - [ ] 19.3 Create AI chatbot interface
    - Build chat UI with message history
    - Display DIY steps in structured format
    - Show safety warnings prominently
    - Implement "Problem Resolved" and "Need Professional" buttons
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [ ] 20. Frontend - Service provider matching and selection
  - [ ] 20.1 Create provider match results page
    - Display matched providers in cards
    - Show provider rating, distance, specialties
    - Show verification badges
    - Implement provider selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 20.2 Create provider profile view
    - Display full provider details
    - Show ratings and reviews
    - Show service area map
    - Display license and insurance info
    - _Requirements: 3.4, 3.5, 3.7_

- [ ] 21. Frontend - Service provider dashboard and profile
  - [ ] 21.1 Create provider profile management page
    - Build profile form with all required fields
    - Implement service area configuration (radius or zip codes)
    - Add specialty selection
    - Upload profile photo
    - _Requirements: 3.1, 3.2, 3.3, 3.6_
  
  - [ ] 21.2 Create verification document upload
    - Build document upload interface
    - Show verification status
    - Display expiration warnings
    - _Requirements: 9.1, 9.5, 9.6_
  
  - [ ] 21.3 Create provider job request inbox
    - Display incoming job requests
    - Show job details with media
    - Implement accept/decline actions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 22. Frontend - Messaging interface
  - [ ] 22.1 Create message thread list
    - Display all message threads
    - Show unread indicators
    - Show last message preview
    - Filter archived threads
    - _Requirements: 7.4, 7.7_
  
  - [ ] 22.2 Create message thread view
    - Display message history
    - Show timestamps in local timezone
    - Display media in messages
    - Implement real-time message updates
    - _Requirements: 7.2, 7.4, 7.6_
  
  - [ ] 22.3 Create message composition
    - Build message input with send button
    - Implement media upload in messages
    - Show typing indicators
    - Handle send errors
    - _Requirements: 7.2, 7.5_

- [ ] 23. Frontend - Payment and booking flow
  - [ ] 23.1 Create price quote interface
    - Provider: form to submit quote
    - Homeowner: display quote with accept/negotiate options
    - _Requirements: 8.1, 8.2_
  
  - [ ] 23.2 Implement payment method management
    - Add payment method form (Stripe Elements)
    - Display saved payment methods
    - _Requirements: 8.3_
  
  - [ ] 23.3 Create job completion confirmation
    - Provider: button to mark complete
    - Homeowner: confirmation dialog
    - Display payment processing status
    - _Requirements: 8.4, 8.5_

- [ ] 24. Frontend - Rating and review interface
  - [ ] 24.1 Create rating submission modal
    - Display after job completion
    - Star rating selector (1-5)
    - Review text area (max 500 chars)
    - Submit button
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 24.2 Create ratings display component
    - Show average rating with stars
    - Display review count
    - List individual reviews
    - _Requirements: 6.5_

- [ ] 25. Frontend - Dashboard and job history
  - [ ] 25.1 Create homeowner dashboard
    - Display active jobs with status
    - Show summary statistics
    - Quick access to recent messages
    - _Requirements: 10.1, 10.6_
  
  - [ ] 25.2 Create provider dashboard
    - Display active jobs with status
    - Show earnings summary
    - Show average rating
    - Quick access to job requests
    - _Requirements: 10.2, 10.6_
  
  - [ ] 25.3 Create job history page
    - Display all jobs in table/list
    - Implement status filter
    - Implement date range filter
    - Pagination
    - _Requirements: 10.3, 10.4_
  
  - [ ] 25.4 Create job detail view
    - Display complete job information
    - Show message history
    - Show ratings
    - Show payment details
    - _Requirements: 10.5_
  
  - [ ] 25.5 Implement job history export
    - Add export buttons (CSV, PDF)
    - Trigger download on click
    - _Requirements: 10.7_

- [ ] 26. Final integration and polish
  - [ ] 26.1 Implement error boundaries and error pages
    - Create 404 page
    - Create 500 error page
    - Add error boundaries to catch React errors
    - Display user-friendly error messages
  
  - [ ] 26.2 Add loading states and skeletons
    - Add loading spinners for async operations
    - Create skeleton screens for data loading
    - Implement optimistic UI updates
  
  - [ ] 26.3 Implement responsive design
    - Test all pages on mobile, tablet, desktop
    - Adjust layouts for different screen sizes
    - Ensure touch-friendly interactions on mobile
  
  - [ ] 26.4 Add accessibility features
    - Ensure keyboard navigation works
    - Add ARIA labels
    - Test with screen readers
    - Ensure color contrast meets WCAG standards
  
  - [ ] 26.5 Performance optimization
    - Implement code splitting
    - Optimize images and media
    - Add caching headers
    - Minimize bundle sizes

- [ ] 27. Final checkpoint - End-to-end testing
  - Run complete user flows for both homeowner and provider
  - Verify all property tests pass
  - Verify all unit tests pass
  - Check test coverage meets 80% minimum
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All property-based tests are required for comprehensive quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples, edge cases, and error conditions
- Frontend tasks focus on user-facing features and integrate with backend APIs
- The implementation follows a vertical slice approach: backend → frontend for each feature
- External service integrations (OpenAI, Stripe, cloud storage) should be mocked in tests

