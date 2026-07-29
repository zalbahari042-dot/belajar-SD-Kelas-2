-- ============================================================
-- 1. STRUKTUR DATABASE APLIKASI BELAJAR SD KELAS 2
-- ============================================================

-- Tipe Enum
CREATE TYPE user_role AS ENUM ('STUDENT', 'PARENT', 'TEACHER');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER');

-- Tabel Users (Akun Siswa, Orang Tua, Guru)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'STUDENT',
    grade_level INT DEFAULT 2,
    total_stars INT DEFAULT 0,
    avatar_url VARCHAR(255) DEFAULT 'default_avatar.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Mata Pelajaran
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255)
);

-- Tabel Quizzes / Topik Belajar
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Bank Soal
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    media_url VARCHAR(255),
    type question_type DEFAULT 'MULTIPLE_CHOICE',
    option_a VARCHAR(255),
    option_b VARCHAR(255),
    option_c VARCHAR(255),
    option_d VARCHAR(255),
    correct_answer VARCHAR(255) NOT NULL,
    explanation TEXT,
    stars_reward INT DEFAULT 10
);

-- Tabel Riwayat & Nilai Pengerjaan
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    stars_earned INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing Optimasi
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_attempts_student ON quiz_attempts(student_id);

-- ============================================================
-- 2. DATA SAMPEL AWAL (SEED DATA)
-- ============================================================

-- Data Mata Pelajaran
INSERT INTO subjects (code, name, description) VALUES
('MATH', 'Matematika', 'Penjumlahan, Bangun Datar, dan Waktu'),
('INDO', 'Bahasa Indonesia', 'Membaca, Kosa Kata, dan Cerita'),
('PPKN', 'Pendidikan Pancasila', 'Simbol Pancasila dan Aturan Rumah');

-- Data Quiz
INSERT INTO quizzes (subject_id, title, semester) VALUES
(1, 'Latihan Penjumlahan & Pengurangan', 1),
(3, 'Aturan di Rumah dan Sekolah', 1);

-- Data Soal Contoh
INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(1, 'Budi memiliki 15 apel. Ia memakan 6 apel. Berapa sisa apel Budi?', '7', '8', '9', '10', 'C', '15 dikurangi 6 adalah 9.'),
(1, 'Bangun datar yang memiliki 3 sisi dinamakan...', 'Persegi', 'Segitiga', 'Lingkaran', 'Trapesium', 'B', 'Segitiga memiliki 3 buah sisi.');
