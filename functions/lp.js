const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { board, classNumber, subject, chapter, prompt } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

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
 // your existing prompt content here

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: message,
        max_tokens: 1000,
        temperature: 0.3,
        k: 0,
        stop_sequences: [],
        return_likelihoods: "NONE"
      }),
    });

    const data = await response.json();
    const text = data?.generations?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Invalid response from Cohere' });
    }

    res.json({ processedLessonPlan: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
