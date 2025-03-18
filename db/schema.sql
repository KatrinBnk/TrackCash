 DROP DATABASE TrackCash;
 CREATE DATABASE TrackCash;

 USE TrackCash;

CREATE TABLE Users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  surname VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  patronymic VARCHAR(50) NOT NULL,
  role ENUM('admin', 'manager', 'employee') NOT NULL,
  department_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отделов
CREATE TABLE Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_id INT UNIQUE,
    FOREIGN KEY (manager_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

ALTER TABLE Users ADD FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Таблица категорий расходов
CREATE TABLE Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Departments (id) ON DELETE SET NULL
);

-- Таблица записей о расходах/доходах
CREATE TABLE Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    type ENUM('expense', 'income') NOT NULL, -- Расход или доход
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE -- почему поставлено каскадное удаление? Фактически приводит у потере транзакций при удалении категориии, возможно стоит заменить на set null?
);