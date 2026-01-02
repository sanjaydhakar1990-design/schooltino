
-- CORE DATABASE SCHEMA

CREATE TABLE schools (
  id INT PRIMARY KEY,
  name TEXT,
  address TEXT,
  board_type TEXT
);

CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  email TEXT,
  mobile TEXT,
  role TEXT
);

CREATE TABLE students (
  id INT PRIMARY KEY,
  school_id INT,
  name TEXT,
  class TEXT,
  section TEXT
);

CREATE TABLE staff (
  id INT PRIMARY KEY,
  school_id INT,
  name TEXT,
  designation TEXT
);

CREATE TABLE attendance_daily (
  id INT PRIMARY KEY,
  student_id INT,
  date DATE,
  status TEXT,
  source TEXT
);

CREATE TABLE ai_events (
  id INT PRIMARY KEY,
  event_type TEXT,
  severity TEXT,
  timestamp DATETIME
);
