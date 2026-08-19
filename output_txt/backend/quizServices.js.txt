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

export async function getQuizQuestions(quizId) {
  return apiRequest(`/Quizzes/${quizId}/questions`, { method: 'GET' });
}

export async function getQuizAttempts(quizId) {
  return apiRequest(`/Quizzes/${quizId}/attempts`, { method: 'GET' });
}

export async function updateQuiz(quizId, updates) {
  return apiRequest(`/Quizzes/${quizId}`, {
    method: 'PUT',
    body: updates,
  });
}

export async function updateQuizQuestion(questionId, updates) {
  return apiRequest(`/Quiz_Questions/${questionId}`, {
    method: 'PUT',
    body: updates,
  });
}

export async function deleteQuizQuestion(questionId) {
  return apiRequest(`/Quiz_Questions/${questionId}`, {
    method: 'DELETE',
  });
}