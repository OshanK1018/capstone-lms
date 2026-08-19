import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileEdit,
  FileText,
  Paperclip,
  Plus,
  Save,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import {
  getCurrentUser,
} from "../../backend/authServices.js";

import {
  getCoursesForInstructor,
} from "../../backend/courseServices.js";

import {
  createAssignment,
  getAssignmentsForCourse,
} from "../../backend/assignmentServices.js";

import "./InstructorAssignments.css";

const temporaryCategories = [
  "Assignments",
  "Quizzes",
  "Projects",
  "Midterm",
  "Final Exam",
];

/*
 * Student submissions remain temporary until
 * instructor-side submission retrieval and
 * grading service functions are available.
 */
const temporarySubmissions = [
  {
    id: 1,
    studentId: "10024567",
    studentName: "Alex Johnson",
    submittedAt: "August 10, 2026",
    status: "Submitted",
    grade: "",
    feedback: "",
    writtenResponse:
      "For this project, I created a responsive website using CSS Grid and Flexbox. I also added media queries so the layout adjusts properly on tablets and mobile devices.",
    submittedFile:
      "alex-responsive-project.zip",
  },
  {
    id: 2,
    studentId: "10024568",
    studentName: "Jordan Smith",
    submittedAt: "August 10, 2026",
    status: "Submitted",
    grade: "",
    feedback: "",
    writtenResponse:
      "My project focuses on responsive navigation and reusable React components.",
    submittedFile:
      "jordan-project.pdf",
  },
  {
    id: 3,
    studentId: "10024569",
    studentName: "Taylor Brown",
    submittedAt: "August 11, 2026",
    status: "Graded",
    grade: "92",
    feedback:
      "Great work overall.",
    writtenResponse:
      "I used responsive CSS layouts and tested the page at multiple screen sizes.",
    submittedFile:
      "taylor-project.zip",
  },
];

function getResponseData(result) {
  return result?.data ?? result;
}

function getCoursesFromResult(result) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.courses)
  ) {
    return data.courses;
  }

  return [];
}

function getAssignmentsFromResult(
  result
) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.assignments)
  ) {
    return data.assignments;
  }

  return [];
}

function normalizeCourse(
  course,
  index
) {
  return {
    ...course,

    id:
      course.id ??
      course.course_id ??
      course.courseID,

    code:
      course.code ??
      course.course_code ??
      course.courseCode ??
      `COURSE ${index + 1}`,

    name:
      course.name ??
      course.title ??
      course.course_name ??
      course.courseName ??
      "Untitled Course",

    students:
      Number(
        course.students ??
          course.student_count ??
          course.total_students ??
          course.seats_taken ??
          0
      ),
  };
}

function normalizeAssignment(
  assignment,
  course
) {
  return {
    ...assignment,

    id:
      assignment.id ??
      assignment.assignment_id,

    title:
      assignment.title ??
      "Untitled Assignment",

    courseId:
      course.id,

    courseCode:
      course.code,

    courseName:
      course.name,

    dueDate:
      assignment.dueDate ??
      assignment.due_date ??
      "",

    category:
      assignment.category ??
      "Assignments",

    points:
      Number(
        assignment.points ??
          assignment.max_points ??
          100
      ),

    description:
      assignment.description ??
      "",

    submissions:
      Number(
        assignment.submissions ??
          assignment.submission_count ??
          0
      ),

    totalStudents:
      Number(
        course.students ?? 0
      ),

    status:
      assignment.status ??
      "Published",

    allowResubmission:
      Boolean(
        assignment.allowResubmission ??
          assignment.allow_resubmission ??
          false
      ),

    submissionType:
      assignment.submissionType ??
      assignment.submission_type ??
      "File Upload",

    instructorFile:
      assignment.instructorFile ??
      "",

    assignmentLink:
      assignment.assignmentLink ??
      assignment.assignment_link ??
      "",
  };
}

