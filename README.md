# Personal Recipe Card CRUD Web System

**Mulungushi University — School of Engineering and Technology**  
**Department of Computer Science**  
**Course:** ICT251 (Web Applications & Systems)  
**Assignment:** Activity 4 — Single-Table CRUD App Using Node.js  
**Selected Question:** Question 2 — Personal Recipe Card (`resource: recipes`, `table: recipes`)

---

## 1. Project Overview

This repository implements a full-stack, single-table CRUD (Create, Read, Update, Delete) web system built with **Node.js**, **Express.js**, **MySQL** (with automated **SQLite** zero-config fallback), **HTML5**, **CSS3**, and modern **vanilla JavaScript (ES6+ Fetch API)**.

### Features
- **Full CRUD REST API**: Exposes standard endpoints (`GET /api/recipes`, `GET /api/recipes/:id`, `POST /api/recipes`, `PUT /api/recipes/:id`, `DELETE /api/recipes/:id`).
- **Relational Database Design**: Single-table relational schema containing primary key `id`, auto-increment, timestamps (`created_at`, `updated_at`), and 8 domain-specific fields.
- **Seeded Dataset**: 10 pre-loaded gourmet and traditional recipes spanning Zambian, Italian, Indian, Mexican, Japanese, Greek, Thai, American, and French cuisines.
- **Modern Responsive Frontend**: Card-based interface with live search filtering, cuisine dropdown, create/update form toggle, detail inspection modal, and toast feedback alerts.
- **Dual Database Flexibility**: Configured for MySQL (XAMPP/MariaDB) with automated fallback to Node.js's native SQLite engine so it can run immediately without requiring local database servers.
- **Postman Collection Included**: Complete v2.1 collection ready for endpoint verification and video demonstration.

---

## 2. Project Directory Structure

```text
node-mysql-crud/
├── backend/
│   ├── .env                       # Environment configuration (ignored in git)
│   ├── .env.example               # Template environment configuration
│   ├── db.js                      # Database connection pool & query handler
│   ├── package.json               # Dependencies and start scripts
│   ├── schema.sql                 # SQL table definition & 10 seed records
│   └── server.js                  # Express application, routes & controllers
├── frontend/
│   ├── app.js                     # Frontend API consumer (Fetch API)
│   ├── index.html                 # Single-page user interface
│   └── style.css                  # Responsive UI styling
├── postman/
│   └── Personal_Recipe_Card_API.postman_collection.json  # Postman test suite
├── .gitignore                     # Git ignore rules for node_modules & secrets
└── README.md                      # Comprehensive documentation
```

---

## 3. Database Schema (`recipes`)

| Column Name | Data Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `INTEGER` | `PRIMARY KEY AUTO_INCREMENT` | Unique identifier |
| `title` | `VARCHAR(150)` | `NOT NULL` | Name of the recipe |
| `cuisine` | `VARCHAR(100)` | `NOT NULL` | Cultural origin (e.g., Zambian, Italian) |
| `category` | `VARCHAR(60)` | `NOT NULL` | Meal type (e.g., Main Course, Breakfast) |
| `prep_time_minutes`| `INT` | `NOT NULL` | Preparation duration in minutes |
| `cook_time_minutes`| `INT` | `NOT NULL` | Cooking duration in minutes |
| `servings` | `INT` | `NOT NULL` | Number of servings yielded |
| `ingredients` | `TEXT` | `NOT NULL` | Detailed list of ingredients |
| `instructions` | `TEXT` | `NOT NULL` | Step-by-step preparation directions |
| `difficulty` | `VARCHAR(20)` | `DEFAULT 'Medium'` | Easy, Medium, or Hard |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

---

## 4. REST API Endpoint Specification

All responses are returned in `application/json` format.

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recipes` | Retrieve list of all recipes (supports `?search=`, `?cuisine=`) | `200 OK` |
| `GET` | `/api/recipes/:id` | Retrieve single recipe by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/recipes` | Create a new recipe card | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/recipes/:id` | Update an existing recipe by ID | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/recipes/:id` | Delete recipe by ID | `200 OK` / `404 Not Found` |
| `GET` | `/api/health` | Healthcheck and active database status | `200 OK` |

---

## 5. Quick Start Guide (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 22+ recommended)
- Optional: [XAMPP](https://www.apachefriends.org/) (for MySQL)

### Step 1: Install Dependencies
Open your terminal (PowerShell, Command Prompt, or VS Code Terminal) and navigate to the `backend` directory:
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Verify or adjust `backend/.env`:
```env
PORT=3000
DB_DRIVER=auto
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campus_crud
```
> **Note:** If `DB_DRIVER=auto` and MySQL is not running, the application automatically runs on the integrated SQLite engine, automatically creating and populating the database with 10 sample recipes!

### Step 3: (Optional) MySQL via XAMPP
If you want to use MySQL:
1. Start **Apache** and **MySQL** in your XAMPP Control Panel.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Import or execute `backend/schema.sql` (or let the app automatically create it).

### Step 4: Start the Server
```bash
npm start
```
Open your browser and visit:
👉 **`http://localhost:3000`**

---

## 6. Testing with Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select `postman/Personal_Recipe_Card_API.postman_collection.json`.
4. Ensure the server is running on `http://localhost:3000`.
5. Execute the five saved requests in sequence:
   - `1. GET All Recipes`
   - `2. GET Single Recipe by ID`
   - `3. POST Create New Recipe`
   - `4. PUT Update Existing Recipe`
   - `5. DELETE Recipe by ID`

---

## 7. Cloud Deployment Recommendations

The assignment asks to utilize cloud services for deployment:
- **Backend (Render / Railway / Fly.io):** Deploy the Express app by connecting your GitHub repo.
- **Database (Supabase / Aiven / PlanetScale / Neon):** Provision a managed PostgreSQL or MySQL instance in the cloud and paste the connection credentials into your cloud environment variables.
- **Frontend (Render Static / Vercel / Netlify / GitHub Pages):** Host the static frontend and point `API_BASE_URL` in `app.js` to your deployed backend URL.
