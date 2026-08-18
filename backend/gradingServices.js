import { apiRequest } from './apiHelper.js';

export async function assignCourseGrade(student_id, course_id, letter_grade) {
  return apiRequest('/Course_Grades', {
    method: 'POST',
    body: { student_id, course_id, letter_grade },
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