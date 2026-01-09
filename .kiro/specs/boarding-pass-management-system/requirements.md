# Requirements Document

## Introduction

The Boarding Pass Management System is a production-ready web application that processes real boarding pass PDFs, extracts IATA BCBP data from barcodes, generates Google Wallet passes, and delivers branded PDF documents to clients. The system must handle real data only, with no mock or demo functionality, and maintain strict security and compliance standards.

## Glossary

- **System**: The Boarding Pass Management System
- **Agent**: Authenticated user who processes boarding passes
- **Passenger**: End user who receives the processed boarding pass
- **IATA_BCBP**: International Air Transport Association Bar Coded Boarding Pass standard
- **Google_Wallet**: Google's digital wallet service for storing passes
- **PDF_Processor**: Component that extracts data from PDF files
- **Barcode_Analyzer**: Component that decodes IATA BCBP barcodes
- **Wallet_Generator**: Component that creates Google Wallet passes
- **Email_Service**: Component that sends emails with attachments
- **Audit_Logger**: Component that tracks all system operations

## Requirements

### Requirement 1: Agent Authentication and Authorization

**User Story:** As a system administrator, I want secure agent authentication, so that only authorized personnel can process boarding passes.

#### Acceptance Criteria

1. WHEN an agent attempts to login, THE System SHALL validate credentials against the configured authentication provider
2. WHEN authentication succeeds, THE System SHALL generate a JWT token with 8-hour expiration
3. WHEN a JWT token expires, THE System SHALL require re-authentication
4. THE System SHALL implement role-based access control with agent and admin roles
5. WHEN an agent logs out, THE System SHALL invalidate the JWT token immediately

### Requirement 2: PDF Upload and Validation

**User Story:** As an agent, I want to upload boarding pass PDFs, so that I can process them for passengers.

#### Acceptance Criteria

1. WHEN an agent uploads a file, THE System SHALL validate it is a PDF format
2. WHEN a PDF is uploaded, THE System SHALL check file size does not exceed 20MB
3. WHEN a PDF is invalid, THE System SHALL return a descriptive error message
4. THE System SHALL store uploaded PDFs in a secure directory with unique identifiers
5. WHEN a PDF is successfully uploaded, THE System SHALL return an upload confirmation with file ID

### Requirement 3: Barcode Detection and IATA BCBP Parsing

**User Story:** As an agent, I want automatic barcode detection from PDFs, so that boarding pass data is extracted accurately.

#### Acceptance Criteria

1. WHEN a PDF is processed, THE PDF_Processor SHALL convert it to images using pdfium or pdf2image
2. WHEN images are generated, THE Barcode_Analyzer SHALL detect barcodes using zxing-cpp library
3. IF zxing-cpp fails, THEN THE System SHALL fallback to OpenCV barcode detection
4. WHEN a barcode is detected, THE System SHALL parse it according to IATA BCBP Resolution 792 standard
5. WHEN IATA BCBP parsing succeeds, THE System SHALL extract passenger name, flight number, route, date, seat, and gate information
6. WHEN no valid barcode is found, THE System SHALL return an error indicating barcode detection failure

### Requirement 4: Google Wallet Pass Generation

**User Story:** As an agent, I want to generate Google Wallet passes, so that passengers can add boarding passes to their mobile wallets.

#### Acceptance Criteria

1. WHEN boarding pass data is extracted, THE Wallet_Generator SHALL create a Google Wallet pass using the official API
2. THE System SHALL use JWT RS256 authentication with Google Wallet API
3. WHEN a wallet pass is created, THE System SHALL return a secure add-to-wallet URL
4. THE System SHALL store Google Wallet credentials securely on the backend only
5. WHEN wallet generation fails, THE System SHALL log the error and return a user-friendly message

### Requirement 5: Branded PDF Generation

**User Story:** As an agent, I want to generate minimalist branded PDFs, so that passengers receive professional documents with anyway.ro branding.

#### Acceptance Criteria

