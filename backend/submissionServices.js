import { apiRequest } from "./apiHelper.js";

export async function createSubmission(
  assignment_id,
  student_id,
  submission_link,
  score = null,
  feedback = null
) {
  return apiRequest('/Submissions', {
    method: 'POST',
    body: { assignment_id, student_id, submission_link, score, feedback },
  });
}