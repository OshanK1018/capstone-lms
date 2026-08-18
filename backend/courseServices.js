import { getToken } from "./apiHelper.js";
import { apiRequest } from "./apiHelper.js";

export async function createCourseWithTerm(
  title,
  term,
  instructor_id,
  max_seats = 30,
  credits = 3,
  materials_url = null
) {
  return apiRequest('/Courses', 
    {
        method: 'POST',
        body: { title, term, instructor_id, max_seats, credits, materials_url },
    }
    );
}

export async function createCourseWithDate(
  title,
  start_date,
  end_date,
  instructor_id,
  max_seats = 30,
  credits = 3,
  materials_url = null
) {
  return apiRequest('/Courses/exactDate', 
    {
        method: 'POST',
        body: { title, start_date, end_date, instructor_id, max_seats, credits, materials_url },
    }
    );
}

export async function getCoursesForInstructor(instructorId) {
  return apiRequest(`/courses/instructor/${instructorId}`, { method: 'GET' });
}

export async function getCoursesForStudent(studentId) {
  return apiRequest(`/courses/student/${studentId}`, { method: 'GET' });
}

export async function getCourseById(courseId) {
  return apiRequest(`/courses/${courseId}`, { method: 'GET' });
}

export async function getStudentsInCourse(courseId) {
  return apiRequest(`/courses/students/${courseId}`, { method: 'GET' });
}