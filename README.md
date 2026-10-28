# FarmLink — Direct Agricultural Commerce

FarmLink is a contemporary, production-minded direct agricultural commerce platform connecting farmers directly with households, restaurants, grocers, wholesalers, food-processing companies, and institutions. Farmers can manage produce, inventory, orders, and revenue, while buyers discover fresh produce and purchase directly from farmers. Built with Next.js, FastAPI, and PostgreSQL, FarmLink makes agricultural trade simpler, smarter, and more transparent.

---

## 🌾 Platform Architecture & Core Roles

### 1. Authorization Roles
FarmLink enforces three distinct authorization roles:
- **Farmer**: Producers listing fresh harvest batches, defining available volume, setting minimum order units, and tracking direct payouts.
- **Buyer**: Purchasers ordering produce directly from regional farms.
- **Admin**: Platform overseers auditing farm certifications, origin traceability, dispute resolution, and compliance.

### 2. Buyer Profile Attributes
Buyers dynamically classify their organization via a profile attribute (not separate authorization roles) to configure appropriate order minimums, cold-chain logistics, and invoicing:
1. **Household** (Consumer small batches, doorstep delivery)
2. **Restaurant** (Commercial kitchens, scheduled daily/weekly harvests)
3. **Retailer** (Specialty & organic grocers, recurring boxed inventory)
4. **Wholesaler** (Regional distributors, pallet volume and freight routing)
5. **Company** (Food processors, multi-ton industrial crop supply contracts)
6. **Institution** (Hospitals, schools, and public cafeterias)

---

## 🛠️ Technology Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router, React 19) | Server and client rendered UI, optimized image delivery |
| **Language** | TypeScript | Strong typing across models, props, and API payloads |
| **Styling** | Tailwind CSS | Design tokens: Forest green (`#1B4332`), Warm ivory (`#FCFBF7`), Terracotta (`#C46B44`) |
| **Backend** | Python 3.13 + FastAPI | High-performance asynchronous REST API |
| **ORM / Data** | SQLAlchemy 2.0 | Declarative database models, migrations, and relationship mapping |
| **Database** | PostgreSQL | Relational storage for transactions, inventory, and users |

---

## 📂 Project Structure

```text
farmlink/
├── frontend/                     # Next.js App Router application
│   ├── src/
│   │   ├── app/                  # App routes, global styling, layout
│   │   ├── components/
│   │   │   ├── ui/               # Reusable primitives (Button, Input, Badge, Card, ImageFallback)
│   │   │   ├── layout/           # Navbar, Footer, Container
│   │   │   ├── marketplace/      # ProduceCard, filters
│   │   │   ├── common/           # RoleContextBanner
│   │   │   └── auth/             # Accessible registration and onboarding flows
│   │   ├── lib/                  # Constants, mock catalog, and utilities
│   │   └── types/                # Domain models (Roles, Buyer Categories, Produce Items)
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
│
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── api/                  # API v1 routers & endpoints (health, auth, products, users)
│   │   ├── core/                 # Config (Pydantic Settings) and SQLAlchemy database session
│   │   ├── models/               # SQLAlchemy models (User, Product, Enums)
│   │   └── schemas/              # Pydantic validation schemas
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).
Health check available at [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health).

---

## 🧪 Verification & Status Checks

- **Frontend Typecheck & Build**: Run `npm run build` in `frontend/`.
- **Frontend Linter**: Run `npm run lint` in `frontend/`.
- **Backend Health Check**: `GET /api/v1/health` transparently reports database status without crashing if PostgreSQL is not yet started.
