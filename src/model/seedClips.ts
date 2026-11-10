import type { Assignment, Answer, Exercise, Feedback, Student } from './types';

// A teacher's real list of COBE Part C practice clips (YouTube), as video exercises.
// Made up: dates, time limits, answer targets, and the extra students and assignments below.

/** [title, YouTube URL (null: none yet), start, end, questions] */
type Clip = [string, string | null, string | undefined, string | undefined, string[]];

const CLIPS: Clip[] = [
  ['Etel Adnan', 'https://www.youtube.com/watch?v=d9SaAhidwL8', undefined, undefined, [
    'List three things about Etel’s family.',
    'What did Etel like to do in her childhood? Give at least two examples and explain.',
    'What made Etel decide to start doing art? Explain in detail.',
    'What is the most interesting thing you learned about Etel? Explain.',
  ]],
  ['Yinka Shonibare', 'https://www.youtube.com/watch?v=UamZkDsmcFk', undefined, undefined, [
    'List three things about Yinka’s childhood.',
    'What do we learn about Yinka after he got accepted to art school? Give at least two examples and explain.',
    'Why didn’t Yinka want to do only African art? Explain.',
    'What do you think is the most interesting thing about Yinka and his art? Explain.',
  ]],
  ['Adidas turns plastic into shoes', 'https://www.youtube.com/watch?v=pJBRqespiOA', undefined, undefined, [
    'What is this clip about?',
    'What is the problem presented in the clip? Explain.',
    'Describe how Adidas is trying to find a solution to the problem.',
    'What was most interesting for you in the clip? Give an example.',
  ]],
  ['Plastic pollution in the ocean', 'https://www.youtube.com/watch?v=Yomf5pBN8dY', undefined, undefined, [
    'What is this clip about? Explain.',
    'Who is mostly affected by the problem? Explain.',
    'What are some of the dangers caused by using plastic? Give at least one example and explain.',
    'Why is recycling not the answer to the problem? Explain.',
    'What was most interesting for you in the clip? Explain and give an example.',
    'What kind of solution does the clip offer instead? Explain.',
  ]],
  ['Working dogs', 'https://www.youtube.com/watch?v=6j9X3Fnswmo', undefined, undefined, [
    'What is this clip about? Explain.',
    'According to the clip, why are dogs considered to be a man’s best friend? Explain and give two examples.',
    'What is one type of work that dogs do, according to the clip? Give at least one example and explain.',
    'What was the most interesting thing you learned from the clip? Explain.',
  ]],
  ['Water changes everything', 'https://www.youtube.com/watch?v=BCHhwxvQqxg', undefined, undefined, [
    'What is this clip about? Explain.',
    'What is the problem presented in the clip? Explain.',
    'How can the solutions presented in the clip help people? Give at least one example.',
    'What is one new fact that you learned from the clip? Explain and give an example.',
    'Which solution do you think works best? Explain.',
  ]],
  ['Pasta', 'https://www.youtube.com/watch?v=yyVMZHjaY40', '0:04', undefined, [
    'What is this clip about? Explain.',
    'What did you learn about how pasta is made? Give an example.',
    'What is the purpose of the different shapes of pasta? Give an example.',
    'What was most interesting for you in the clip? Explain and give an example.',
  ]],
  ['The importance of art education', 'https://www.youtube.com/watch?v=987VSNBw558', undefined, undefined, [
    'What is this clip about? Explain.',
    'How does art help students? Give three examples and explain.',
    'How is art different from other classes? Give one example and explain.',
    'Which of the speakers do you agree with the most? Explain why.',
  ]],
  ['Kids don’t eat lunch alone', 'https://www.youtube.com/watch?v=QdDa2outstI', undefined, undefined, [
    'What is the problem presented in the clip? Explain.',
    'Who is mostly affected by the problem? Explain and give an example.',
    'What do the members of the club do? Give at least one example and explain.',
    'What was most interesting for you in the clip? Explain and give an example.',
  ]],
  ['How to read a book a day', 'https://www.youtube.com/watch?v=c9F5kMUfFKk', undefined, '3:23', [
    'What is this clip about? Explain.',
    'Why does the speaker talk about the reading habits of successful people? Explain and give at least one example.',
    'What is the speaker’s advice to you before reading non-fiction books? Explain.',
    'What are two suggestions the speaker gives to make reading more effective? Explain.',
  ]],
  ['Bus driver', 'https://www.youtube.com/watch?v=f30XZrz7-Gk', undefined, undefined, [
    'What is this clip about? Explain.',
    'What does the bus driver do that is considered special? Explain and give two examples.',
    'How do the children feel about the bus driver? Give at least one example and explain.',
    'What did you learn from the clip? Explain and give two examples.',
  ]],
  ['Music education', 'https://www.youtube.com/watch?v=6Ai2HVpshnU', undefined, undefined, [
    'What is this clip about? Explain.',
    'According to the clip, where is music used in our lives? Explain and give two examples.',
    'What does the example of the school in Kenya show? Explain.',
    'How does music influence people’s lives according to the clip? Explain and give two examples.',
  ]],
  ['Finding a friend during the pandemic', 'https://www.youtube.com/watch?v=XiD1WvoSWZU', undefined, undefined, [
    'What is this clip about?',
    'What is the main goal of the website? Explain.',
    'What are the advantages of this website? Give one example from the clip.',
    'Do you think this website will create long lasting friendships? Explain.',
  ]],
  ['4Ocean', 'https://www.youtube.com/watch?v=3WAWSaSKvjQ', undefined, undefined, [
    'What is the main problem presented in the clip? Explain.',
    'Describe how 4Ocean is trying to find a solution to the problem.',
    'How do you know 4Ocean has been successful so far? Give two examples from the clip.',
    'What was most interesting for you in the clip? Give an example.',
  ]],
  ['Amazon Go', 'https://www.youtube.com/watch?v=JgfVVEKAK5E', undefined, undefined, [
    'What is this clip about?',
    'Describe the shopping experience at Amazon Go.',
    'What are the advantages and disadvantages of Amazon Go?',
    'Would you like to shop at Amazon Go? Explain.',
  ]],
  ['The diet that helps fight climate change', 'https://www.youtube.com/watch?v=nUnJQWO4YJY', undefined, undefined, [
    'What is the problem that is presented in the clip? Explain.',
    'What is the solution? Explain.',
    'How does what we eat affect global warming? Explain.',
    'After watching the clip, describe what you can do to help the planet.',
  ]],
  ['How used hotel soaps get recycled', 'https://www.youtube.com/watch?v=49oZt8Sl-JA', undefined, undefined, [
    'What is this clip about?',
    'Describe in general how used soap in hotels is made into new soap.',
    'In what way is the new soap helpful? Explain.',
    'What was most interesting for you in the clip? Explain.',
  ]],
  ['Room for dessert', 'https://www.youtube.com/watch?v=lTtfqECMEb8', undefined, undefined, [
    'What is this clip about?',
    'Describe the mac and cheese experiment.',
    'What do the researchers learn from the experiment in the clip?',
    'Why do you think the results of the experiment are important? Give an example.',
  ]],
  ['Paula Rego', 'https://www.youtube.com/watch?v=UdN18YMlpI8', undefined, undefined, [
    'List three things about Paula’s childhood.',
    'How did drawing help Paula express herself? Explain and give examples.',
    'Why didn’t Paula feel that she fit in at London’s art school? Explain and give examples.',
    'What is the most interesting thing about Paula and her art? Explain.',
  ]],
  ['Yayoi Kusama', 'https://www.youtube.com/watch?v=IG_8vNTAXbY', undefined, undefined, [
    'List three things about Yayoi and her mother.',
    'How did drawing dots help Yayoi? Explain and give examples.',
    'How did moving to America help Yayoi advance in her career? Explain and give an example.',
    'What was the most interesting for you in the clip?',
  ]],
  ['Renewable energy', 'https://www.youtube.com/watch?v=1kUE0BZtTRc', undefined, undefined, [
    'What is this clip about? Explain.',
    'What are some of the benefits of renewable energy? Explain and give examples.',
    'How can renewable energy be used to fight climate change?',
    'What was the most interesting for you in the clip? Explain and give an example.',
  ]],
  ['Pencils', 'https://www.youtube.com/watch?v=IBf9pXOmpFw', undefined, undefined, [
    'What is this clip about? Explain.',
    'What did you learn about how pencils are made?',
    'What is the purpose of the different kinds of pencils? Give examples.',
    'What was most interesting for you in the clip? Explain and give an example.',
  ]],
  ['Why books are here to stay', 'https://www.youtube.com/watch?v=6Gw5dK48MtI', undefined, undefined, [
    'After watching the clip, what have you learned about the history of books?',
    'How did people record history in ancient times before the invention of books?',
    'What is the purpose of books?',
    'What was most interesting for you in the clip?',
  ]],
  ['The history of chocolate', 'https://www.youtube.com/watch?v=ibjUpk9Iagk', '1:48', undefined, [
    'Where does chocolate come from? Explain.',
    'How was chocolate used before the 16th century?',
    'How did the invention of the cocoa press bring chocolate into a new era?',
    'What was the most interesting for you in the clip? Explain and give an example.',
  ]],
  ['Wildfires', 'https://www.youtube.com/watch?v=5hghT1W33cY', undefined, undefined, [
    'What is this clip about?',
    'What are the three components of wildfires? Explain.',
    'What are the causes of most wildfires? Give at least two examples.',
    'After watching the clip, what can you do to stop wildfires? Explain and give an example.',
  ]],
  ['Climate change', 'https://www.youtube.com/watch?v=G4H1N_yXBiA', undefined, undefined, [
    'What is this clip about?',
    'How does climate change affect the oceans?',
    'What are the challenges that changes in weather pose? Explain and give examples.',
    'What was the most interesting for you in the clip? Explain and give an example.',
  ]],
  ['What caffeine does to your body', 'https://www.youtube.com/watch?v=QBK4SNSjnmY', undefined, undefined, [
    'What is this clip about?',
    'What are the benefits of caffeine?',
    'What happens when the body builds tolerance to caffeine? Explain and give an example.',
    'What was the most interesting for you in the clip? Explain and give an example.',
  ]],
  ['Benjamin Banneker', 'https://www.youtube.com/watch?v=DKnwyVR4P88', undefined, undefined, [
    'What is this clip about? Explain.',
    'List three things about Banneker’s early life.',
    'What were Banneker’s achievements in his adult life?',
    'Why did Banneker send a letter to Jefferson? What did he want to achieve? Explain.',
  ]],
  // No video link in the teacher's list, so it stays a draft.
  ['Vitamins', null, undefined, undefined, [
    'What is this clip about? Explain.',
    'How can a deficiency of vitamins arise? Explain and give examples.',
    'What do you learn about the two kinds of vitamins? Give an example.',
    'What are the benefits of vitamins? Explain and give two examples.',
    'What would you recommend to people who want to take vitamins?',
  ]],
  ['Why 1.5 billion people eat with chopsticks', 'https://www.youtube.com/watch?v=tSciinXdGhI', undefined, undefined, [
    'What is this clip about?',
    'What did you learn about the use of chopsticks? Explain and give examples.',
    'What did you learn about the different kinds of chopsticks?',
    'What was the most interesting for you in the clip?',
  ]],
  ['Buttons', 'https://youtu.be/7LN4L5EMmmc', undefined, undefined, [
    'What is this clip about?',
    'What have you learned about the design of the buttons?',
    'How have buttons changed fashion? Explain and give examples.',
    'What was the most interesting for you in the clip?',
  ]],
];

