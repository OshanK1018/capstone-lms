import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Search,
  Users,
  ClipboardList,
  X,
  Trash2,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import {
  getCurrentUser,
} from "../../backend/userServices.js";

import {
  createCourseWithTerm,
  getCoursesForInstructor,
} from "../../backend/courseServices.js";

import "./InstructorCourses.css";

const courseColors = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
];

function normalizeCourse(course, index) {
  return {
    ...course,

    id:
      course.id ??
      course.course_id ??
      course.courseID,

    code:
      course.code ??
      course.courseCode ??
      course.course_code ??
      `COURSE ${index + 1}`,

    title:
      course.title ??
      course.courseName ??
      course.course_name ??
      "Untitled Course",

    students:
      course.students ??
      course.studentCount ??
      course.student_count ??
      course.total_students ??
      course.seats_taken ??
      0,

    assignments:
      course.assignments ??
      course.assignmentCount ??
      course.assignment_count ??
      0,

    status:
      course.status ??
      (course.isArchived ? "Inactive" : "Active"),

    semester:
      course.semester ??
      course.term ??
      "",

    description:
      course.description ??
      "",

    maxSeats:
      course.max_seats ??
      course.maxSeats ??
      30,

    seatsOpen:
      course.seats_open ??
      course.seatsOpen ??
      0,

    credits:
      course.credits ??
      3,

    materialsUrl:
      course.materials_url ??
      course.materialsUrl ??
      "",

    gradeCategories:
      course.gradeCategories ??
      course.grade_categories ??
      [],

    color:
      course.color ??
      courseColors[
        index % courseColors.length
      ],
  };
}

function getCoursesFromResult(result) {
  const data =
    result?.data ??
    result;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.courses)) {
    return data.courses;
  }

  return [];
}

