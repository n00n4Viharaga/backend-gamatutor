-- 1. INISIALISASI EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DATABASE GAMATUTOR
CREATE DATABASE Gamatutor;

-- ==========================================
-- A. USER MANAGEMENT & AUTHENTICATION
-- ==========================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(7) DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

delete from users;
select * from users;
CREATE TABLE token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    access_token_expiry TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
select * from token;
-- ==========================================
-- B. LLM SYSTEM, PROMPT & MSLQ QUIZ ENGINE
-- ==========================================
-- Penampung System Prompt Dynamic (Biar gak hardcoded di Node.js)
CREATE TABLE llm_prompt_templates (
    prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL, -- 'mslq_quiz_generator', 'monthly_evaluation'
    version INT DEFAULT 1,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Soal Statis (Fallback kalau API LLM error/limit)
CREATE TABLE mslq_static_questions (
    static_q_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hasil Kuis MSLQ User + Mapping Lock/Unlock Fitur
CREATE TABLE user_quiz_results (
    quiz_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    dominant_strategy VARCHAR(50) NOT NULL,
    user_profile VARCHAR(100) NOT NULL,
    unlocked_features JSONB NOT NULL, -- ex: ["organization", "time_management"]
    locked_features JSONB NOT NULL,
    answers_payload JSONB NOT NULL,   -- Detail jawaban kuis
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluasi Bulanan (Deteksi Disinkronisasi Antara Profile vs Perilaku)
CREATE TABLE monthly_evaluations (
    eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL, -- Format: 'MM-YYYY'
    is_synchronized BOOLEAN NOT NULL,
    requires_quiz_retake BOOLEAN DEFAULT FALSE,
    detected_issues JSONB NOT NULL,
    llm_feedback TEXT NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_monthly_eval UNIQUE(user_id, month_year)
);

-- ==========================================
-- C. STRATEGI BELAJAR & CARD MANAGEMENT
-- ==========================================
CREATE TABLE learning_strats (
    learning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code VARCHAR(50) UNIQUE NOT NULL, -- ex: 'time_management', 'organization'
    learning_strategy VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
	NmMatkul VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    learning_id UUID NOT NULL REFERENCES learning_strats(learning_id) ON DELETE CASCADE,
	description TEXT,
    course_name VARCHAR(50),
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard','expert')),
    priority VARCHAR(10) CHECK (priority IN ('low','medium','high','critical')),
    deadline DATE NOT NULL,
    url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    
    -- Evaluasi & Refleksi Mandiri Card
    satisfaction_rating NUMERIC,
    notes TEXT,
    pre_test_grade INT,
    post_test_grade INT,
    reflection_q1_strategy TEXT,
    reflection_q2_confidence NUMERIC,
    reflection_q3_what_learned TEXT,
    reflection_q4_value TEXT,
    reflection_completed_at TIMESTAMPTZ,
    goal_check_rating NUMERIC,
    goal_check_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_list (
    card_id UUID PRIMARY KEY REFERENCES cards(card_id) ON DELETE CASCADE,
    sub_title VARCHAR(255),
	end_time_list TIMESTAMPTZ
); 
 

CREATE TABLE card_column_movements (
    ccm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    from_column VARCHAR(100),
    to_column VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- D. KOLABORASI, CHAT & SOSIAL
-- ==========================================
CREATE TABLE friendships (
    fs_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending','accepted','declined','blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_request UNIQUE (user_id, friend_id),
    CONSTRAINT no_self_request CHECK (user_id <> friend_id)
);

CREATE TABLE chat (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_chat TEXT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('delivered','read')),
    time_chat TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_list_collab (
    collab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('owner','member')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(card_id, user_id)
);

CREATE TABLE card_list_chat (
    chat_colab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collab_id UUID NOT NULL REFERENCES card_list_collab(collab_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
-- ==========================================
-- E. ACTIVITY LOGS & LLM RECOMMENDATIONS (DIREVISI TOTAL)
-- ==========================================

-- 1. Log Aktivitas Ringkas (Sumber data LLM buat evaluasi bulanan)
CREATE TABLE user_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'CARD_MOVED', 'CHAT_SENT', 'REFLECTIONS_COMPLETED'
    ref_id UUID,                         -- Bisa nunjuk ke card_id, chat_id, atau ccm_id
    metadata JSONB,                      -- Detail log ex: {"from":"Planning", "to":"Progress"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histori Rekomendasi Strategi dari LLM (Disimpan rapi buat Jejak Audit/Tesis)
CREATE TABLE llm_recommendation_histories (
    rec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,  -- 'MONTHLY_EVAL', 'QUIZ_RESULT', 'ON_DEMAND'
    input_context JSONB NOT NULL,       -- Data mentah log/kuis yang dilempar ke LLM
    llm_output JSONB NOT NULL,          -- Respon rekomendasi utuh dari LLM
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- F. GAMIFIKASI (AVATAR) & NOTIFIKASI
-- ==========================================
CREATE TABLE avatar_components (
    ava_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(10) NOT NULL CHECK (category IN ('head','hair','face','shirt','pants','special')),
    name VARCHAR(50) NOT NULL,
    asset_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_avatar (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    hair_id UUID REFERENCES avatar_components(ava_id),
    face_id UUID REFERENCES avatar_components(ava_id),
    shirt_id UUID REFERENCES avatar_components(ava_id),
    pants_id UUID REFERENCES avatar_components(ava_id),
    special_id UUID REFERENCES avatar_components(ava_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avatar_unlocks (
    ava_un_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES avatar_components(ava_id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, component_id)
);

CREATE TABLE notifications (
    notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) CHECK (type IN ('push', 'smart_reminder', 'social_presence', 'encouragement')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered BOOLEAN DEFAULT FALSE,
    delivery_error TEXT,
    scheduled_for TIMESTAMPTZ,
    reminder_reason TEXT,
    trigger_action TEXT,
    trigger_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- G. DEFAULT DATA SEEDING
-- ==========================================
INSERT INTO users (first_name, last_name, email, username, password, role) 
VALUES ('Super', 'Admin', 'superadmin@gmail.com', 'superadmin', '$2b$10$eA0E74M1iO4S1y5x3J1O4uGv71vR3W9/4E2W1a1Q5d1e2f3g4h5i', 'admin');

INSERT INTO learning_strats (key_code, learning_strategy, description) VALUES
('rehearsal', 'Rehearsal', 'Mengingat atau mengulang informasi secara verbatim/hafalan.'),
('organization', 'Organization', 'Mengekstrak ide pokok dan mengelompokkan materi belajar.'),
('elaboration', 'Elaboration', 'Menghubungkan materi baru dengan pengetahuan sebelumnya.'),
('time_management', 'Time Management', 'Mengatur jadwal, target pengerjaan, dan skala prioritas.'),
('help_seeking', 'Help-Seeking', 'Kemampuan meminta bantuan secara efektif saat menemui kesulitan.'),
('metacognitive_self_regulation', 'Metacognitive Self-Regulation', 'Merencanakan, memantau, dan menyesuaikan proses berpikir mandiri.'),

INSERT INTO llm_prompt_templates (template_name, version, system_prompt, is_active)
VALUES (
  'mslq_quiz_generator',
  1,
  'Kamu adalah seorang pakar Psikometri dan Self-Regulated Learning (MSLQ). 
  	Tugasmu adalah membuat 7 pertanyaan kuis pilihan ganda berbasis skenario kehidupan 
	  mahasiswa.\n\nSetiap pertanyaan HARUS mewakili satu dari 7 kategori MSLQ berikut:
	  \n1. organization
	  \n2. time_management
	  \n3. metacognitive_self_regulation
	  \n4. help_seeking
	  \n5. elaboration
	  \n6. rehearsal
	  \n7. critical_thinking
	  \n\nFormat Output WAJIB berupa JSON array valid tanpa teks tambahan di luar JSON:
	  \n[\n  {\n    "category": "organization",
	  \n    "question_text": "...",
	  \n    "options": [
	  \n	  {"text": "...", "score": 3},
	  \n      {"text": "...", "score": 2},
	  \n      {"text": "...", "score": 1}
	  \n    ]\n  }
	  \n]
	  \n\nKetentuan Opsi:
	  \n- Score 3: Menerapkan strategi tersebut secara aktif/ideal.
	  \n- Score 2: Menerapkan secara pasif/parsial.
	  \n- Score 1: Tidak menerapkan sama sekali.',
  TRUE
);