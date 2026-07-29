const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Database PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'belajar_sd',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// ------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// ------------------------------------------------------------

// Login Siswa
app.post('/api/auth/student-login', async (req, res) => {
  const { username, pin } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT id, full_name, username, total_stars, grade_level FROM users WHERE username = $1 AND role = $2',
      [username, 'STUDENT']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    const student = userResult.rows[0];
    res.json({
      success: true,
      message: 'Login berhasil!',
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// 2. SUBJECTS & QUIZZES ENDPOINTS
// ------------------------------------------------------------

// Get Semua Mata Pelajaran
app.get('/api/subjects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Daftar Quiz berdasarkan Mata Pelajaran dan Semester
app.get('/api/quizzes', async (req, res) => {
  const { subject_id, semester } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM quizzes WHERE subject_id = $1 AND semester = $2',
      [subject_id, semester]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Soal-Soal dalam Quiz
app.get('/api/quizzes/:quiz_id/questions', async (req, res) => {
  const { quiz_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, quiz_id, question_text, media_url, type, option_a, option_b, option_c, option_d, stars_reward FROM questions WHERE quiz_id = $1',
      [quiz_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// 3. SUBMISSION & LAPORAN ENDPOINTS
// ------------------------------------------------------------

// Submit Jawaban & Hitung Skor + Hadiah Bintang
app.post('/api/quizzes/submit', async (req, res) => {
  const { student_id, quiz_id, answers } = req.body; 

  try {
    // Fetch Kunci Jawaban
    const questionsResult = await pool.query(
      'SELECT id, correct_answer, stars_reward FROM questions WHERE quiz_id = $1',
      [quiz_id]
    );

    const questionMap = {};
    questionsResult.rows.forEach(q => {
      questionMap[q.id] = q;
    });

    let correctCount = 0;
    let totalQuestions = questionsResult.rows.length;
    let totalStarsEarned = 0;

    answers.forEach(ans => {
      const q = questionMap[ans.question_id];
      if (q && q.correct_answer === ans.selected_option) {
        correctCount++;
        totalStarsEarned += q.stars_reward;
      }
    });

    const finalScore = Math.round((correctCount / totalQuestions) * 100);

    // Simpan Riwayat
    await pool.query(
      'INSERT INTO quiz_attempts (student_id, quiz_id, score, stars_earned) VALUES ($1, $2, $3, $4)',
      [student_id, quiz_id, finalScore, totalStarsEarned]
    );

    // Update Bintang Siswa
    await pool.query(
      'UPDATE users SET total_stars = total_stars + $1 WHERE id = $2',
      [totalStarsEarned, student_id]
    );

    res.json({
      success: true,
      message: 'Pengerjaan selesai!',
      result: {
        score: finalScore,
        correctCount,
        totalQuestions,
        starsEarned: totalStarsEarned
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Laporan Perkembangan (Akses Orang Tua/Guru)
app.get('/api/parent/reports/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const queryText = `
      SELECT 
        q.title AS quiz_title,
        s.name AS subject_name,
        qa.score,
        qa.stars_earned,
        qa.completed_at
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE qa.student_id = $1
      ORDER BY qa.completed_at DESC;
    `;
    const result = await pool.query(queryText, [student_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Backend Belajar SD berjalan di port ${PORT}`);
});
