import { useMemo, useState } from "react";

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

import "./InstructorAssignments.css";

const initialAssignments = [
  {
    id: 1,
    title: "Responsive Website Project",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    dueDate: "2026-08-12",
    category: "Assignments",
    points: 100,
    description:
      "Create a responsive website using HTML, CSS, and JavaScript.",
    submissions: 24,
    totalStudents: 32,
    status: "Published",
    allowResubmission: true,
    submissionType: "File + Written Response",
    instructorFile: "project-instructions.pdf",
  },
  {
    id: 2,
    title: "Software Requirements Document",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    dueDate: "2026-08-15",
    category: "Assignments",
    points: 100,
    description:
      "Create a software requirements document for your semester project.",
    submissions: 18,
    totalStudents: 28,
    status: "Published",
    allowResubmission: true,
    submissionType: "File Upload",
    instructorFile: "requirements-template.docx",
  },
  {
    id: 3,
    title: "Search Algorithms Analysis",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    dueDate: "2026-08-20",
    category: "Assignments",
    points: 100,
    description:
      "Compare and analyze multiple search algorithms.",
    submissions: 0,
    totalStudents: 24,
    status: "Draft",
    allowResubmission: false,
    submissionType: "Written Response",
    instructorFile: "",
  },
];

const temporaryCourses = [
  {
    code: "CSCI 510",
    name: "Web Application Development",
  },
  {
    code: "CSCI 633",
    name: "Software Engineering",
  },
  {
    code: "CSCI 721",
    name: "Artificial Intelligence",
  },
];

const temporaryCategories = [
  "Assignments",
  "Quizzes",
  "Projects",
  "Midterm",
  "Final Exam",
];

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
    submittedFile: "alex-responsive-project.zip",
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
    submittedFile: "jordan-project.pdf",
  },
  {
    id: 3,
    studentId: "10024569",
    studentName: "Taylor Brown",
    submittedAt: "August 11, 2026",
    status: "Graded",
    grade: "92",
    feedback: "Great work overall.",
    writtenResponse:
      "I used responsive CSS layouts and tested the page at multiple screen sizes.",
    submittedFile: "taylor-project.zip",
  },
];