1. WHEN boarding pass data is available, THE System SHALL generate a clean, minimalist PDF design
2. THE System SHALL include anyway.ro branding elements in the generated PDF
3. WHEN generating PDFs, THE System SHALL include all essential flight information in a readable format
4. THE System SHALL optimize PDF size for email delivery
5. WHEN PDF generation completes, THE System SHALL store the branded PDF with a unique identifier

### Requirement 6: Email Delivery System

**User Story:** As an agent, I want to send boarding passes via email, so that passengers receive their documents and wallet links.

#### Acceptance Criteria

1. WHEN an agent initiates email sending, THE Email_Service SHALL validate the recipient email address
2. WHEN sending emails, THE System SHALL attach the branded PDF document
3. WHEN sending emails, THE System SHALL include the Google Wallet add-to-wallet link in the message body
4. THE System SHALL use configured SMTP settings for email delivery
5. WHEN email delivery fails, THE System SHALL retry up to 3 times with exponential backoff

### Requirement 7: Audit Logging and Compliance

**User Story:** As a system administrator, I want comprehensive audit logging, so that all operations are tracked for compliance and security.

#### Acceptance Criteria

1. WHEN any system operation occurs, THE Audit_Logger SHALL record the action with timestamp and agent ID
2. WHEN files are uploaded, THE System SHALL log file metadata and processing results
3. WHEN emails are sent, THE System SHALL log recipient, delivery status, and timestamp
4. THE System SHALL retain audit logs for 90 days minimum
5. WHEN audit log queries are made, THE System SHALL provide searchable and filterable results

### Requirement 8: Security and Rate Limiting

**User Story:** As a system administrator, I want security controls and rate limiting, so that the system is protected from abuse and unauthorized access.

#### Acceptance Criteria

1. THE System SHALL implement rate limiting of 100 requests per 15 minutes per IP address
2. WHEN rate limits are exceeded, THE System SHALL return HTTP 429 status with retry-after header
3. THE System SHALL validate all input data to prevent injection attacks
4. THE System SHALL use HTTPS for all communications
5. WHEN security violations are detected, THE System SHALL log the incident and block the source IP

### Requirement 9: Real Data Processing Only

**User Story:** As a system administrator, I want the system to process only real boarding pass data, so that no mock or demo data compromises production integrity.

#### Acceptance Criteria

1. THE System SHALL process only real PDF files uploaded by agents
2. THE System SHALL extract data only from actual IATA BCBP barcodes
3. WHEN no real data is available, THE System SHALL display appropriate "no data" messages
4. THE System SHALL never generate, create, or use mock boarding pass data
5. WHEN testing is required, THE System SHALL use real boarding pass samples only

### Requirement 10: Modular Architecture

**User Story:** As a developer, I want a modular system architecture, so that components can be maintained and extended independently.

#### Acceptance Criteria

1. THE System SHALL implement separate modules for Agent Auth, Passenger Context, Barcode Analyzer, Wallet Generator, and Email Service
2. WHEN modules communicate, THE System SHALL use well-defined interfaces
3. THE System SHALL allow module replacement without affecting other components
4. WHEN errors occur in one module, THE System SHALL isolate failures to prevent system-wide crashes
5. THE System SHALL provide health check endpoints for each major module

### Requirement 11: TypeScript Implementation

**User Story:** As a developer, I want TypeScript with strict mode, so that the codebase is type-safe and maintainable.

#### Acceptance Criteria

1. THE System SHALL be implemented using TypeScript with strict mode enabled
2. THE System SHALL use Fastify or NestJS framework for the web server
3. WHEN code is compiled, THE System SHALL produce no TypeScript errors or warnings
4. THE System SHALL define interfaces for all data structures and API contracts
5. THE System SHALL use proper error handling with typed exceptions

### Requirement 12: Configuration Management

**User Story:** As a system administrator, I want centralized configuration management, so that system settings can be managed securely.

#### Acceptance Criteria

1. THE System SHALL load configuration from environment variables
2. WHEN Google Wallet credentials are provided, THE System SHALL enable wallet functionality
3. WHEN SMTP settings are provided, THE System SHALL enable email functionality
4. THE System SHALL validate all required configuration on startup
5. WHEN configuration is invalid, THE System SHALL fail to start with descriptive error messages