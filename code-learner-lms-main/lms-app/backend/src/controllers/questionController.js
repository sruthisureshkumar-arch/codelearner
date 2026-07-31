const Question = require('../models/Question');
const http    = require('http');

/* ── Per-language one-shot starter templates ── */
const STARTERS = {
  c:          '#include <stdio.h>\n\nint main() {\n    // TODO: write your solution here\n    return 0;\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: write your solution here\n    return 0;\n}',
  python:     'def solution():\n    # TODO: write your solution here\n    pass\n\nsolution()',
  java:       'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        // TODO: write your solution here\n    }\n}',
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
    const body = JSON.stringify({ model: 'qwen2.5-coder:1.5b', prompt, stream: false, options: { num_predict: 600, temperature: 0.2 } });
    const req = http.request({ hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).response || ''); }
        catch(e) { reject(new Error('Failed to parse Ollama response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Ollama timeout — model took too long. Using starter template instead.')); });
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

// GET /api/questions/pool/:courseId — all pool questions for a course
exports.getPoolQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId, inPool: true }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/questions/pool — create a standalone pool question
exports.createPoolQuestion = async (req, res) => {
  try {
    const { title, description, courseId, difficulty, language, placeholderCode, driverPreCode, driverPostCode, testCases, hideTestCases, topic } = req.body;
    if (!title || !description || !courseId) return res.status(400).json({ error: 'title, description and courseId are required.' });
    const q = await Question.create({
      title, description, courseId,
      createdBy: req.user.username,
      difficulty: difficulty || 'medium',
      language: language || 'c',
      placeholderCode: placeholderCode || '',
      driverPreCode: driverPreCode || '',
      driverPostCode: driverPostCode || '',
      testCases: testCases || [],
      hideTestCases: !!hideTestCases,
      topic: topic || '',
      inPool: true,
    });
    res.status(201).json(q);
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
    const fields = ['title', 'description', 'answer', 'isAnswerVisible', 'difficulty', 'placeholderCode', 'driverPreCode', 'driverPostCode', 'language', 'testCases', 'hideTestCases', 'maxAttempts', 'topic'];
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

// POST /api/questions/:id/duplicate — clone a question
exports.duplicateQuestion = async (req, res) => {
  try {
    const src = await Question.findById(req.params.id);
    if (!src) return res.status(404).json({ error: 'Not found' });
    const obj = src.toObject();
    delete obj._id; delete obj.createdAt; delete obj.updatedAt;
    obj.title = `${obj.title} (copy)`;
    // give each test case a fresh _id
    obj.testCases = (obj.testCases || []).map(tc => ({ ...tc, _id: undefined }));
    const copy = await Question.create(obj);
    res.status(201).json(copy);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/questions/import — bulk import questions into a session
// Body: { sessionId, courseId, questions: [{ title, description, difficulty, language, placeholderCode, driverPreCode, driverPostCode, testCases, topic }] }
exports.importQuestions = async (req, res) => {
  try {
    const { sessionId, courseId, questions: incoming } = req.body;
    if (!Array.isArray(incoming) || !incoming.length) {
      return res.status(400).json({ error: 'questions array is required.' });
    }
    const Session = require('../models/Session');
    const created = [];
    for (const q of incoming) {
      const doc = await Question.create({
        title:          q.title       || 'Untitled',
        description:    q.description || '',
        courseId:       courseId,
        createdBy:      req.user.username,
        difficulty:     q.difficulty  || 'medium',
        language:       q.language    || 'c',
        placeholderCode: q.placeholderCode || '',
        driverPreCode:  q.driverPreCode  || '',
        driverPostCode: q.driverPostCode || '',
        testCases:      q.testCases      || [],
        hideTestCases:  !!q.hideTestCases,
        maxAttempts:    q.maxAttempts    || 0,
        topic:          q.topic          || '',
        inPool:         !!q.inPool,
      });
      created.push(doc);
    }
    // If a sessionId was provided, link questions to the session
    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, {
        $addToSet: { questions: { $each: created.map(d => d._id) } },
      });
    }
    res.status(201).json({ imported: created.length, questions: created });
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

    // Infer input shape from the first test case (if any) for richer prompts
    const firstTc  = (question.testCases || [])[0];
    const sampleIn = firstTc?.input?.trim()  || '';
    const sampleOut = firstTc?.expectedOutput?.trim() || '';

    // Language-specific prompt templates — small models need concrete examples
    const LANG_HINTS = {
      c: `Use #include <stdio.h>. Read input with scanf(). Print output with printf(). Put // TODO where the student writes their solution inside main().`,
      cpp: `Use #include <iostream> and "using namespace std;". Read input with cin >>. Print with cout <<. Put // TODO where the student writes their solution inside main().`,
      python: `Read input with input() or int(input()). Print with print(). Put # TODO where the student writes their solution. No class needed.`,
      java: `Class must be named Main. Import java.util.Scanner. Read with sc.nextInt() / sc.next() etc. Put // TODO where the student writes their solution inside public static void main(String[] args).`,
      javascript: `Read all stdin at once: const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n'); Parse values from lines[]. Put // TODO where the student writes their solution.`,
      csharp: `Use "using System;". Read with Console.ReadLine(). Print with Console.WriteLine(). Put // TODO where the student writes their solution inside static void Main().`,
      ruby: `Read with gets.chomp or gets.to_i. Print with puts. Put # TODO where the student writes their solution.`,
      mips: `Use .data section for strings, .text for code. Use syscall $v0=5 to read integer, $v0=4 to print string, $v0=1 to print integer, $v0=10 to exit. Put # TODO where the student writes their solution.`,
    };

    let prompt;
    if (lang === 'sql') {
      const setupSql  = firstTc?.input?.trim()     || '';
      const appendSql = firstTc?.appendSql?.trim() || '';
      prompt =
`Generate a starter SQL SELECT query for this exercise.
Title: ${question.title}
Description: ${question.description}
${setupSql  ? `\nDatabase setup (runs before student code):\n${setupSql}` : ''}
${appendSql ? `\nVerification query (runs after student code):\n${appendSql}` : ''}

Rules:
- Write ONLY the student's SELECT query with a -- TODO comment showing where to write the solution
- Do NOT include CREATE TABLE or INSERT — those are handled automatically
- Return ONLY the SQL, no explanation`;
    } else {
      const hint = LANG_HINTS[lang] || `Write correct boilerplate for ${lang} with a TODO comment.`;
      prompt =
`${question.description}

Write starter code in ${lang} for the above. ${hint}
${sampleIn  ? `Sample input:  ${sampleIn}`  : ''}
${sampleOut ? `Sample output: ${sampleOut}` : ''}

Include a TODO comment where the student writes their solution. Do NOT solve it. Return ONLY the ${lang} code, no explanation, no markdown.

Reference structure:
${starter}`;
    }

    let fullCode;
    let usedFallback = false;
    try {
      fullCode = await callOllama(prompt);
      fullCode = cleanCode(fullCode, lang);
      if (!fullCode || fullCode.length < 10) { fullCode = starter; usedFallback = true; }
    } catch (ollamaErr) {
      console.warn('Ollama unavailable, using starter template:', ollamaErr.message);
      fullCode = starter;
      usedFallback = true;
    }

    // Split the generated code into pre / student / post at the TODO marker
    // Everything before the first TODO line → driverPreCode
    // The TODO line itself → placeholderCode
    // Everything after → driverPostCode
    const lines = fullCode.split('\n');
    const todoIdx = lines.findIndex(l => /TODO/i.test(l));

    let driverPreCode, placeholderCode, driverPostCode;
    if (todoIdx === -1) {
      // No TODO found — put it all in the student section
      driverPreCode   = '';
      placeholderCode = fullCode;
      driverPostCode  = '';
    } else {
      driverPreCode   = lines.slice(0, todoIdx).join('\n').trimEnd();
      placeholderCode = lines[todoIdx];          // the TODO line
      driverPostCode  = lines.slice(todoIdx + 1).join('\n').trimStart();
    }

    question.language       = lang;
    question.driverPreCode  = driverPreCode;
    question.placeholderCode = placeholderCode;
    question.driverPostCode = driverPostCode;
    await question.save();
    res.json({ driverPreCode, placeholderCode, driverPostCode, usedFallback });
  } catch (e) {
    console.error('AI generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
