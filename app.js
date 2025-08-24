import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ---------- Firebase Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyDjEx7MYbz17zZmeL4mxxTvHZiS4xZMmDc",
  authDomain: "hammad-s-academy.firebaseapp.com",
  projectId: "hammad-s-academy",
  storageBucket: "hammad-s-academy.firebasestorage.app",
  messagingSenderId: "521710421982",
  appId: "1:521710421982:web:2525b13052d6094a23bf4f",
  measurementId: "G-89CRMCN19T",
  databaseURL: "https://hammad-s-academy-default-rtdb.firebaseio.com/"
};

//  Firebase Init 
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Quiz panel
let currentQuizData = {
  name: '',
  rollNumber: '',
  subject: '',
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  selectedAnswer: null,
  showingResult: false
};

//  Navigation 
function showStudentPage() {
  document.getElementById('studentPage').classList.remove('hidden');
  document.getElementById('teacherPage').classList.add('hidden');
  resetQuiz();
}

function showTeacherPage() {
  document.getElementById('studentPage').classList.add('hidden');
  document.getElementById('teacherPage').classList.remove('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

//  Teacher Authentication 
async function teacherSignup(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await push(ref(db, 'users/' + user.uid), {
      name: name,
      email: email,
      role: 'teacher'
    });
    alert("Teacher registered: " + user.email);
  } catch (err) {
    alert(err.message);
  }
}

async function teacherLogin(event) {
  event.preventDefault();
  const email = document.getElementById('teacherEmail').value;
  const password = document.getElementById('teacherPassword').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    alert("Logged in as " + user.email);
  } catch (err) {
    alert(err.message);
  }
}

function teacherLogout() {
  signOut(auth).then(() => {
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) console.log("User logged in: " + user.email);
});

//  Realtime Database
async function addQuestion(event) {
  event.preventDefault();

  const questionData = {
    subject: document.getElementById('questionSubject').value,
    question: document.getElementById('questionInput').value,
    options: [
      document.getElementById('optionA').value,
      document.getElementById('optionB').value,
      document.getElementById('optionC').value,
      document.getElementById('optionD').value
    ],
    answer: document.getElementById('correctAnswer').value
  };

  try {
    await push(ref(db, 'questions'), questionData);
    alert("Question added successfully!");
    event.target.reset();
  } catch (err) {
    alert(err.message);
  }
}

async function getQuestionsFromRealtime(subject, numQuestions) {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "questions"));
  let questions = [];

  if (snapshot.exists()) {
    snapshot.forEach(q => {
      const data = q.val();
      if (data.subject === subject) questions.push(data);
    });
  }

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, numQuestions);
}



// NO COPYPASTE
document.addEventListener('copy', function(event) {
    event.clipboardData.setData('text/plain', 'To prevent cheating copy paste is not allowed.');
    event.preventDefault();
});

// ---------- Student Quiz ----------
async function startQuiz(event) {
  event.preventDefault();
  const name = document.getElementById('studentName').value;
  const rollNumber = document.getElementById('rollNumber').value;
  const subject = document.getElementById('subject').value;
  const numQuestions = parseInt(document.getElementById('numQuestions').value);

  currentQuizData = {
    name,
    rollNumber,
    subject,
    questions: await getQuestionsFromRealtime(subject, numQuestions),
    currentQuestionIndex: 0,
    score: 0,
    selectedAnswer: null,
    showingResult: false
  };

  if (currentQuizData.questions.length === 0) {
    alert("No questions found for this subject!");
    return;
  }

  document.getElementById('studentForm').classList.add('hidden');
  document.getElementById('quizSection').classList.remove('hidden');
  document.getElementById('totalQuestions').textContent = currentQuizData.questions.length;
  displayQuestion();
}

function displayQuestion() {
  const q = currentQuizData.questions[currentQuizData.currentQuestionIndex];
  document.getElementById('currentQuestion').textContent = currentQuizData.currentQuestionIndex + 1;
  document.getElementById('currentScore').textContent = currentQuizData.score;
  document.getElementById('questionText').textContent = q.question;

  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];

  q.options.forEach((optionText, idx) => {
    const letter = labels[idx];

    const btn = document.createElement('button');
    btn.className = 'option-button w-full text-left px-4 py-2 border rounded-lg hover:bg-blue-100 transition-colors';
    btn.textContent = `${letter}. ${optionText}`;
    btn.setAttribute('data-option', letter);

    btn.onclick = () => {
      // clear previous highlight
      Array.from(optionsContainer.children).forEach(b => b.classList.remove('bg-blue-500','text-white'));
      // highlight selected
      btn.classList.add('bg-blue-500','text-white');

      currentQuizData.selectedAnswer = letter;        // <-- store A/B/C/D
      document.getElementById('submitButton').disabled = false;
      document.getElementById('nextButton').disabled = true;
    };

    optionsContainer.appendChild(btn);
  });

  // reset buttons for new question
  currentQuizData.selectedAnswer = null;
  document.getElementById('submitButton').disabled = true;
  document.getElementById('nextButton').disabled = true;
}

function submitAnswer() {
  const q = currentQuizData.questions[currentQuizData.currentQuestionIndex];
  const correct = q.answer;                           // "A" | "B" | "C" | "D"
  const selected = currentQuizData.selectedAnswer;

  if (!selected) return; // nothing selected, just in case

  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => {
    btn.disabled = true;
    const letter = btn.getAttribute('data-option');

    if (letter === correct) {
      btn.classList.add('bg-green-500','text-white'); // correct → green
    } else if (letter === selected) {
      btn.classList.add('bg-red-500','text-white');   // wrong selected → red
    }
  });

  if (selected === correct) currentQuizData.score++;

  document.getElementById('submitButton').disabled = true;
  document.getElementById('nextButton').disabled = false;
}

function nextQuestion() {
  if (currentQuizData.currentQuestionIndex === currentQuizData.questions.length - 1) {
    showResults();
    return;
  }

  currentQuizData.currentQuestionIndex++;
  displayQuestion();
}

function showResults() {
  // Hide quiz section
  const quiz = document.getElementById('quizSection');
  quiz.classList.add('hidden');
  quiz.style.display = "none";   // extra safety

  // Show result section
  const result = document.getElementById('resultSection');
  result.classList.remove('hidden');
  result.style.display = "block"; // force show

  // Fill details
  document.getElementById('resultName').textContent = currentQuizData.name;
  document.getElementById('resultRoll').textContent = currentQuizData.rollNumber;
  document.getElementById('resultSubject').textContent = currentQuizData.subject;
  document.getElementById('finalScore').textContent =
    `${currentQuizData.score} / ${currentQuizData.questions.length}`;
}


function resetQuiz() {
  // Show form again
  document.getElementById('studentForm').classList.remove('hidden');

  // Hide quiz + result
  document.getElementById('quizSection').classList.add('hidden');
  document.getElementById('quizSection').style.display = "none";

  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('resultSection').style.display = "none";

  // Reset quiz data
  currentQuizData = {
    name: '',
    rollNumber: '',
    subject: '',
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    selectedAnswer: null,
    showingResult: false
  };
}




//  functions 
window.showStudentPage = showStudentPage;
window.showTeacherPage = showTeacherPage;
window.startQuiz = startQuiz;
window.displayQuestion = displayQuestion;
window.submitAnswer = submitAnswer;
window.nextQuestion = nextQuestion;
window.addQuestion = addQuestion;
window.teacherLogin = teacherLogin;
window.teacherLogout = teacherLogout;
window.resetQuiz = resetQuiz;
window.teacherSignup = teacherSignup;
window.showResults = showResults;






