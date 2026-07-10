const Question = require('../models/Question');
const http    = require('http');

/* ── Per-language one-shot starter templates ── */
const STARTERS = {
  c:          '#include <stdio.h>\n\nint main() {\n    // TODO: write your solution here\n    return 0;\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: write your solution here\n    return 0;\n}',
  python:     'def solution():\n    # TODO: write your solution here\n    pass\n\nsolution()',
  java:       'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: write your solution here\n    }\n}',
  javascript: 'function solution() {\n    // TODO: write your solution here\n}\n\nsolution();',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // TODO: write your solution here\n    }\n}',
  ruby:       'def solution\n  # TODO: write your solution here\nend\n\nsolution',
  sql:        '-- TODO: write your SQL query here\nSELECT * FROM table_name;',
  mips:       '# MIPS Assembly\n.data\n    # TODO: add data section here\n\n.text\nmain:\n    # TODO: write your solution here\n    li $v0, 10\n    syscall',
  flex:       '%option noyywrap\n%%\n/* TODO: add your lexer rules here */\n. { /* skip */ }\n%%\nint main() {\n    yylex();\n    return 0;\n}',
};

/* Call local Ollama to generate starter code */
async function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'qwen2.5-coder:1.5b', prompt, stream: false, options: { num_predict: 400, temperature: 0.3 } });
    const req = http.request({ hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).response || ''); }
        catch(e) { reject(new Error('Failed to parse Ollama response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Ollama timeout')); });
    req.write(body); req.end();
  });
}

/* Strip any lines that look like internal AI instructions leaking into the code */
function cleanCode(code, language) {
  const instructionPatterns = [
    /^#+\s*(generate|create|write|implement|starter|template|placeholder|here is|below is|note:|instructions?:)/i,
    /^\/\/\s*(generate|create|write|implement|starter|template|placeholder|here is|below is|note:|instructions?:)/i,
    /^#\s*(do not|don't|avoid|make sure|ensure|remember)/i,
    /^\/\/\s*(do not|don't|avoid|make sure|ensure|remember)/i,
    /```/,
  ];
  const lines = code.split('\n').filter(line => !instructionPatterns.some(p => p.test(line.trim())));
  let cleaned = lines.join('\n').trim();
  // Java must use class Main
  if (language === 'java') cleaned = cleaned.replace(/public\s+class\s+\w+/g, 'public class Main');
  return cleaned;
}

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json(question);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createQuestion = async (req, res) => {
  try {
    const { title, description, courseId, createdBy, difficulty, placeholderCode, language, testCases } = req.body;
    if (!title || !description || !courseId || !createdBy)
      return res.status(400).json({ error: 'Missing required fields' });
    const question = new Question({ title, description, courseId, createdBy, difficulty, placeholderCode: placeholderCode || '', language: language || 'mips', testCases: testCases || [] });
    res.status(201).json(await question.save());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Not found' });
    const fields = ['title', 'description', 'answer', 'isAnswerVisible', 'difficulty', 'placeholderCode', 'language', 'testCases', 'hideTestCases'];
    fields.forEach(f => { if (req.body[f] !== undefined) question[f] = req.body[f]; });
    res.json(await question.save());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateAnswerVisibility = async (req, res) => {
  try {
    const { isAnswerVisible } = req.body;
    if (typeof isAnswerVisible !== 'boolean') return res.status(400).json({ error: 'isAnswerVisible must be boolean' });
    const question = await Question.findByIdAndUpdate(req.params.id, { isAnswerVisible }, { new: true });
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json(question);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer cannot be empty' });
    const question = await Question.findByIdAndUpdate(req.params.id, { answer }, { new: true });
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json(question);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* POST /api/questions/:id/generate-placeholder — generate starter code with local AI */
exports.generatePlaceholder = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Not found' });
    const lang = req.body.language || question.language || 'c';

    // For Flex, always return fixed template (AI unreliable here)
    if (lang === 'flex') {
      const fixed = STARTERS.flex;
      question.language = lang;
      question.placeholderCode = fixed;
      await question.save();
      return res.json({ placeholderCode: fixed });
    }

    const starter = STARTERS[lang] || STARTERS.c;
    const prompt =
`You are generating starter code for a programming exercise.
Title: ${question.title}
Description: ${question.description}
Language: ${lang}

Here is an example of correct starter code format for ${lang}:
${starter}

Generate starter code in ${lang} that:
1. Has the correct file/class structure for ${lang}
2. Reads necessary inputs (if any)
3. Contains a clear TODO comment where students write their solution
4. Does NOT implement the solution
5. Does NOT contain any explanation, markdown, or comments not in the code

Return ONLY the code, nothing else.`;

    let code = await callOllama(prompt);
    code = cleanCode(code, lang);

    // Fallback to template if AI returns garbage
    if (!code || code.length < 10) code = starter;

    question.language = lang;
    question.placeholderCode = code;
    await question.save();
    res.json({ placeholderCode: code });
  } catch (e) {
    console.error('AI generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