function InstructorAssignments() {
  const [assignments, setAssignments] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [
    instructorID,
    setInstructorID,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState("All Courses");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All Statuses");

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    showManageModal,
    setShowManageModal,
  ] = useState(false);

  const [
    showSubmissionModal,
    setShowSubmissionModal,
  ] = useState(false);

  const [
    selectedAssignment,
    setSelectedAssignment,
  ] = useState(null);

  const [submissions, setSubmissions] =
    useState(
      temporarySubmissions
    );

  const [
    selectedSubmission,
    setSelectedSubmission,
  ] = useState(null);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    assignmentForm,
    setAssignmentForm,
  ] = useState({
    title: "",
    courseId: "",
    description: "",
    dueDate: "",
    category: "",
    points: "",
    status: "Draft",
    allowResubmission: false,
    submissionType:
      "File Upload",
    instructorFile: "",
    assignmentLink: "",
  });

  /*
   * Load the logged-in instructor,
   * their real courses, and assignments
   * for each of those courses.
   */
  useEffect(() => {
    async function loadAssignmentsPage() {
      setIsLoading(true);
      setPageError("");

      const userResult =
        await getCurrentUser();

      if (!userResult.success) {
        setPageError(
          userResult.error ||
            "Unable to load the current instructor."
        );

        setIsLoading(false);
        return;
      }

      const user =
        userResult.user ??
        userResult.data?.user ??
        userResult.data;

      const currentInstructorID =
        user?.user_id ??
        user?.id ??
        user?.userId;

      if (!currentInstructorID) {
        setPageError(
          "The logged-in instructor ID could not be found."
        );

        setIsLoading(false);
        return;
      }

      setInstructorID(
        currentInstructorID
      );

      const courseResult =
        await getCoursesForInstructor(
          currentInstructorID
        );

      if (!courseResult.success) {
        setPageError(
          courseResult.error ||
            "Unable to load instructor courses."
        );

        setIsLoading(false);
        return;
      }

      const backendCourses =
        getCoursesFromResult(
          courseResult
        );

      const normalizedCourses =
        backendCourses.map(
          (course, index) =>
            normalizeCourse(
              course,
              index
            )
        );

      setCourses(
        normalizedCourses
      );

      const assignmentRequests =
        normalizedCourses.map(
          async (course) => {
            if (!course.id) {
              return [];
            }

            const assignmentResult =
              await getAssignmentsForCourse(
                course.id
              );

            if (
              !assignmentResult.success
            ) {
              return [];
            }

            const backendAssignments =
              getAssignmentsFromResult(
                assignmentResult
              );

            return backendAssignments.map(
              (assignment) =>
                normalizeAssignment(
                  assignment,
                  course
                )
            );
          }
        );

      const assignmentGroups =
        await Promise.all(
          assignmentRequests
        );

      setAssignments(
        assignmentGroups.flat()
      );

      setIsLoading(false);
    }

    loadAssignmentsPage();
  }, []);

  const reloadAssignmentsForCourse =
    async (course) => {
      if (!course?.id) {
        return;
      }

      const result =
        await getAssignmentsForCourse(
          course.id
        );

      if (!result.success) {
        setPageError(
          result.error ||
            "Unable to refresh assignments."
        );

        return;
      }

      const backendAssignments =
        getAssignmentsFromResult(
          result
        );

      const normalizedAssignments =
        backendAssignments.map(
          (assignment) =>
            normalizeAssignment(
              assignment,
              course
            )
        );

      setAssignments(
        (previousAssignments) => [
          ...previousAssignments.filter(
            (assignment) =>
              String(
                assignment.courseId
              ) !==
              String(course.id)
          ),

          ...normalizedAssignments,
        ]
      );
    };

  const courseOptions =
    useMemo(() => {
      return [
        "All Courses",
        ...new Set(
          assignments.map(
            (assignment) =>
              assignment.courseCode
          )
        ),
      ];
    }, [assignments]);

  const filteredAssignments =
    useMemo(() => {
      return assignments.filter(
        (assignment) => {
          const normalizedSearch =
            searchTerm
              .toLowerCase()
              .trim();

          const matchesSearch =
            assignment.title
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            assignment.courseCode
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            assignment.courseName
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesCourse =
            selectedCourse ===
              "All Courses" ||
            assignment.courseCode ===
              selectedCourse;

          const matchesStatus =
            selectedStatus ===
              "All Statuses" ||
            assignment.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesCourse &&
            matchesStatus
          );
        }
      );
    }, [
      assignments,
      searchTerm,
      selectedCourse,
      selectedStatus,
    ]);

  const publishedAssignments =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "Published"
    ).length;

  const draftAssignments =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "Draft"
    ).length;

  const totalSubmissions =
    assignments.reduce(
      (total, assignment) =>
        total +
        Number(
          assignment.submissions ||
            0
        ),
      0
    );

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      courseId: "",
      description: "",
      dueDate: "",
      category: "",
      points: "",
      status: "Draft",
      allowResubmission: false,
      submissionType:
        "File Upload",
      instructorFile: "",
      assignmentLink: "",
    });

    setFormError("");
  };

  const handleAssignmentFormChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setAssignmentForm(
      (previousForm) => ({
        ...previousForm,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );

    setFormError("");
  };

  const handleInstructorFile = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    setAssignmentForm(
      (previousForm) => ({
        ...previousForm,

        instructorFile:
          file
            ? file.name
            : "",
      })
    );
  };

  /*
   * Creates the assignment through
   * assignmentServices.js.
   */
  const handleCreateAssignment =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        !assignmentForm.title.trim() ||
        !assignmentForm.courseId ||
        !assignmentForm.dueDate ||
        !assignmentForm.category ||
        !assignmentForm.points
      ) {
        setFormError(
          "Please complete all required assignment fields."
        );

        return;
      }

      const selectedCourseInformation =
        courses.find(
          (course) =>
            String(course.id) ===
            String(
              assignmentForm.courseId
            )
        );

      if (
        !selectedCourseInformation
      ) {
        setFormError(
          "Please select a valid course."
        );

        return;
      }

      setIsCreating(true);

      const formattedDueDate =
        `${assignmentForm.dueDate} 23:59:59`;

      const result =
        await createAssignment(
          Number(
            assignmentForm.courseId
          ),
          assignmentForm.title.trim(),
          formattedDueDate,
          Number(
            assignmentForm.points
          ),
          assignmentForm.assignmentLink.trim() ||
            null,
          assignmentForm.allowResubmission
        );

      setIsCreating(false);

      if (!result.success) {
        setFormError(
          result.error ||
            "Unable to create assignment."
        );

        return;
      }

      /*
       * Reload the course's assignments
       * from the backend so the page
       * displays the real stored data.
       */
      await reloadAssignmentsForCourse(
        selectedCourseInformation
      );

      setShowCreateModal(false);

      resetAssignmentForm();
    };

  const handleManageAssignment = (
    assignment
  ) => {
    setSelectedAssignment({
      ...assignment,
    });

    setSelectedSubmission(null);

    setSaveMessage("");

    setShowManageModal(true);
  };

  const handleManageAssignmentChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSelectedAssignment(
      (previousAssignment) => ({
        ...previousAssignment,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );

    setSaveMessage("");
  };

  /*
   * No update-assignment service has been
   * connected yet, so editing remains local.
   */
  const handleSaveAssignment =
    () => {
      setAssignments(
        (previousAssignments) =>
          previousAssignments.map(
            (assignment) =>
              assignment.id ===
              selectedAssignment.id
                ? {
                    ...selectedAssignment,

                    points:
                      Number(
                        selectedAssignment.points
                      ),
                  }
                : assignment
          )
      );

      setSaveMessage(
        "Assignment changes saved temporarily."
      );
    };

  const handleSubmissionSelect = (
    submission
  ) => {
    setSelectedSubmission({
      ...submission,
    });

    setSaveMessage("");
  };

  const handleSubmissionChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setSelectedSubmission(
      (previousSubmission) => ({
        ...previousSubmission,

        [name]: value,
      })
    );
  };

  const handleViewSubmission =
    () => {
      if (!selectedSubmission) {
        return;
      }

      setShowSubmissionModal(true);
    };

  /*
   * Submission grading remains temporary
   * until an instructor grading/update
   * service is available.
   */
  const handleSaveGrade = () => {
    if (
      selectedSubmission.grade ===
        "" ||
      Number(
        selectedSubmission.grade
      ) < 0 ||
      Number(
        selectedSubmission.grade
      ) >
        Number(
          selectedAssignment.points
        )
    ) {
      setSaveMessage(
        `Enter a grade between 0 and ${selectedAssignment.points}.`
      );

      return;
    }

    const updatedSubmission = {
      ...selectedSubmission,

      status: "Graded",
    };

    setSubmissions(
      (previousSubmissions) =>
        previousSubmissions.map(
          (submission) =>
            submission.id ===
            updatedSubmission.id
              ? updatedSubmission
              : submission
        )
    );

    setSelectedSubmission(
      updatedSubmission
    );

    setSaveMessage(
      "Student grade saved temporarily."
    );
  };

  return (
    <div className="assignments-layout">
      <InstructorSidebar />

      <main className="assignments-main-content">
        <header className="assignments-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>Assignments</h1>

            <p>
              Create, publish, and manage
              course assignments.
            </p>
          </div>

          <button
            className="assignments-primary-button"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            <Plus size={19} />
            Create Assignment
          </button>
        </header>

        {pageError && (
          <div
            style={{
              margin:
                "20px 0",
              padding:
                "12px 14px",
              border:
                "1px solid #fecaca",
              borderRadius:
                "8px",
              background:
                "#fef2f2",
              color:
                "#b91c1c",
              fontSize:
                "13px",
              fontWeight:
                "600",
            }}
          >
            {pageError}
          </div>
        )}

        <section className="assignment-stat-grid">
          <article className="assignment-stat-card">
            <div className="assignment-stat-icon total">
              <ClipboardList
                size={22}
              />
            </div>

            <div>
              <span>
                Total Assignments
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : assignments.length}
              </strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon published">
              <CheckCircle2
                size={22}
              />
            </div>

            <div>
              <span>
                Published
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : publishedAssignments}
              </strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon draft">
              <FileEdit
                size={22}
              />
            </div>

            <div>
              <span>
                Drafts
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : draftAssignments}
              </strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon submissions">
              <Users size={22} />
            </div>

            <div>
              <span>
                Submissions
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : totalSubmissions}
              </strong>
            </div>
          </article>
        </section>

        <section className="assignment-filter-section">
          <div className="assignment-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search assignments or courses..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="assignment-filter-controls">
            <select
              value={
                selectedCourse
              }
              onChange={(event) =>
                setSelectedCourse(
                  event.target.value
                )
              }
            >
              {courseOptions.map(
                (course) => (
                  <option
                    key={
                      course
                    }
                    value={
                      course
                    }
                  >
                    {course}
                  </option>
                )
              )}
            </select>

            <select
              value={
                selectedStatus
              }
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value
                )
              }
            >
              <option value="All Statuses">
                All Statuses
              </option>

              <option value="Published">
                Published
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Closed">
                Closed
              </option>
            </select>
          </div>
        </section>

        <section className="assignment-list-panel">
          <div className="assignment-list-heading">
            <div>
              <h2>
                All Assignments
              </h2>

              <p>
                {isLoading
                  ? "Loading assignments..."
                  : `Showing ${filteredAssignments.length} of ${assignments.length} assignments`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-assignment-message">
              <Clock size={36} />

              <h3>
                Loading assignments...
              </h3>

              <p>
                Retrieving assignments
                from your courses.
              </p>
            </div>
          ) : filteredAssignments.length >
            0 ? (
            <div className="assignment-table-wrapper">
              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>
                      Assignment
                    </th>

                    <th>
                      Course
                    </th>

                    <th>
                      Due Date
                    </th>

                    <th>
                      Submissions
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignments.map(
                    (
                      assignment
                    ) => (
                      <tr
                        key={
                          assignment.id
                        }
                      >
                        <td>
                          <div className="assignment-name-cell">
                            <div className="assignment-file-icon">
                              <ClipboardList
                                size={
                                  19
                                }
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  assignment.title
                                }
                              </strong>

                              <span>
                                {
                                  assignment.category
                                }{" "}
                                •{" "}
                                {
                                  assignment.points
                                }{" "}
                                pts
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="assignment-course-cell">
                            <strong>
                              {
                                assignment.courseCode
                              }
                            </strong>

                            <span>
                              {
                                assignment.courseName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="assignment-date-cell">
                            <CalendarDays
                              size={
                                17
                              }
                            />

                            <span>
                              {
                                assignment.dueDate
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="assignment-submission-cell">
                            <span>
                              {
                                assignment.submissions
                              }
                              /
                              {
                                assignment.totalStudents
                              }
                            </span>

                            <div className="submission-progress">
                              <div
                                className="submission-progress-fill"
                                style={{
                                  width:
                                    assignment.totalStudents >
                                    0
                                      ? `${
                                          (assignment.submissions /
                                            assignment.totalStudents) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`assignment-status ${assignment.status
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
                          >
                            {
                              assignment.status
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            className="assignment-action-button"
                            onClick={() =>
                              handleManageAssignment(
                                assignment
                              )
                            }
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-assignment-message">
              <Clock size={36} />

              <h3>
                No assignments found
              </h3>

              <p>
                Try changing your search
                or filter selections.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="assignment-modal-overlay">
          <section className="assignment-modal">
            <div className="assignment-modal-header">
              <div>
                <p className="page-label">
                  Assignment Management
                </p>

                <h2>
                  Create Assignment
                </h2>
              </div>

              <button
                className="assignment-modal-close"
                onClick={() => {
                  setShowCreateModal(
                    false
                  );

                  resetAssignmentForm();
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="assignment-form"
              onSubmit={
                handleCreateAssignment
              }
            >
              <div className="assignment-form-group">
                <label>
                  Assignment Title *
                </label>

                <input
                  name="title"
                  type="text"
                  placeholder="Enter assignment title"
                  value={
                    assignmentForm.title
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                />
              </div>

              <div className="assignment-form-grid">
                <div className="assignment-form-group">
                  <label>
                    Course *
                  </label>

                  <select
                    name="courseId"
                    value={
                      assignmentForm.courseId
                    }
                    onChange={
                      handleAssignmentFormChange
                    }
                  >
                    <option value="">
                      Select course
                    </option>

                    {courses.map(
                      (course) => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {
                            course.code
                          }{" "}
                          -{" "}
                          {
                            course.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="assignment-form-group">
                  <label>
                    Grade Category *
                  </label>

                  <select
                    name="category"
                    value={
                      assignmentForm.category
                    }
                    onChange={
                      handleAssignmentFormChange
                    }
                  >
                    <option value="">
                      Select category
                    </option>

                    {temporaryCategories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="assignment-form-grid">
                <div className="assignment-form-group">
                  <label>
                    Due Date *
                  </label>

                  <input
                    name="dueDate"
                    type="date"
                    value={
                      assignmentForm.dueDate
                    }
                    onChange={
                      handleAssignmentFormChange
                    }
                  />
                </div>

                <div className="assignment-form-group">
                  <label>
                    Points Possible *
                  </label>

                  <input
                    name="points"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={
                      assignmentForm.points
                    }
                    onChange={
                      handleAssignmentFormChange
                    }
                  />
                </div>
              </div>

              <div className="assignment-form-group">
                <label>
                  Assignment Link
                </label>

                <input
                  name="assignmentLink"
                  type="url"
                  placeholder="https://..."
                  value={
                    assignmentForm.assignmentLink
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                />

                <p className="assignment-file-note">
                  This URL is sent to the
                  backend as the assignment
                  link.
                </p>
              </div>

              <div className="assignment-form-group">
                <label>
                  Instructions
                </label>

                <textarea
                  name="description"
                  rows="5"
                  placeholder="Enter assignment instructions..."
                  value={
                    assignmentForm.description
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                />

                <p className="assignment-file-note">
                  Instructions remain
                  frontend-only because the
                  current assignment service
                  does not include a
                  description parameter.
                </p>
              </div>

              <div className="assignment-form-group">
                <label>
                  Submission Type
                </label>

                <select
                  name="submissionType"
                  value={
                    assignmentForm.submissionType
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                >
                  <option value="File Upload">
                    File Upload
                  </option>

                  <option value="Written Response">
                    Written Response
                  </option>

                  <option value="File + Written Response">
                    File + Written Response
                  </option>
                </select>
              </div>

              <div className="assignment-form-group">
                <label>
                  Instructor Attachment
                </label>

                <label className="assignment-file-upload">
                  <Upload size={18} />

                  <span>
                    {assignmentForm.instructorFile ||
                      "Choose file"}
                  </span>

                  <input
                    type="file"
                    onChange={
                      handleInstructorFile
                    }
                  />
                </label>

                <p className="assignment-file-note">
                  File upload remains
                  frontend-only. The current
                  backend service accepts an
                  assignment URL instead.
                </p>
              </div>

              <div className="assignment-form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    assignmentForm.status
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                >
                  <option value="Draft">
                    Draft
                  </option>

                  <option value="Published">
                    Published
                  </option>
                </select>
              </div>

              <label className="assignment-checkbox-row">
                <input
                  name="allowResubmission"
                  type="checkbox"
                  checked={
                    assignmentForm.allowResubmission
                  }
                  onChange={
                    handleAssignmentFormChange
                  }
                />

                Allow students to
                resubmit before the
                deadline
              </label>

              {formError && (
                <div className="assignment-form-error">
                  {formError}
                </div>
              )}

              <div className="assignment-form-actions">
                <button
                  type="button"
                  className="assignment-cancel-button"
                  onClick={() => {
                    setShowCreateModal(
                      false
                    );

                    resetAssignmentForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="assignment-save-button"
                  disabled={
                    isCreating
                  }
                >
                  <Plus size={17} />

                  {isCreating
                    ? "Creating..."
                    : "Create Assignment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Manage Assignment Modal */}
      {showManageModal &&
        selectedAssignment && (
          <div className="assignment-modal-overlay">
            <section className="assignment-modal assignment-manage-modal">
              <div className="assignment-modal-header">
                <div>
                  <p className="page-label">
                    Assignment Management
                  </p>

                  <h2>
                    {
                      selectedAssignment.title
                    }
                  </h2>

                  <p>
                    {
                      selectedAssignment.courseCode
                    }{" "}
                    -{" "}
                    {
                      selectedAssignment.courseName
                    }
                  </p>
                </div>

                <button
                  className="assignment-modal-close"
                  onClick={() =>
                    setShowManageModal(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="manage-assignment-layout">
                <section className="manage-assignment-settings">
                  <h3>
                    Assignment Details
                  </h3>

                  <div className="assignment-form-group">
                    <label>
                      Title
                    </label>

                    <input
                      name="title"
                      value={
                        selectedAssignment.title
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    />
                  </div>

                  <div className="assignment-form-grid">
                    <div className="assignment-form-group">
                      <label>
                        Due Date
                      </label>

                      <input
                        name="dueDate"
                        type="date"
                        value={
                          selectedAssignment.dueDate
                        }
                        onChange={
                          handleManageAssignmentChange
                        }
                      />
                    </div>

                    <div className="assignment-form-group">
                      <label>
                        Points Possible
                      </label>

                      <input
                        name="points"
                        type="number"
                        min="1"
                        value={
                          selectedAssignment.points
                        }
                        onChange={
                          handleManageAssignmentChange
                        }
                      />
                    </div>
                  </div>

                  <div className="assignment-form-group">
                    <label>
                      Grade Category
                    </label>

                    <select
                      name="category"
                      value={
                        selectedAssignment.category
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    >
                      {temporaryCategories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="assignment-form-group">
                    <label>
                      Submission Type
                    </label>

                    <select
                      name="submissionType"
                      value={
                        selectedAssignment.submissionType
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    >
                      <option value="File Upload">
                        File Upload
                      </option>

                      <option value="Written Response">
                        Written Response
                      </option>

                      <option value="File + Written Response">
                        File + Written Response
                      </option>
                    </select>
                  </div>

                  <div className="assignment-form-group">
                    <label>
                      Instructions
                    </label>

                    <textarea
                      name="description"
                      rows="4"
                      value={
                        selectedAssignment.description
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    />
                  </div>

                  {selectedAssignment.instructorFile && (
                    <div className="assignment-attachment-display">
                      <Paperclip
                        size={17}
                      />

                      <span>
                        {
                          selectedAssignment.instructorFile
                        }
                      </span>
                    </div>
                  )}

                  {selectedAssignment.assignmentLink && (
                    <div className="assignment-attachment-display">
                      <Paperclip
                        size={17}
                      />

                      <span>
                        {
                          selectedAssignment.assignmentLink
                        }
                      </span>
                    </div>
                  )}

                  <div className="assignment-form-group">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        selectedAssignment.status
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    >
                      <option value="Draft">
                        Draft
                      </option>

                      <option value="Published">
                        Published
                      </option>

                      <option value="Closed">
                        Closed
                      </option>
                    </select>
                  </div>

                  <label className="assignment-checkbox-row">
                    <input
                      name="allowResubmission"
                      type="checkbox"
                      checked={
                        selectedAssignment.allowResubmission
                      }
                      onChange={
                        handleManageAssignmentChange
                      }
                    />

                    Allow resubmissions
                  </label>

                  <button
                    className="assignment-save-button"
                    onClick={
                      handleSaveAssignment
                    }
                  >
                    <Save size={17} />
                    Save Changes
                  </button>

                  <p className="assignment-file-note">
                    Editing remains
                    frontend-only until an
                    update-assignment service
                    is available.
                  </p>
                </section>

                {/* Temporary submission / grading section */}
                <section className="assignment-submission-panel">
                  <div className="submission-panel-header">
                    <div>
                      <h3>
                        Student Submissions
                      </h3>

                      <p>
                        View submitted work
                        and enter grades.
                      </p>
                    </div>

                    <Users
                      size={21}
                    />
                  </div>

                  <div className="submission-list">
                    {submissions.map(
                      (
                        submission
                      ) => (
                        <button
                          key={
                            submission.id
                          }
                          className={
                            selectedSubmission?.id ===
                            submission.id
                              ? "submission-list-item active"
                              : "submission-list-item"
                          }
                          onClick={() =>
                            handleSubmissionSelect(
                              submission
                            )
                          }
                        >
                          <div>
                            <strong>
                              {
                                submission.studentName
                              }
                            </strong>

                            <span>
                              {
                                submission.studentId
                              }
                            </span>
                          </div>

                          <span
                            className={`submission-status ${submission.status.toLowerCase()}`}
                          >
                            {
                              submission.status
                            }
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  {selectedSubmission ? (
                    <div className="submission-grading-card">
                      <div className="submission-grading-heading">
                        <div>
                          <h4>
                            {
                              selectedSubmission.studentName
                            }
                          </h4>

                          <p>
                            Submitted{" "}
                            {
                              selectedSubmission.submittedAt
                            }
                          </p>
                        </div>

                        <button
                          className="view-submission-button"
                          onClick={
                            handleViewSubmission
                          }
                        >
                          <Eye
                            size={16}
                          />

                          View Submission
                        </button>
                      </div>

                      <div className="assignment-form-group">
                        <label>
                          Grade /{" "}
                          {
                            selectedAssignment.points
                          }
                        </label>

                        <input
                          name="grade"
                          type="number"
                          min="0"
                          max={
                            selectedAssignment.points
                          }
                          value={
                            selectedSubmission.grade
                          }
                          onChange={
                            handleSubmissionChange
                          }
                          placeholder="Enter grade"
                        />
                      </div>

                      <div className="assignment-form-group">
                        <label>
                          Instructor Feedback
                        </label>

                        <textarea
                          name="feedback"
                          rows="4"
                          placeholder="Enter feedback for the student..."
                          value={
                            selectedSubmission.feedback
                          }
                          onChange={
                            handleSubmissionChange
                          }
                        />
                      </div>

                      <button
                        className="assignment-save-button"
                        onClick={
                          handleSaveGrade
                        }
                      >
                        <Save
                          size={17}
                        />

                        Save Grade
                      </button>
                    </div>
                  ) : (
                    <div className="select-submission-message">
                      <Users
                        size={30}
                      />

                      <p>
                        Select a student
                        submission to
                        review and grade.
                      </p>
                    </div>
                  )}

                  {saveMessage && (
                    <div className="assignment-save-message">
                      {saveMessage}
                    </div>
                  )}

                  <p className="assignment-file-note">
                    Student submissions
                    and grading are still
                    using temporary frontend
                    data until instructor
                    submission/grading
                    services are connected.
                  </p>
                </section>
              </div>
            </section>
          </div>
        )}

      {/* Submission Preview */}
      {showSubmissionModal &&
        selectedSubmission && (
          <div className="assignment-modal-overlay assignment-submission-preview-overlay">
            <section className="assignment-submission-preview">
              <div className="assignment-modal-header">
                <div>
                  <p className="page-label">
                    Student Submission
                  </p>

                  <h2>
                    {
                      selectedSubmission.studentName
                    }
                  </h2>

                  <p>
                    {
                      selectedAssignment?.title
                    }
                  </p>
                </div>

                <button
                  className="assignment-modal-close"
                  onClick={() =>
                    setShowSubmissionModal(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="submission-preview-meta">
                <div>
                  <span>
                    Student ID
                  </span>

                  <strong>
                    {
                      selectedSubmission.studentId
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Submitted
                  </span>

                  <strong>
                    {
                      selectedSubmission.submittedAt
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Submission Type
                  </span>

                  <strong>
                    {
                      selectedAssignment?.submissionType
                    }
                  </strong>
                </div>
              </div>

              {selectedSubmission.writtenResponse && (
                <section className="submission-preview-section">
                  <div className="submission-preview-heading">
                    <FileText
                      size={19}
                    />

                    <h3>
                      Written Response
                    </h3>
                  </div>

                  <div className="submission-written-response">
                    {
                      selectedSubmission.writtenResponse
                    }
                  </div>
                </section>
              )}

              {selectedSubmission.submittedFile && (
                <section className="submission-preview-section">
                  <div className="submission-preview-heading">
                    <Paperclip
                      size={19}
                    />

                    <h3>
                      Submitted File
                    </h3>
                  </div>

                  <div className="submission-file-card">
                    <div>
                      <FileText
                        size={22}
                      />

                      <span>
                        {
                          selectedSubmission.submittedFile
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                    >
                      <Download
                        size={16}
                      />

                      Download
                    </button>
                  </div>
                </section>
              )}

              <p className="submission-preview-note">
                File preview and download
                will be connected when
                backend file storage is
                available.
              </p>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorAssignments;