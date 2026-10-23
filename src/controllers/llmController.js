const { generateDynamicMslqQuestions, generateLlmFeedback } = require('../services/llmService');
const { LlmRecommendationHistory } = require('../models');

// GET /api/llmRekomen/questions
const getQuestions = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.user?.userId ?? req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await generateDynamicMslqQuestions(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/llm/generate-feedback
const getFeedback = async (req, res, next) => {
  try {
    const { dominantStrategy, userProfile, answersPayload } = req.body;
    
    // Panggil layanan LLM (dengan mekanisme fallback yang aman)
    const feedbackText = await generateLlmFeedback(dominantStrategy, userProfile, answersPayload);

    // Simpan histori dengan melengkapi inputContext agar tidak kena notNull violation
    const historyRecord = await LlmRecommendationHistory.create({
      userId: req.user.userId,
      triggerType: 'quiz_initial',
      inputContext: { dominantStrategy, userProfile, answersPayload }, // <--- WAJIB DIISI SESUAI VALIDASI MODEL
      llmOutput: { feedback: feedbackText },
      promptUsed: `Strategy: ${dominantStrategy}`
    });

    res.json({
      feedback: feedbackText,
      history: historyRecord
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  getFeedback
};