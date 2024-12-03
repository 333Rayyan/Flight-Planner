CREATE USER IF NOT EXISTS 'flightPlannerApp'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'flightPlannerApp'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;


CREATE DATABASE flightPlanner;
USE flightPlanner;


CREATE TABLE IF NOT EXISTS destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO destinations (name, description) VALUES
('Paris', 'The capital city of France, known for its art, fashion, and culture.'),
('New York', 'The largest city in the United States, known for its skyline and cultural diversity.'),
('Tokyo', 'The capital city of Japan, known for its modernity and traditional temples.'),
('Sydney', 'The largest city in Australia, known for its Sydney Opera House and Harbour Bridge.'),
('Cairo', 'The capital city of Egypt, known for its ancient pyramids and rich history.'),
('Dubai', 'A modern city in the UAE, known for its luxury shopping and ultramodern architecture.'),
('Bangkok', 'The capital city of Thailand, famous for its vibrant street life, temples, and delicious cuisine.'),
('Rome', 'The capital city of Italy, known for its ancient ruins, such as the Colosseum and the Vatican City.'),
('Istanbul', 'A major city in Turkey, known for its rich history, cultural sites, and the Bosphorus Strait.');



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
    destination VARCHAR(3) NOT NULL,
    departure_date DATETIME NOT NULL,
    return_date DATETIME,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