/** `YYYY-MM-DD`, n days after 2026-09-01. */
const day = (n: number) => new Date(Date.UTC(2026, 8, 1 + n)).toISOString().slice(0, 10);

export const clipExercises = (): Exercise[] => CLIPS.map(([title, url, start, end, questions], i) => ({
  id: `v${i + 1}`, title, kind: 'video', status: url ? 'published' : 'draft',
  // Made up: a mix of time limits (some short enough for class), and a few first-take-only.
  timeLimit: [10, 5, 15, 3, 10, 5][i % 6], allowRerecord: i % 7 !== 3, questionMode: 'read', dateCreated: day(i * 2),
  material: { url: url ?? '', ...(start && { start }), ...(end && { end }) },
  // The last question asks for opinion and examples: a longer target.
  questions: questions.map((promptText, j) => ({
    id: `v${i + 1}q${j + 1}`, promptText, targetSeconds: j === questions.length - 1 ? 90 : 60,
  })),
}));

export const moreStudents: Student[] = [
  ['Lior Ben-David', 'Aleph'], ['Shira Katz', 'Aleph'], ['Adam Shalom', 'Aleph'],
  ['Rawan Khoury', 'Bet'], ['Ahmad Nassar', 'Bet'], ['Lina Haddad', 'Bet'], ['Yara Mansour', 'Bet'],
  ['Omar Saleh', 'Gimel'], ['Hila Golan', 'Gimel'], ['Karim Abbas', 'Gimel'], ['Daniel Azoulay', undefined],
].map(([name, className], i) => ({
  id: `s${i + 6}`, name: name as string, ...(className && { className }),
  securityCode: ['P4W8-A3RK', 'Z9C3-MF7T', 'D6J2-XB5Q', 'T3V7-KW9N', 'G8K5-RD2H', 'N2R9-CY6P', 'X5F4-JT8M', 'Q7H3-PV4Z', 'C9M6-HN3W', 'W2B8-ZK7F', 'F6Y4-DQ2X'][i],
  dateCreated: '2026-09-04',
}));

