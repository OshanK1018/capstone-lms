import { apiRequest } from './apiHelper.js';

export async function createQuiz(course_id, title, due_date) {
  return apiRequest('/Quizzes', {
    method: 'POST',
    body: { course_id, title, due_date },
  });
}

export async function getQuizzesForCourse(courseId) {
  return apiRequest(`/courses/quizzes/${courseId}`, { method: 'GET' });
}

export async function createQuizQuestion(quiz_id, question_text, correct_answer, score = null) {
  return apiRequest('/Quiz_Questions', {
    method: 'POST',
    body: { quiz_id, question_text, correct_answer, score },
  });
}

export async function createQuizAttempt(quiz_id, student_id, score) {
  return apiRequest('/Quiz_Attempts', {
    method: 'POST',
    body: { quiz_id, student_id, score },
  });
}

export async function getQuizAttemptsForStudent(studentId) {
  return apiRequest(`/students/quiz_attempts/${studentId}`, { method: 'GET' });
}