function InstructorAssignments() {
  const [assignments, setAssignments] =
    useState(initialAssignments);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] =
    useState("All Courses");
  const [selectedStatus, setSelectedStatus] =
    useState("All Statuses");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showManageModal, setShowManageModal] =
    useState(false);

  const [showSubmissionModal, setShowSubmissionModal] =
    useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  const [submissions, setSubmissions] =
    useState(temporarySubmissions);

  const [selectedSubmission, setSelectedSubmission] =
    useState(null);

  const [formError, setFormError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    courseCode: "",
    description: "",
    dueDate: "",
    category: "",
    points: "",
    status: "Draft",
    allowResubmission: false,
    submissionType: "File Upload",
    instructorFile: "",
  });

  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(
        assignments.map(
          (assignment) => assignment.courseCode
        )
      ),
    ];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const normalizedSearch =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        assignment.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        assignment.courseCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        assignment.courseName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        assignment.courseCode === selectedCourse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        assignment.status === selectedStatus;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus
      );
    });
  }, [
    assignments,
    searchTerm,
    selectedCourse,
    selectedStatus,
  ]);

  const publishedAssignments = assignments.filter(
    (assignment) =>
      assignment.status === "Published"
  ).length;

  const draftAssignments = assignments.filter(
    (assignment) => assignment.status === "Draft"
  ).length;

  const totalSubmissions = assignments.reduce(
    (total, assignment) =>
      total + assignment.submissions,
    0
  );

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      courseCode: "",
      description: "",
      dueDate: "",
      category: "",
      points: "",
      status: "Draft",
      allowResubmission: false,
      submissionType: "File Upload",
      instructorFile: "",
    });

    setFormError("");
  };

  const handleAssignmentFormChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setAssignmentForm((previousForm) => ({
      ...previousForm,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setFormError("");
  };

  const handleInstructorFile = (event) => {
    const file = event.target.files?.[0];

    setAssignmentForm((previousForm) => ({
      ...previousForm,
      instructorFile: file ? file.name : "",
    }));
  };

  const handleCreateAssignment = (event) => {
    event.preventDefault();

    if (
      !assignmentForm.title.trim() ||
      !assignmentForm.courseCode ||
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
      temporaryCourses.find(
        (course) =>
          course.code ===
          assignmentForm.courseCode
      );

    const newAssignment = {
      id: Date.now(),
      title: assignmentForm.title.trim(),
      courseCode: assignmentForm.courseCode,
      courseName:
        selectedCourseInformation?.name || "",
      dueDate: assignmentForm.dueDate,
      category: assignmentForm.category,
      points: Number(assignmentForm.points),
      description:
        assignmentForm.description.trim(),
      submissions: 0,
      totalStudents: 0,
      status: assignmentForm.status,
      allowResubmission:
        assignmentForm.allowResubmission,
      submissionType:
        assignmentForm.submissionType,
      instructorFile:
        assignmentForm.instructorFile,
    };

    setAssignments((previousAssignments) => [
      ...previousAssignments,
      newAssignment,
    ]);

    setShowCreateModal(false);

    resetAssignmentForm();
  };

  const handleManageAssignment = (assignment) => {
    setSelectedAssignment({ ...assignment });
    setSelectedSubmission(null);
    setSaveMessage("");
    setShowManageModal(true);
  };

  const handleManageAssignmentChange = (
    event
  ) => {
    const { name, value, type, checked } =
      event.target;

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

  const handleSaveAssignment = () => {
    setAssignments((previousAssignments) =>
      previousAssignments.map(
        (assignment) =>
          assignment.id ===
          selectedAssignment.id
            ? {
                ...selectedAssignment,
                points: Number(
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
    setSelectedSubmission({ ...submission });
    setSaveMessage("");
  };

  const handleSubmissionChange = (event) => {
    const { name, value } = event.target;

    setSelectedSubmission(
      (previousSubmission) => ({
        ...previousSubmission,
        [name]: value,
      })
    );
  };

  const handleViewSubmission = () => {
    if (!selectedSubmission) {
      return;
    }

    setShowSubmissionModal(true);
  };

  const handleSaveGrade = () => {
    if (
      selectedSubmission.grade === "" ||
      Number(selectedSubmission.grade) < 0 ||
      Number(selectedSubmission.grade) >
        Number(selectedAssignment.points)
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

    setSubmissions((previousSubmissions) =>
      previousSubmissions.map((submission) =>
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
              Create, publish, and manage course
              assignments.
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

        <section className="assignment-stat-grid">
          <article className="assignment-stat-card">
            <div className="assignment-stat-icon total">
              <ClipboardList size={22} />
            </div>

            <div>
              <span>Total Assignments</span>
              <strong>
                {assignments.length}
              </strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon published">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Published</span>
              <strong>
                {publishedAssignments}
              </strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon draft">
              <FileEdit size={22} />
            </div>

            <div>
              <span>Drafts</span>
              <strong>{draftAssignments}</strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon submissions">
              <Users size={22} />
            </div>

            <div>
              <span>Submissions</span>
              <strong>{totalSubmissions}</strong>
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
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="assignment-filter-controls">
            <select
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(
                  event.target.value
                )
              }
            >
              {courseOptions.map((course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
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
              <h2>All Assignments</h2>

              <p>
                Showing{" "}
                {filteredAssignments.length} of{" "}
                {assignments.length} assignments
              </p>
            </div>
          </div>

          {filteredAssignments.length > 0 ? (
            <div className="assignment-table-wrapper">
              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignments.map(
                    (assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <div className="assignment-name-cell">
                            <div className="assignment-file-icon">
                              <ClipboardList
                                size={19}
                              />
                            </div>

                            <div>
                              <strong>
                                {assignment.title}
                              </strong>

                              <span>
                                {assignment.category} •{" "}
                                {assignment.points} pts
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
                              size={17}
                            />

                            <span>
                              {assignment.dueDate}
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
                            className={`assignment-status ${assignment.status.toLowerCase()}`}
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

              <h3>No assignments found</h3>

              <p>
                Try changing your search or
                filter selections.
              </p>
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <div className="assignment-modal-overlay">
          <section className="assignment-modal">
            <div className="assignment-modal-header">
              <div>
                <p className="page-label">
                  Assignment Management
                </p>

                <h2>Create Assignment</h2>
              </div>

              <button
                className="assignment-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetAssignmentForm();
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="assignment-form"
              onSubmit={handleCreateAssignment}
            >
              <div className="assignment-form-group">
                <label>Assignment Title *</label>

                <input
                  name="title"
                  type="text"
                  placeholder="Enter assignment title"
                  value={assignmentForm.title}
                  onChange={
                    handleAssignmentFormChange
                  }
                />
              </div>

              <div className="assignment-form-grid">
                <div className="assignment-form-group">
                  <label>Course *</label>

                  <select
                    name="courseCode"
                    value={
                      assignmentForm.courseCode
                    }
                    onChange={
                      handleAssignmentFormChange
                    }
                  >
                    <option value="">
                      Select course
                    </option>

                    {temporaryCourses.map(
                      (course) => (
                        <option
                          key={course.code}
                          value={course.code}
                        >
                          {course.code} -{" "}
                          {course.name}
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
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="assignment-form-grid">
                <div className="assignment-form-group">
                  <label>Due Date *</label>

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
                <label>Instructions</label>

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
              </div>

              <div className="assignment-form-group">
                <label>Submission Type</label>

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
                  This is frontend-only for now.
                  The backend will later store the
                  uploaded file.
                </p>
              </div>

              <div className="assignment-form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={assignmentForm.status}
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

                Allow students to resubmit
                before the deadline
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
                    setShowCreateModal(false);
                    resetAssignmentForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="assignment-save-button"
                >
                  <Plus size={17} />
                  Create Assignment
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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
                    {selectedAssignment.title}
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
                    setShowManageModal(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="manage-assignment-layout">
                <section className="manage-assignment-settings">
                  <h3>Assignment Details</h3>

                  <div className="assignment-form-group">
                    <label>Title</label>

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
                      <label>Due Date</label>

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
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
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
                    <label>Instructions</label>

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
                      <Paperclip size={17} />

                      <span>
                        {
                          selectedAssignment.instructorFile
                        }
                      </span>
                    </div>
                  )}

                  <div className="assignment-form-group">
                    <label>Status</label>

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
                </section>

                <section className="assignment-submission-panel">
                  <div className="submission-panel-header">
                    <div>
                      <h3>
                        Student Submissions
                      </h3>

                      <p>
                        View submitted work and
                        enter grades.
                      </p>
                    </div>

                    <Users size={21} />
                  </div>

                  <div className="submission-list">
                    {submissions.map(
                      (submission) => (
                        <button
                          key={submission.id}
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
                          <Eye size={16} />
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
                        <Save size={17} />
                        Save Grade
                      </button>
                    </div>
                  ) : (
                    <div className="select-submission-message">
                      <Users size={30} />

                      <p>
                        Select a student submission
                        to review and grade.
                      </p>
                    </div>
                  )}

                  {saveMessage && (
                    <div className="assignment-save-message">
                      {saveMessage}
                    </div>
                  )}
                </section>
              </div>
            </section>
          </div>
        )}

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
                    setShowSubmissionModal(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="submission-preview-meta">
                <div>
                  <span>Student ID</span>
                  <strong>
                    {
                      selectedSubmission.studentId
                    }
                  </strong>
                </div>

                <div>
                  <span>Submitted</span>
                  <strong>
                    {
                      selectedSubmission.submittedAt
                    }
                  </strong>
                </div>

                <div>
                  <span>Submission Type</span>
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
                    <FileText size={19} />
                    <h3>Written Response</h3>
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
                    <Paperclip size={19} />
                    <h3>Submitted File</h3>
                  </div>

                  <div className="submission-file-card">
                    <div>
                      <FileText size={22} />

                      <span>
                        {
                          selectedSubmission.submittedFile
                        }
                      </span>
                    </div>

                    <button type="button">
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </section>
              )}

              <p className="submission-preview-note">
                File preview and download will be
                connected when backend file storage
                is added.
              </p>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorAssignments;