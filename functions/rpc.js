const fetch = require('node-fetch');

module.exports = async function generateRemarks(req, res) {
  const origin = req.headers.origin;

  // Only allow requests from your Netlify frontend
  if (origin !== 'https://sdm-connect-2.netlify.app') {
    return res.status(403).json({ error: 'Forbidden: Unauthorized origin' });
  }

  try {
    const COHERE_API_KEY = process.env.COHERE_API_KEY;
    const { marks, coscholasticGrades, term } = req.body;

    if (!marks || !coscholasticGrades || !term) {
      return res.status(400).json({
        error: 'Invalid input. Please provide marks, co-scholastic grades, and term.'
      });
    }

    const termPrompts = {
      pt1: `These are the student's PT1 (1st unit test) marks and co-scholastic grades. Suggest improvements for Half-Yearly term. The maximum marks for PT1 are 25 and for half-yearly, they are 60. Just write a maximum of 150 words. I just need a brief where the student needs to focus and improve. Also, 3rd language is Sanskrit.`,
      halfYearly: `These are the student's marks for PT1 (1st unit test) and Half-Yearly. Suggest improvements for PT2 (2nd unit test). The maximum marks for PT1 are 25, for half-yearly, they are 60 and for PT2 they are 25. Just write a maximum of 150 words. I just need a brief where the student needs to focus and improve. Also, 3rd language is Sanskrit.`,
      pt2: `These are the student's marks for PT1 (1st unit test), PT2 (2nd unit test), and Half-Yearly. Suggest improvements for Annual. The maximum marks for PT1 are 25, for half-yearly, they are 60, for PT2 they are 25 and for annuals they are 60. Just write a maximum of 150 words. I just need a brief where the student needs to focus and improve. Also, 3rd language is Sanskrit.`,
      annual: `These are the student's marks for all terms (PT1: 1st unit test, half-yearly, PT2: 2nd unit test and annuals). Predict performance for the next academic year (Write Remarks for the student). The maximum marks for PT1 are 25, for half-yearly, they are 60, for PT2 they are 25 and for annuals they are 60. Just write a maximum of 150 words. I just need a brief where the student needs to focus and improve. Also, 3rd language is Sanskrit.`
    };

    let subjectMarksStr = '';
    for (const subject in marks) {
      const { pt1, pt2, halfYearly, annual } = marks[subject];
      subjectMarksStr += `${subject}: PT1: ${pt1}, PT2: ${pt2}, Half-Yearly: ${halfYearly}, Annual: ${annual}\n`;
    }

    let coscholasticGradesStr = '';
    for (const grade in coscholasticGrades) {
      coscholasticGradesStr += `${grade}: ${coscholasticGrades[grade]}\n`;
    }

    const message = `${termPrompts[term]}\n\nSubject Marks:\n${subjectMarksStr}\nCo-Scholastic Grades:\n${coscholasticGradesStr}\nDo not include any conversational or explanatory lines like “Here is the summary...” or “Here are the remarks”. Your output will be shown to students and teachers directly, so it must look like an official document.`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: message,
        max_tokens: 500,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: "NONE"
      }),
    });

    const data = await response.json();

    if (data && data.generations && data.generations[0] && data.generations[0].text) {
      return res.status(200).json({
        aiRemarks: data.generations[0].text.trim()
      });
    } else {
      return res.status(500).json({
        error: 'Invalid response from Cohere'
      });
    }

  } catch (error) {
    console.error('Error generating AI remarks:', error);
    return res.status(500).json({
      error: 'Server error while generating AI remarks'
    });
  }
};
