# Offline Medical Record System

This application has been converted to an offline setup using local MySQL database and Tesseract OCR.

## Backend Requirements

You need to set up a local backend server that provides the following endpoints:

### API Endpoints

#### Authentication
- `POST /api/auth/signin` - Sign in with email and password
- `POST /api/auth/signup` - Create new user account  
- `GET /api/auth/me` - Get current user info

#### Medical Records
- `GET /api/medical-records` - Get all records for current user
- `POST /api/medical-records` - Create new medical record
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record

#### Doctor Management (Admin)
- `GET /api/doctors` - Get all doctor profiles
- `POST /api/doctors` - Create new doctor profile
- `PUT /api/doctors/:id` - Update doctor profile
- `DELETE /api/doctors/:id` - Delete doctor profile

#### File Upload
- `POST /api/upload` - Upload image file

#### Audit Logs
- `GET /api/audit-logs` - Get audit logs
- `POST /api/audit-logs` - Create audit log entry

### OCR Service Endpoints

Set up a separate OCR service (port 3002) with:

- `POST /api/ocr/extract-text` - Extract text from image using Tesseract
- `POST /api/ocr/extract-fields` - Extract structured fields from text

## Configuration

Update the API URLs in:
- `src/services/apiService.ts` - Main API service (default: http://localhost:3001/api)
- `src/services/localOCRService.ts` - OCR service (default: http://localhost:3002/api)

## Database Schema

Your MySQL database should have tables for:
- users (authentication)
- medical_records (patient data)
- audit_logs (activity tracking)

The API service interfaces are defined in `src/services/apiService.ts` for reference.