function InstructorCourses() {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] =
    useState([]);

  const [instructorID, setInstructorID] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showCreateCourse, setShowCreateCourse] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [pageError, setPageError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [courseForm, setCourseForm] =
    useState({
      code: "",
      title: "",
      description: "",
      semester: "",
      maxSeats: 30,
      credits: 3,
      materialsUrl: "",
    });

  const [gradeCategories, setGradeCategories] =
    useState([
      {
        id: Date.now(),
        name: "Assignments",
        weight: "",
      },
    ]);

  const selectedCourse =
    location.state?.selectedCourse;

  useEffect(() => {
    async function loadCourses() {
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

      /*
       * Supports both the previous userServices
       * response and Tori's refactored apiRequest
       * response structure.
       */
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

      setCourses(
        backendCourses.map(
          (course, index) =>
            normalizeCourse(
              course,
              index
            )
        )
      );

      setIsLoading(false);
    }

    loadCourses();
  }, []);

  const filteredCourses =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return courses;
      }

      return courses.filter(
        (course) => {
          return (
            String(course.code)
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            String(course.title)
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );
        }
      );
    }, [searchTerm, courses]);

  const totalWeight =
    gradeCategories.reduce(
      (total, category) => {
        return (
          total +
          Number(
            category.weight || 0
          )
        );
      },
      0
    );

  const handleCourseFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setCourseForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );

    setFormError("");
  };

  const handleCategoryChange = (
    id,
    field,
    value
  ) => {
    setGradeCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) =>
            category.id === id
              ? {
                  ...category,
                  [field]: value,
                }
              : category
        )
    );

    setFormError("");
  };

  const handleAddCategory = () => {
    setGradeCategories(
      (previousCategories) => [
        ...previousCategories,
        {
          id: Date.now(),
          name: "",
          weight: "",
        },
      ]
    );
  };

  const handleRemoveCategory = (
    id
  ) => {
    if (
      gradeCategories.length === 1
    ) {
      return;
    }

    setGradeCategories(
      (previousCategories) =>
        previousCategories.filter(
          (category) =>
            category.id !== id
        )
    );
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: "",
      title: "",
      description: "",
      semester: "",
      maxSeats: 30,
      credits: 3,
      materialsUrl: "",
    });

    setGradeCategories([
      {
        id: Date.now(),
        name: "Assignments",
        weight: "",
      },
    ]);

    setFormError("");
  };

  const handleCloseCreateCourse =
    () => {
      setShowCreateCourse(false);
      resetCourseForm();
    };

  const reloadCourses =
    async () => {
      if (!instructorID) {
        return;
      }

      const result =
        await getCoursesForInstructor(
          instructorID
        );

      if (!result.success) {
        setPageError(
          result.error ||
            "Unable to refresh courses."
        );

        return;
      }

      const backendCourses =
        getCoursesFromResult(
          result
        );

      setCourses(
        backendCourses.map(
          (course, index) =>
            normalizeCourse(
              course,
              index
            )
        )
      );
    };

  const handleCreateCourse =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        !courseForm.code.trim() ||
        !courseForm.title.trim() ||
        !courseForm.semester.trim()
      ) {
        setFormError(
          "Please complete all required course fields."
        );

        return;
      }

      if (
        Number(courseForm.maxSeats) <= 0
      ) {
        setFormError(
          "Maximum seats must be greater than 0."
        );

        return;
      }

      if (
        Number(courseForm.credits) <= 0
      ) {
        setFormError(
          "Credits must be greater than 0."
        );

        return;
      }

      const hasEmptyCategory =
        gradeCategories.some(
          (category) =>
            !category.name.trim() ||
            category.weight === "" ||
            Number(
              category.weight
            ) <= 0
        );

      if (hasEmptyCategory) {
        setFormError(
          "Please enter a name and valid weight for every grade category."
        );

        return;
      }

      if (totalWeight !== 100) {
        setFormError(
          "Grade category weights must total exactly 100%."
        );

        return;
      }

      setIsCreating(true);

      const result =
        await createCourseWithTerm(
          courseForm.title.trim(),
          courseForm.semester,
          instructorID,
          Number(courseForm.maxSeats),
          Number(courseForm.credits),
          courseForm.materialsUrl.trim() ||
            null
        );

      setIsCreating(false);

      if (
        result?.success === false
      ) {
        setFormError(
          result.error ||
            "Unable to create course."
        );

        return;
      }

      await reloadCourses();

      setShowCreateCourse(false);
      resetCourseForm();
    };

  const handleManageCourse = (
    course
  ) => {
    if (!course.id) {
      setPageError(
        "This course does not have a valid course ID."
      );

      return;
    }

    navigate(
      `/instructor/courses/${course.id}`,
      {
        state: {
          course,
        },
      }
    );
  };

  return (
    <div className="instructor-page-layout">
      <InstructorSidebar />

      <main className="courses-main-content">
        <header className="courses-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>My Courses</h1>

            <p>
              View and manage all
              courses assigned to you.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowCreateCourse(true)
            }
          >
            <Plus size={18} />
            Create Course
          </button>
        </header>

        {pageError && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              border:
                "1px solid #fecaca",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {pageError}
          </div>
        )}

        {selectedCourse && (
          <section className="selected-course-notice">
            <strong>
              Selected course:
            </strong>

            <span>
              {selectedCourse.code} -{" "}
              {selectedCourse.title}
            </span>
          </section>
        )}

        <section className="course-search-section">
          <div className="course-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by course code or title"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                "/instructor/dashboard"
              )
            }
          >
            Back to Dashboard
          </button>
        </section>

        <section className="all-courses-section">
          <div className="all-courses-header">
            <div>
              <h2>All Courses</h2>

              <p>
                {isLoading
                  ? "Loading courses..."
                  : `${filteredCourses.length} courses found`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-course-message">
              <BookOpen size={34} />

              <h3>
                Loading courses...
              </h3>
            </div>
          ) : filteredCourses.length >
            0 ? (
            <div className="all-course-grid">
              {filteredCourses.map(
                (course) => (
                  <article
                    className="full-course-card"
                    key={
                      course.id ??
                      `${course.code}-${course.title}`
                    }
                  >
                    <div
                      className="course-color"
                      style={{
                        backgroundColor:
                          course.color,
                      }}
                    />

                    <div className="full-course-content">
                      <div className="course-card-heading">
                        <div>
                          <span className="course-code">
                            {course.code}
                          </span>

                          <h3>
                            {course.title}
                          </h3>
                        </div>

                        <span className="course-status">
                          {course.status}
                        </span>
                      </div>

                      <div className="course-stat-row">
                        <div>
                          <Users
                            size={18}
                          />

                          <span>
                            {
                              course.students
                            }{" "}
                            students
                          </span>
                        </div>

                        <div>
                          <ClipboardList
                            size={18}
                          />

                          <span>
                            {
                              course.assignments
                            }{" "}
                            assignments
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          gap: "14px",
                          flexWrap: "wrap",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        <span>
                          {course.credits}{" "}
                          credits
                        </span>

                        <span>
                          {course.maxSeats}{" "}
                          max seats
                        </span>

                        <span>
                          {course.seatsOpen}{" "}
                          seats open
                        </span>
                      </div>

                      <button
                        className="manage-button"
                        onClick={() =>
                          handleManageCourse(
                            course
                          )
                        }
                      >
                        <BookOpen
                          size={17}
                        />

                        Manage Course
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="empty-course-message">
              <BookOpen size={34} />

              <h3>
                No courses found
              </h3>

              <p>
                No courses are currently
                assigned to this
                instructor.
              </p>
            </div>
          )}
        </section>
      </main>

      {showCreateCourse && (
        <div className="course-modal-overlay">
          <section className="course-modal">
            <div className="course-modal-header">
              <div>
                <p className="page-label">
                  Course Management
                </p>

                <h2>
                  Create Course
                </h2>
              </div>

              <button
                type="button"
                className="course-modal-close"
                onClick={
                  handleCloseCreateCourse
                }
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="create-course-form"
              onSubmit={
                handleCreateCourse
              }
            >
              <div className="course-form-grid">
                <div className="course-form-group">
                  <label htmlFor="courseCode">
                    Course Code *
                  </label>

                  <input
                    id="courseCode"
                    name="code"
                    type="text"
                    placeholder="Example: CSCI 510"
                    value={
                      courseForm.code
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>

                <div className="course-form-group">
                  <label htmlFor="courseTitle">
                    Course Title *
                  </label>

                  <input
                    id="courseTitle"
                    name="title"
                    type="text"
                    placeholder="Example: Web Application Development"
                    value={
                      courseForm.title
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>
              </div>

              <div className="course-form-grid">
                <div className="course-form-group">
                  <label htmlFor="semester">
                    Semester *
                  </label>

                  <select
                    id="semester"
                    name="semester"
                    value={
                      courseForm.semester
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  >
                    <option value="">
                      Select semester
                    </option>

                    <option value="Fall 2026">
                      Fall 2026
                    </option>

                    <option value="Spring 2027">
                      Spring 2027
                    </option>

                    <option value="Summer 2027">
                      Summer 2027
                    </option>
                  </select>
                </div>

                <div className="course-form-group">
                  <label htmlFor="maxSeats">
                    Maximum Seats *
                  </label>

                  <input
                    id="maxSeats"
                    name="maxSeats"
                    type="number"
                    min="1"
                    value={
                      courseForm.maxSeats
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>
              </div>

              <div className="course-form-grid">
                <div className="course-form-group">
                  <label htmlFor="credits">
                    Credits *
                  </label>

                  <input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    value={
                      courseForm.credits
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>

                <div className="course-form-group">
                  <label htmlFor="materialsUrl">
                    Materials URL
                  </label>

                  <input
                    id="materialsUrl"
                    name="materialsUrl"
                    type="url"
                    placeholder="https://..."
                    value={
                      courseForm.materialsUrl
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>
              </div>

              <div className="course-form-group">
                <label htmlFor="courseDescription">
                  Course Description
                </label>

                <textarea
                  id="courseDescription"
                  name="description"
                  rows="4"
                  placeholder="Enter a short description of the course"
                  value={
                    courseForm.description
                  }
                  onChange={
                    handleCourseFormChange
                  }
                />
              </div>

              <section className="grading-section">
                <div className="grading-section-header">
                  <div>
                    <h3>
                      Grade Categories
                    </h3>

                    <p>
                      Add the categories
                      used to calculate the
                      final course grade.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-category-button"
                    onClick={
                      handleAddCategory
                    }
                  >
                    <Plus size={17} />
                    Add Category
                  </button>
                </div>

                <div className="grade-category-list">
                  {gradeCategories.map(
                    (category) => (
                      <div
                        className="grade-category-row"
                        key={
                          category.id
                        }
                      >
                        <div className="category-name-field">
                          <label>
                            Category
                          </label>

                          <input
                            type="text"
                            placeholder="Assignments, Quizzes, Final..."
                            value={
                              category.name
                            }
                            onChange={(
                              event
                            ) =>
                              handleCategoryChange(
                                category.id,
                                "name",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div className="category-weight-field">
                          <label>
                            Weight
                          </label>

                          <div className="weight-input-container">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="0"
                              value={
                                category.weight
                              }
                              onChange={(
                                event
                              ) =>
                                handleCategoryChange(
                                  category.id,
                                  "weight",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />

                            <span>
                              %
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="remove-category-button"
                          onClick={() =>
                            handleRemoveCategory(
                              category.id
                            )
                          }
                          disabled={
                            gradeCategories.length ===
                            1
                          }
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>

                <div
                  className={
                    totalWeight === 100
                      ? "grade-total grade-total-complete"
                      : "grade-total"
                  }
                >
                  <span>
                    Total Weight
                  </span>

                  <strong>
                    {totalWeight}% / 100%
                  </strong>
                </div>

                <p
                  style={{
                    margin:
                      "12px 0 0",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  Maximum seats, credits,
                  and materials URL are
                  connected to the current
                  course service. Course
                  code, description, and
                  grade categories remain
                  frontend-only until a
                  service supports them.
                </p>
              </section>

              {formError && (
                <div className="course-form-error">
                  {formError}
                </div>
              )}

              <div className="course-form-actions">
                <button
                  type="button"
                  className="course-cancel-button"
                  onClick={
                    handleCloseCreateCourse
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="course-create-button"
                  disabled={
                    isCreating
                  }
                >
                  <Plus size={18} />

                  {isCreating
                    ? "Creating..."
                    : "Create Course"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default InstructorCourses;