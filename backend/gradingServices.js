import { apiRequest } from './apiClient';

export async function assignCourseGrade(student_id, course_id, letter_grade) {
  return apiRequest('/Course_Grades', {
    method: 'POST',
    body: { student_id, course_id, letter_grade },
  });
}