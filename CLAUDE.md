
You are building an MVP web platform called "OPENwork" — a trust-based freelance marketplace for teenagers with built-in safety systems.

## CORE IDEA
This is NOT a regular freelance platform.

This is a "trust infrastructure" where:
- payments are protected (escrow)
- work is provable (proof-of-work)
- conflicts are resolvable
- minors are protected

Users can BOTH:
- buy services
- sell services

No fixed roles.

---

## MAIN USER TYPES

1. Teen users (13–17)
2. Adult users (clients)
3. Parents (linked to teen accounts)

---

## KEY SYSTEMS

### 1. Escrow System
- User pays → money is locked
- Released only after approval

### 2. Milestone System
- Tasks split into stages
- Partial payments per stage

### 3. Proof-of-Work
- All submissions stored with timestamp
- Version history

### 4. Dispute System
- If conflict:
  - compare requirements vs result
  - admin/logic resolves outcome

### 5. Safety Layer
- No external contact sharing
- Chat moderation
- AI risk detection (basic keyword system for MVP)

### 6. Parent Control
- View transactions
- Set limits
- Block users
- Receive alerts ONLY on risk

### 7. Panic Button
- Instantly:
  - freeze transaction
  - block chat
  - notify parent

---

## PAGES STRUCTURE

### 1. AUTH / REGISTRATION PAGE
- Sign up / login
- ID verification (mock)
- If under 18:
  - link parent (email/phone verification)

---

### 2. HOME PAGE
- Tabs:
  - Browse Services
  - My Services
- Search bar
- Categories

---

### 3. SERVICE LISTING PAGE
- List of services
- Filters:
  - price
  - category
  - rating

---

### 4. SERVICE DETAIL PAGE
- Description
- Price
- Milestones
- Reviews
- "Order" button

---

### 5. CREATE SERVICE PAGE
- Title
- Description
- Price
- Milestones
- Deliverable format

---

### 6. DASHBOARD
Tabs:
- My Orders (as buyer)
- My Work (as seller)

---

### 7. TRANSACTION PAGE (CORE PAGE)
- Status (active / completed / disputed)
- Milestones
- Chat
- Upload result
- Approve / Dispute buttons

---

### 8. CHAT SYSTEM
- Inside transaction only
- No links / contacts allowed (basic filter)

---

### 9. PARENT DASHBOARD
- Child balance
- Transactions
- Limit settings
- Block user button

---

### 10. PROFILE PAGE
- Rating
- Completed jobs
- Trust score

---

## DATABASE STRUCTURE (SIMPLE)

Users:
- id
- age
- is_minor
- parent_id (optional)

Services:
- id
- owner_id
- title
- price

Transactions:
- id
- buyer_id
- seller_id
- status
- escrow_amount

Milestones:
- transaction_id
- title
- amount
- status

Messages:
- transaction_id
- sender_id
- text

---

## DEVELOPMENT PRIORITY (MVP ROADMAP)

STEP 1:
- Auth system
- User model

STEP 2:
- Create / browse services

STEP 3:
- Transaction creation

STEP 4:
- Escrow logic (simulate payments)

STEP 5:
- Milestones

STEP 6:
- Chat system

STEP 7:
- File upload (proof-of-work)

STEP 8:
- Approve / dispute flow

STEP 9:
- Parent dashboard (basic)

STEP 10:
- Safety features:
  - keyword filter
  - panic button

---

## TECH STACK (SIMPLE)

Frontend:
- React / Next.js

Backend:
- Node.js / Express

Database:
- Firebase / MongoDB

---

## UX PRINCIPLES

- Minimalistic (like Kaspi)
- No complex flows
- Everything clear in 1–2 clicks

---

## IMPORTANT

Do NOT over-engineer.

Focus on:
- working flows
- clean UI
- core trust mechanics

Ignore:
- payments integration (mock it)
- advanced AI (just simulate)

---

Build a working MVP with clean structure and logical navigation.