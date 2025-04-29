const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { board, classNumber, subject, chapter, prompt } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

    if (!board || !classNumber || !subject || !chapter || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = `
    You are an experienced teacher creating a detailed lesson plan.

- **Board:** ${board}
- **Class:** ${classNumber}
- **Subject:** ${subject}
- **Chapter:** ${chapter}

Teacher's Special Instructions:
${prompt}

Make sure the lesson plan is well-structured, includes objectives, introduction, activities, assessment questions, and homework tasks.
Use clear headings and bullet points.`; // your existing prompt content here

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
