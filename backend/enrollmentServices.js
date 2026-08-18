import { apiRequest } from './apiClient';

export async function enrollStudent(student_id, course_id) {
  return apiRequest('/enrollments/students/', {
    method: 'POST',
    body: { student_id, course_id },
  });
}