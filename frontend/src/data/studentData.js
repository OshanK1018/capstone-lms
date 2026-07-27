// Temporary student data
// This will be replaced with API/database data during backend integration
export const studentProfile = {
  name: "Olivia",
  studentId: "12345678",
  term: "Summer 2026",
};

export const enrolledCourses = [
  {
    id: 1,
    code: "ENG 101",
    title: "English Composition I",
    instructor: "Prof. Jennifer Adams",
  },
  {
    id: 2,
    code: "MATH 201",
    title: "Calculus I",
    instructor: "Prof. Robert Williams",
  },
  {
    id: 3,
    code: "PHYS 150",
    title: "General Physics I",
    instructor: "Prof. David Chen",
  },
];

export const upcomingAssignments = [
  {
    id: 1,
    title: "Integration Problem Set",
    courseCode: "MATH 201",
    dueDate: "July 20",
    status: "Incomplete",
  },
  {
    id: 2,
    title: "Lab Report #2",
    courseCode: "PHYS 150",
    dueDate: "July 24",
    status: "Incomplete",
  },
  {
    id: 3,
    title: "Discussion Post: Shakespeare Reading",
    courseCode: "ENG 101",
    dueDate: "July 25",
    status: "Incomplete",
  },
];

export const upcomingQuizzes = [
  {
    id: 1,
    title: "Quiz 3: Limits and Continuity",
    courseCode: "MATH 201",
    dueDate: "July 22",
    status: "Upcoming",
  },
  {
    id: 2,
    title: "Reading Check: Shakespeare",
    courseCode: "ENG 101",
    dueDate: "July 26",
    status: "Upcoming",
  },
];

export const announcements = [
  {
    id: 1,
    date: "July 18",
    courseCode: "MATH 201",
    message: "Quiz 3 will be available this Friday.",
  },
  {
    id: 2,
    date: "July 12",
    courseCode: "ENG 101",
    message: "Essay #2 due date has been extended to July 12.",
  },
];

export const recentGrades = [
  {
    id: 1,
    title: "Lab Report 1",
    courseCode: "PHYS 150",
    score: "50/50",
  },
  {
    id: 2,
    title: "Essay 1",
    courseCode: "ENG 101",
    score: "40/50",
  },
  {
    id: 3,
    title: "Quiz 1",
    courseCode: "MATH 201",
    score: "30/50",
  },
];