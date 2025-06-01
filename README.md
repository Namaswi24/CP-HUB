

## Description

CP Practice Portal is a customized competitive programming practice website designed to help users track their progress, discover upcoming contests, and find new problems to solve. It aggregates information from popular coding platforms like Codeforces, AtCoder, LeetCode, CodeChef, and GeeksForGeeks, providing a centralized hub for competitive programming enthusiasts. The application features a functional backend and a user-friendly interface.

---

## Features

* **User Authentication:** Secure login system to track individual user progress and preferences.
* **Contest Aggregation:** Displays upcoming contests from various platforms (Codeforces, AtCoder, LeetCode, CodeChef, GeeksForGeeks) using APIs like Clist.by.
* **Google Calendar Integration:** Allows users to add contest reminders directly to their Google Calendar.
* **Personalized Problem Lists:** Shows unsolved problems tailored to the user.
* **Problem Search & Filtering:**
    * Search by problem title or ID.
    * Filter problems by tags (e.g., dynamic programming, graphs, data structures).
    * Filter problems by difficulty level.
* **Favorites List:** Users can add preferred problems and contests to a dedicated favorites list.
* **Daily Problem Streak:**
    * Suggests a random problem daily to logged-in users.
    * Solving the daily problem maintains the user's streak.
    * The streak resets to 0 if the daily problem isn't solved by the end of the day.
* **Links to Original Problems:** Provides direct links to problems on their respective host sites.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (evident from `App.jsx`, `components`, `pages`, `context` folders)
* **Backend:** Node.js, Express.js (inferred from `server.js`, `routes`, `controllers`, `middleware` folders)
* **Database:** (A NoSQL or SQL database would be used with the backend, e.g., MongoDB with Mongoose, or PostgreSQL with Sequelize, based on the `models` folder)
* **APIs:**
    * Clist.by API (for contest aggregation)
    * Official APIs from Codeforces, AtCoder, LeetCode, CodeChef, GeeksForGeeks (where available)
* **Package Managers:** npm or yarn

---

## 📁 Folder Structure

The project is organized into two main directories: `backend_` and `front_end`.
```
### Backend (`backend_`)
backend_/
├── config/             # Configuration files (e.g., database, environment variables)
├── controllers/        # Handles incoming requests and business logic
├── middleware/         # Custom middleware functions (e.g., authentication, error handling)
├── models/             # Database schemas or models
├── routes/             # Defines API endpoints
├── src/                # Potentially other source files or utilities for the backend
├── utils/              # Utility functions for the backend
├── package-lock.json
├── package.json
├── server.js           # Main entry point for the backend server
└── yarn.lock
```
```
### Frontend (`front_end`)
front_end/
├── public/
│   └── index.html      # Main HTML file
├── src/
│   ├── api/            # Functions for making API calls to the backend
│   ├── assets/         # Static assets like images, fonts
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context API for state management
│   ├── pages/          # Page-level components (e.g., HomePage, LoginPage, ContestPage)
│   ├── styles/         # Global styles, CSS files
│   ├── utils/          # Utility functions for the frontend
│   ├── App.css         # Main app styles
│   ├── App.jsx         # Root React component
│   └── index.jsx       # Entry point for the React application
├── package-lock.json
├── package.json
└── yarn.lock
```
---

## ⚙️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Backend Setup:**
    ```bash
    cd backend_
    npm install  # or yarn install
    # Create a .env file based on .env.example (if provided) and fill in necessary environment variables (API keys, database URI, etc.)
    npm start    # or yarn start (or npm run dev / yarn dev depending on package.json scripts)
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../front_end
    npm install  # or yarn install
    # Create a .env file if needed for frontend environment variables (e.g., backend API URL)
    npm start    # or yarn start
    ```

4.  Open your browser and navigate to `http://localhost:3000` (or the port specified for the frontend).

---

## 🚀 Usage

1.  **Register/Login:** Create an account or log in to access personalized features.
2.  **View Contests:** Check the "Contests" page for upcoming competitions. Add them to your Google Calendar.
3.  **Practice Problems:** Go to the "Problems" page to find unsolved problems. Use filters to narrow down your search.
4.  **Daily Challenge:** Solve the daily suggested problem to maintain your streak.
5.  **Favorites:** Add interesting problems or contests to your favorites for quick access.

---

## 🌐 APIs Used

* **Clist.by:** For aggregating contest information from multiple platforms.
* **Platform Specific APIs:** (e.g., Codeforces API, etc.) for fetching problem details, user-specific data if available and permissible.

---

