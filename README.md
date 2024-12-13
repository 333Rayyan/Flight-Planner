# Flight Planner

A web application that allows users to search for flights, bookmark their favorite flight offers, and manage their saved flights. The application integrates with the Amadeus Flight Offers API and provides secure user authentication and database functionality.

## Features
- User registration, login, and logout.
- Search for flights using a date, location, and price filters.
- Bookmark flights for later reference.
- Secure password hashing with bcrypt.
- API integration with Amadeus for live flight data.
- Persistent storage with MySQL and stored procedures for efficient queries.
- RESTful API for managing bookmarks.

---

## Requirements
To run this application, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (version 16 or later)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)
- An [Amadeus API](https://developers.amadeus.com/) account for accessing flight data.

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/333Rayyan/Flight-Planner.git
   cd Flight-Planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your MySQL database:
   - Create a database named `flight_planner` (or use your preferred name).
   - Run the SQL schema file to set up the required tables:
     ```bash
     mysql -u your_username -p flight_planner < setup.sql
     ```
   - The `setup.sql` file includes:
     - `users` table for storing user credentials.
     - `bookmarks` table for saving bookmarked flights.

4. Configure environment variables:
   - Create a `.env` file in the root directory and add the following:
     ```
     API_CLIENT_ID=your_amadeus_client_id
     API_CLIENT_SECRET=your_amadeus_client_secret
     ```
   - Replace `your_amadeus_client_id` and `your_amadeus_client_secret` with your Amadeus API credentials.

5. Start the application:
   ```bash
   npm start
   ```

6. Access the app at:
   ```
   http://localhost:8000
   ```
