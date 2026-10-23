'use strict';

const { QueryTypes } = require('sequelize');
const {
  MslqStaticQuestion,
  LlmPromptTemplate,
  UserQuizResult,                          // ✅ FIX #1
} = require('../models');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum diset di environment');
}

// ── Lazy init @google/genai (ESM-only) ──
let _genaiPromise;
function getGenAI() {
  if (!_genaiPromise) _genaiPromise = import('@google/genai');
  return _genaiPromise;
}

let _aiPromise;
function getAI() {
  if (!_aiPromise) {
    _aiPromise = (async () => {
      const { GoogleGenAI } = await getGenAI();
      return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    })();
  }
  return _aiPromise;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MSLQ_CATEGORIES = [
  'organization',
  'time_management',
  'metacognitive_self_regulation',
  'help_seeking',
  'elaboration',
  'rehearsal',
];

const EXPECTED_TOTAL = 24;
const EXPECTED_PER_CATEGORY = 4;

// ═══════════════════════════════════════════════════════════════
// VALIDATOR
// ═══════════════════════════════════════════════════════════════
function validateGeneratedQuestions(questions) {
  const errors = [];
  if (!Array.isArray(questions)) return ['Output bukan array.'];
  if (questions.length !== EXPECTED_TOTAL) {
    errors.push(`Jumlah soal ${questions.length}, harus ${EXPECTED_TOTAL}.`);
  }
  const counts = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const where = `questions[${i}]`;
    if (!MSLQ_CATEGORIES.includes(q.category)) {
      errors.push(`${where}: kategori "${q.category}" tidak valid.`);
    } else {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    if (!Array.isArray(q.options) || q.options.length !== 3) {
      errors.push(`${where}: options harus 3, dapat ${q.options?.length ?? 0}.`);
      continue;
    }
    const scores = q.options.map(o => o.score).sort();
    if (JSON.stringify(scores) !== JSON.stringify([1, 2, 3])) {
      errors.push(`${where}: skor options harus [1,2,3], dapat [${scores}].`);
    }
  }
  for (const cat of MSLQ_CATEGORIES) {
    if (counts[cat] !== EXPECTED_PER_CATEGORY) {
      errors.push(`Kategori "${cat}" berisi ${counts[cat] || 0}, harus ${EXPECTED_PER_CATEGORY}.`);
    }
  }
  return errors;
}

// ═══════════════════════════════════════════════════════════════
// BRANCH A: STATIC QUESTIONS
// ═══════════════════════════════════════════════════════════════
async function getOnboardingStaticQuestions() {
  const rows = await MslqStaticQuestion.sequelize.query(`
    WITH ranked AS (
      SELECT static_q_id, category, question_text, options,
             ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) AS rn
      FROM mslq_static_questions
    )
    SELECT static_q_id, category, question_text, options
    FROM ranked
    WHERE rn <= 4
    ORDER BY RANDOM()
  `, { type: QueryTypes.SELECT });

  if (rows.length < EXPECTED_TOTAL) {
    throw new Error(
      `Bank soal tidak cukup: butuh ${EXPECTED_TOTAL}, tersedia ${rows.length}.`
    );
  }
  return rows.map(q => ({ ...q, options: shuffleArray(q.options) }));
}

// ═══════════════════════════════════════════════════════════════
// BRANCH B: DYNAMIC QUESTIONS via LLM
// ═══════════════════════════════════════════════════════════════
async function generateDynamicQuestionsFromLlm() {
  const { Type } = await getGenAI();      // ✅ Type via dynamic import
  const ai = await getAI();               // ✅ ai lazy

  const templateRecord = await LlmPromptTemplate.findOne({
    where: { templateName: 'mslq_quiz_generator', isActive: true },
  });
  if (!templateRecord) {
    throw new Error("Template prompt 'mslq_quiz_generator' tidak ditemukan.");
  }

  const responseSchema = {
    type: Type.ARRAY,
    minItems: EXPECTED_TOTAL,
    maxItems: EXPECTED_TOTAL,
    items: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: MSLQ_CATEGORIES },
        question_text: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          minItems: 3,
          maxItems: 3,
          items: {
            type: Type.OBJECT,
            properties: {
              text:  { type: Type.STRING },
              score: { type: Type.INTEGER, enum: [1, 2, 3] },
            },
            required: ['text', 'score'],
          },
        },
      },
      required: ['category', 'question_text', 'options'],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: templateRecord.systemPrompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.6,
      thinkingConfig: { thinkingLevel: 'low' },
      maxOutputTokens: 8192,
    },
  });

  if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new Error('LLM kehabisan token sebelum selesai. Coba naikkan maxOutputTokens.');
  }

  const questions = JSON.parse(response.text);
  const errors = validateGeneratedQuestions(questions);
  if (errors.length > 0) {
    throw new Error(`LLM output tidak valid: ${errors.join(' | ')}`);
  }
  return questions.map(q => ({ ...q, options: shuffleArray(q.options) }));
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function generateDynamicMslqQuestions(userId) {
  if (!userId) {
    throw new Error('userId wajib diisi (cek auth middleware & pemanggil)');
  }
  
  const existing = await UserQuizResult.findOne({ where: { userId } });

  if (existing == null) {
    try {
      const questions = await getOnboardingStaticQuestions();
      return {
        source: 'static_fallback',
        questions,
        meta: {
          total: questions.length,
          generated_at: new Date().toISOString(),
          randomizer_version: '1.1.0',
        },
      };
    } catch (err) {
      console.error('[static fallback failed]', err.message);
      throw err;
    }
  }

  try {
    const questions = await generateDynamicQuestionsFromLlm();
    return {
      source: 'llm',
      questions,
      meta: {
        total: questions.length,
        generated_at: new Date().toISOString(),
        algorithm: 'gemini-3.8-flash',
      },
    };
  } catch (err) {
    console.error('[llm generation failed]', err.message);
    try {
      const questions = await getOnboardingStaticQuestions();
      return {
        source: 'static_fallback_after_llm_error',
        questions,
        meta: {
          total: questions.length,
          llm_error: err.message,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (fallbackErr) {
      console.error('[fallback also failed]', fallbackErr.message);
      throw new Error(
        `Gagal generate soal: LLM error (${err.message}), ` +
        `fallback juga error (${fallbackErr.message}).`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════════════════════
const generateLlmFeedback = async (dominantStrategy, userProfile, answersPayload) => {
  try {
    const ai = await getAI();             // ✅ lazy
    const prompt = `
      Kamu adalah seorang pakar Psikometri dan Self-Regulated Learning (MSLQ).
      Tugasmu adalah memberikan umpan balik (feedback) dan saran strategi belajar konkret yang singkat, ramah, dan memotivasi untuk seorang mahasiswa TI
      dengan bahasa Gen-Z.
      - Strategi Dominan: ${dominantStrategy}
      - Profil Belajar: ${userProfile}
      - Detail Jawaban Kuis: ${JSON.stringify(answersPayload)}

      Tuliskan saran dalam 2-3 kalimat tajam yang berfokus pada eksekusi tugas harian menggunakan Kanban board.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        // ✅ FIX #3 & #4: hapus responseMimeType & responseSchema
        temperature: 0.6,
        thinkingConfig: { thinkingLevel: 'low' },
        maxOutputTokens: 1024,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error('⚠️ [LLM Feedback Error]: Menggunakan saran standar fallback.', error.message);
    return `Siap memulai pertarungan belajar menggunakan strategi ${dominantStrategy} untuk membuat jadwal pengerjaan tugas-tugas besar menjadi sub-tugas kecil di Kanban board.`;
  }
};

module.exports = {
  generateDynamicMslqQuestions,
  generateLlmFeedback,
};