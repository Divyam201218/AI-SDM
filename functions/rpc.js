  const fetch = require('node-fetch');
  
  module.exports = async function generateRemarks(req, res) {
    const origin = req.headers.origin;
  
    // Allow only your Netlify frontend
    if (origin !== 'https://sdm-connect-2.netlify.app') {
      return res.status(403).json({ error: 'Forbidden: Unauthorized origin' });
    }
  
    try {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      const { marks, coscholasticGrades, term } = req.body;
  
      if (!GEMINI_API_KEY) {
        throw new Error('Missing GEMINI_API_KEY environment variable');
      }
  
      if (!marks || !coscholasticGrades || !term) {
        return res.status(400).json({
          error: 'Invalid input. Please provide marks, co-scholastic grades, and term.'
        });
      }
  
      const termPrompts = {
        pt1: `You are a teacher writing a formal progress remark for a student, based on their PT1 marks and co-scholastic grades.
  
  Your goal is to write a concise, professional remark (max 150 words) summarizing:
  
  - Strong subjects (e.g., high PT1 marks)
  - Subjects that need attention (e.g., low PT1 marks)
  - Any co-scholastic areas of strength or concern
  - A concluding line on focus for the Half-Yearly exam
  
  Use third-person (e.g., "The student shows...") and avoid chatbot phrases like "Here is", "You should", or any questions. Do not mention this is based on AI or a system. End the remark professionally, not conversationally.
  
  Assume the third language is Sanskrit.`,
        
        halfYearly: `You are a teacher writing a formal progress remark for a student, based on PT1 and Half-Yearly marks, and co-scholastic grades.
  
  Write a short, formal remark (~150 words) that:
  
  - Highlights improvements since PT1
  - Mentions subjects of strength or concern
  - Reflects co-scholastic grades and any behavioral notes
  - Encourages focus for PT2
  
  Write in third-person, no chatbot tone or generic filler. Avoid "you should" or "here is." Make it suitable for a printed report card.`,
        
        pt2: `You are a teacher writing a report card remark for a student, based on PT1, PT2, and Half-Yearly marks, and co-scholastic grades.
  
  Summarize in ~150 words:
  
  - Academic growth or patterns
  - Strong and weak subjects
  - Co-scholastic strengths and areas to work on
  - What the student should aim for in the Annual exam
  
  Write professionally, from a teacher’s voice, not conversationally. Avoid "you", "would you like", or informal advice. The remark should end cleanly without follow-up questions.`,
        
        annual: `Write a final year-end remark for a student's report card based on PT1, PT2, Half-Yearly, and Annual marks along with co-scholastic grades.
  
  - Summarize the student’s performance and progress throughout the year
  - Point out academic consistency or fluctuations
  - Acknowledge co-scholastic achievements or challenges
  - Predict readiness for the next academic year
  
  Keep the tone formal, in third person, max 150 words. Avoid chatbot tone or casual phrases. End with a confident summary, not open-ended suggestions.`
      };
  
      // Format subject marks
      let subjectMarksStr = '';
      for (const subject in marks) {
        const { pt1 = '-', pt2 = '-', halfYearly = '-', annual = '-' } = marks[subject];
        subjectMarksStr += `${subject}: PT1: ${pt1}, PT2: ${pt2}, Half-Yearly: ${halfYearly}, Annual: ${annual}\n`;
      }
  
      // Format co-scholastic grades
      let coscholasticGradesStr = '';
      for (const area in coscholasticGrades) {
        coscholasticGradesStr += `${area}: ${coscholasticGrades[area]}\n`;
      }
  
      // Final message to Gemini
      const fullPrompt = `${termPrompts[term]}\n\nSubject Marks:\n${subjectMarksStr}\nCo-Scholastic Grades:\n${coscholasticGradesStr}`;
  
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
      const requestBody = {
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ]
      };
  
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      const rawText = await geminiResponse.text();
  
      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText} - ${rawText}`);
      }
  
      const result = JSON.parse(rawText);
      const generatedRemark = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
      if (!generatedRemark) {
        return res.status(500).json({ error: 'No valid output from Gemini' });
      }
  
      return res.status(200).json({ aiRemarks: generatedRemark });
  
    } catch (error) {
      console.error('Error generating AI remarks:', error);
      return res.status(500).json({
        error: error.message || 'Server error while generating AI remarks'
      });
    }
  };
