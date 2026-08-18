import { apiRequest } from './apiHelper.js';

export async function assignCourseGrade(studentId, courseId, letterGrade, score = null) {
  const body = { student_id: studentId, course_id: courseId, letter_grade: letterGrade };
  if (score !== null && score !== undefined) {
    body.score = score;
  }
  return apiRequest('/Course_Grades', {
    method: 'POST',
    body,
  });
}

export async function updateCourseGrade(studentId, courseId, letterGrade, score = null) {
  const body = { letter_grade: letterGrade };
  if (score !== null && score !== undefined) {
    body.score = score;
  }

  return apiRequest(`/Course_Grades/${studentId}/${courseId}/update`, {
    method: 'PATCH',
    body,
  });
}