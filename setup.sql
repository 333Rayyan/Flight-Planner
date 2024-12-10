CREATE USER IF NOT EXISTS 'flightPlannerApp'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'flightPlannerApp'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE flightPlanner;
USE flightPlanner;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    origin VARCHAR(3) NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    departure_date DATETIME NOT NULL,
    return_date DATETIME,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