/**
 * Two clips given to a class each, with a mix of states, so lists look like a real term.
 * Submitted ones get made-up answers.
 */
export function clipAssignments(): { assignments: Assignment[]; answers: Answer[]; feedback: Feedback[] } {
  const plan: [string, string[], string, string][] = [
    // [exercise, students, assigned, due]
    ['v5', ['s1', 's2', 's3', 's6', 's7', 's8'], '2026-10-20', '2026-10-27'],
    ['v14', ['s4', 's5', 's9', 's10', 's11', 's12'], '2026-11-03', '2026-11-09'],
    ['v7', ['s13', 's14', 's15', 's16'], '2026-11-08', '2026-11-15'],
  ];
  const states: Assignment['state'][] = ['submitted', 'submitted', 'active', 'notStarted', 'submitted', 'paused'];
  const assignments: Assignment[] = [];
  const answers: Answer[] = [];
  let n = 0;
  for (const [exerciseId, students, dateAssigned, dueDate] of plan) {
    const qCount = CLIPS[Number(exerciseId.slice(1)) - 1][4].length;
    students.forEach((studentId, k) => {
      const id = `ca${++n}`;
      const state = states[(k + n) % states.length];
      const started = state !== 'notStarted';
      const submittedDay = day(Math.round((Date.parse(dateAssigned) - Date.parse('2026-09-01')) / 864e5) + 2 + (k % 4));
      assignments.push({
        id, studentId, exerciseId, dateAssigned, dueDate, state,
        secondsTaken: started ? 240 + k * 37 : 0,
        ...(started && { dateStarted: `${dateAssigned}T16:00:00Z` }),
        ...(state === 'submitted' && { dateSubmitted: `${submittedDay}T17:30:00Z` }),
      });
      if (state !== 'notStarted') {
        for (let q = 1; q <= (state === 'submitted' ? qCount : 2); q++) {
          answers.push({
            assignmentId: id, questionId: `${exerciseId}q${q}`, recording: `fake-audio/${id}-q${q}.webm`,
            duration: 35 + ((k * 17 + q * 23) % 70), dateRecorded: `${dateAssigned}T16:30:00Z`,
          });
        }
      }
    });
  }
  // The earliest clip's submissions are reviewed and published.
  const feedback: Feedback[] = assignments
    .filter(a => a.exerciseId === 'v5' && a.state === 'submitted')
    .map(a => ({
      assignmentId: a.id, status: 'published', dateStarted: `${a.dueDate}T09:00:00Z`, datePublished: `${a.dueDate}T09:30:00Z`,
      overall: { text: 'Good answers with examples from the clip. Try to explain a bit more.' },
      answerFeedback: {},
    }));
  return { assignments, answers, feedback };
}
