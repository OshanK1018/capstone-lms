import { apiRequest } from './apiClient';

export async function createAnnouncement(course_id, title, message) {
  return apiRequest('/Announcements', {
    method: 'POST',
    body: { course_id, title, message },
  });
}

export async function getAnnouncementsForCourse(courseId) {
  return apiRequest(`/courses/announcements/${courseId}`, { method: 'GET' });
}