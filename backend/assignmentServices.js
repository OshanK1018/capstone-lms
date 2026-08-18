import { apiRequest } from './apiClient';

export async function createAssignment(
  course_id,
  title,
  due_date,
  max_points = 100,
  assignment_link,
  allow_resubmission = false
) {
  return apiRequest('/Assignments', {
    method: 'POST',
    body: { course_id, title, due_date, max_points, assignment_link, allow_resubmission },
  });
}

export async function getAssignmentsForCourse(courseId) {
  return apiRequest(`/courses/assignments/${courseId}`, { method: 'GET' });
}