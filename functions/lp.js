const fetch = require('node-fetch');

const allowedOrigin = 'https://sdm-connect-2.netlify.app';

module.exports = async (req, res) => {
  try {
    const { board, classNumber, subject, chapter, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    if (!board || !classNumber || !subject || !chapter || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = `
Create a formal, structured lesson plan only.

- Board: ${board}
- Class: ${classNumber}
- Subject: ${subject}
- Chapter: ${chapter}

Teacher's Instructions:
${prompt}

Do not include any conversational or explanatory lines like “Here is a lesson plan...” or “In this lesson, we will...”
Use only formal lesson plan formatting with clear headings (like "Objectives", "Activities", etc.) and bullet points.

Your output will be shown to students and teachers directly, so it must look like an official document.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: message }]
        }
      ]
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${rawText}`);
    }

    const data = JSON.parse(rawText);

    let lessonPlan = 'No output from Gemini';
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      lessonPlan = data.candidates[0].content.parts[0].text;
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).json({ processedLessonPlan: lessonPlan });

  } catch (error) {
    console.error("=== Gemini Lesson Plan Error ===", error.stack || error.message);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
