const axios = require('axios');

/**
 * Service to interact with Google Gemini AI for recruitment insights.
 */
class GoogleAIService {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_KEY;
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analyzes the gap between student skills and job requirements.
   * @param {Object} student - Student profile data
   * @param {Object} job - Job data
   */
  async getSkillAnalysis(student, job) {
    try {
      if (!this.apiKey) {
        throw new Error('GOOGLE_AI_KEY is not configured');
      }

      console.log(`[GoogleAI] Analyzing skill gap for student: ${student.user?.email || student._id} and job: ${job.title}`);

      const prompt = `
        You are an expert AI Recruitment Consultant for the TalentSync platform. 
        Analyze the following candidate's profile against the job description and provide a structured JSON response.

        CANDIDATE PROFILE:
        - Skills: ${student.skills.join(', ')}
        - Bio: ${student.bio || 'Not provided'}
        - Experience: ${student.experience_years || 0} years

        JOB DESCRIPTION:
        - Title: ${job.title}
        - Required Skills: ${job.skillsRequired.join(', ')}
        - Description: ${job.description}

        TASK:
        1. Identify "missing_skills" that the candidate needs for this specific role.
        2. Identify "matching_skills" the candidate already has.
        3. Provide "optimization_tips" on how the candidate can improve their resume for this specific role (be specific about keywords to add).
        4. Give a "suitability_score" from 0-100.
        5. Provide a "recommendation" summary.

        RESPONSE FORMAT:
        Return ONLY a JSON object with this structure:
        {
          "missing_skills": ["skill1", "skill2"],
          "matching_skills": ["skillA", "skillB"],
          "optimization_tips": ["tip1", "tip2"],
          "suitability_score": 85,
          "recommendation": "Summary text..."
        }
      `;

      const response = await axios.post(this.apiUrl, {
        contents: [{
          parts: [{ text: prompt }]
        }]
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from the markdown response if necessary
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('[GoogleAI] Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new GoogleAIService();
