CREATE USER IF NOT EXISTS 'flightPlannerApp'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'flightPlannerApp'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS flightPlanner;
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


DELIMITER //

CREATE PROCEDURE AddBookmark(
    IN userId INT,
    IN originCode VARCHAR(3),
    IN startLocation VARCHAR(255),
    IN destinationCode VARCHAR(3),
    IN endLocation VARCHAR(255),
    IN departure DATETIME,
    IN returnDate DATETIME,
    IN flightPrice DECIMAL(10, 2)
)
BEGIN
    INSERT INTO bookmarks (user_id, origin, start_location, destination, end_location, departure_date, return_date, price)
    VALUES (userId, originCode, startLocation, destinationCode, endLocation, departure, returnDate, flightPrice);
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE GetBookmarksByUser(IN userId INT)
BEGIN
    SELECT id, origin, start_location, destination, end_location, departure_date, return_date, price
    FROM bookmarks
    WHERE user_id = userId
    ORDER BY departure_date ASC;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE DeleteBookmark(IN bookmarkId INT)
BEGIN
    DELETE FROM bookmarks
    WHERE id = bookmarkId;
END //

DELIMITER ;

