import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Edit3,
  Megaphone,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import {
  getCurrentUser,
} from "../../backend/userServices.js";

import {
  getCoursesForInstructor,
} from "../../backend/courseServices.js";

import {
  createAnnouncement,
  getAnnouncementsForCourse,
} from "../../backend/announcementServices.js";

import "./InstructorAnnouncements.css";

const audienceOptions = [
  "All Students",
  "Enrolled Students",
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

function getAnnouncementsFromResult(
  result
) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.announcements
    )
  ) {
    return data.announcements;
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
  };
}

function normalizeAnnouncement(
  announcement,
  course
) {
  return {
    ...announcement,

    id:
      announcement.id ??
      announcement.announcement_id,

    title:
      announcement.title ??
      "Untitled Announcement",

    message:
      announcement.message ??
      "",

    courseId:
      course.id,

    courseCode:
      course.code,

    courseName:
      course.name,

    /*
     * The current announcement service
     * only persists course_id, title,
     * and message.
     */
    audience:
      announcement.audience ??
      "All Students",

    publishDate:
      announcement.publishDate ??
      announcement.publish_date ??
      "",

    publishTime:
      announcement.publishTime ??
      announcement.publish_time ??
      "",

    status:
      announcement.status ??
      "Published",
  };
}

function InstructorAnnouncements() {
  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [courses, setCourses] =
    useState([]);

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
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [
    selectedAnnouncement,
    setSelectedAnnouncement,
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
    announcementForm,
    setAnnouncementForm,
  ] = useState({
    title: "",
    message: "",
    courseId: "",
    audience: "All Students",
    status: "Published",
    publishDate: "",
    publishTime: "",
  });

  /*
   * Load the real instructor courses,
   * then retrieve announcements for
   * each course.
   */
  useEffect(() => {
    async function loadAnnouncementsPage() {
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

      const instructorID =
        user?.user_id ??
        user?.id ??
        user?.userId;

      if (!instructorID) {
        setPageError(
          "The logged-in instructor ID could not be found."
        );

        setIsLoading(false);
        return;
      }

      const courseResult =
        await getCoursesForInstructor(
          instructorID
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

      const announcementRequests =
        normalizedCourses.map(
          async (course) => {
            if (!course.id) {
              return [];
            }

            const result =
              await getAnnouncementsForCourse(
                course.id
              );

            if (!result.success) {
              return [];
            }

            const backendAnnouncements =
              getAnnouncementsFromResult(
                result
              );

            return backendAnnouncements.map(
              (announcement) =>
                normalizeAnnouncement(
                  announcement,
                  course
                )
            );
          }
        );

      const announcementGroups =
        await Promise.all(
          announcementRequests
        );

      setAnnouncements(
        announcementGroups.flat()
      );

      setIsLoading(false);
    }

    loadAnnouncementsPage();
  }, []);

  const reloadAnnouncementsForCourse =
    async (course) => {
      if (!course?.id) {
        return;
      }

      const result =
        await getAnnouncementsForCourse(
          course.id
        );

      if (!result.success) {
        setPageError(
          result.error ||
            "Unable to refresh announcements."
        );

        return;
      }

      const backendAnnouncements =
        getAnnouncementsFromResult(
          result
        );

      const normalizedAnnouncements =
        backendAnnouncements.map(
          (announcement) =>
            normalizeAnnouncement(
              announcement,
              course
            )
        );

      setAnnouncements(
        (previousAnnouncements) => [
          ...previousAnnouncements.filter(
            (announcement) =>
              String(
                announcement.courseId
              ) !==
              String(course.id)
          ),

          ...normalizedAnnouncements,
        ]
      );
    };

  const courseOptions =
    useMemo(() => {
      return [
        "All Courses",

        ...new Set(
          announcements.map(
            (announcement) =>
              announcement.courseCode
          )
        ),
      ];
    }, [announcements]);

  const filteredAnnouncements =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .toLowerCase()
          .trim();

      return announcements.filter(
        (announcement) => {
          const matchesSearch =
            announcement.title
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            announcement.message
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            announcement.courseCode
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesCourse =
            selectedCourse ===
              "All Courses" ||
            announcement.courseCode ===
              selectedCourse;

          const matchesStatus =
            selectedStatus ===
              "All Statuses" ||
            announcement.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesCourse &&
            matchesStatus
          );
        }
      );
    }, [
      announcements,
      searchTerm,
      selectedCourse,
      selectedStatus,
    ]);

  const publishedCount =
    announcements.filter(
      (announcement) =>
        announcement.status ===
        "Published"
    ).length;

  const scheduledCount =
    announcements.filter(
      (announcement) =>
        announcement.status ===
        "Scheduled"
    ).length;

  const draftCount =
    announcements.filter(
      (announcement) =>
        announcement.status ===
        "Draft"
    ).length;

  const resetAnnouncementForm =
    () => {
      setAnnouncementForm({
        title: "",
        message: "",
        courseId: "",
        audience: "All Students",
        status: "Published",
        publishDate: "",
        publishTime: "",
      });

      setFormError("");
    };

  const handleAnnouncementFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setAnnouncementForm(
      (previousForm) => ({
        ...previousForm,

        [name]: value,
      })
    );

    setFormError("");
  };

  const handleCreateAnnouncement =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        !announcementForm.title.trim() ||
        !announcementForm.message.trim() ||
        !announcementForm.courseId
      ) {
        setFormError(
          "Please complete the title, message, and course."
        );

        return;
      }

      if (
        announcementForm.status ===
          "Scheduled" &&
        (!announcementForm.publishDate ||
          !announcementForm.publishTime)
      ) {
        setFormError(
          "Please choose a date and time for a scheduled announcement."
        );

        return;
      }

      const selectedCourseInformation =
        courses.find(
          (course) =>
            String(course.id) ===
            String(
              announcementForm.courseId
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

      /*
       * Current service:
       *
       * createAnnouncement(
       *   course_id,
       *   title,
       *   message
       * )
       */
      const result =
        await createAnnouncement(
          Number(
            announcementForm.courseId
          ),
          announcementForm.title.trim(),
          announcementForm.message.trim()
        );

      setIsCreating(false);

      if (!result.success) {
        setFormError(
          result.error ||
            "Unable to create announcement."
        );

        return;
      }

      await reloadAnnouncementsForCourse(
        selectedCourseInformation
      );

      setShowCreateModal(false);

      resetAnnouncementForm();
    };

  const handleEditAnnouncement = (
    announcement
  ) => {
    setSelectedAnnouncement({
      ...announcement,
    });

    setSaveMessage("");

    setShowEditModal(true);
  };

  const handleEditAnnouncementChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setSelectedAnnouncement(
      (previousAnnouncement) => ({
        ...previousAnnouncement,

        [name]: value,
      })
    );

    setSaveMessage("");
  };

  /*
   * No update announcement service
   * has been connected yet.
   */
  const handleSaveAnnouncement =
    () => {
      if (
        !selectedAnnouncement.title.trim() ||
        !selectedAnnouncement.message.trim()
      ) {
        setSaveMessage(
          "Title and message are required."
        );

        return;
      }

      if (
        selectedAnnouncement.status ===
          "Scheduled" &&
        (!selectedAnnouncement.publishDate ||
          !selectedAnnouncement.publishTime)
      ) {
        setSaveMessage(
          "Scheduled announcements need a date and time."
        );

        return;
      }

      const selectedCourseInformation =
        courses.find(
          (course) =>
            String(course.id) ===
            String(
              selectedAnnouncement.courseId
            )
        );

      const updatedAnnouncement = {
        ...selectedAnnouncement,

        courseCode:
          selectedCourseInformation?.code ??
          selectedAnnouncement.courseCode,

        courseName:
          selectedCourseInformation?.name ??
          selectedAnnouncement.courseName,
      };

      setAnnouncements(
        (previousAnnouncements) =>
          previousAnnouncements.map(
            (announcement) =>
              announcement.id ===
              updatedAnnouncement.id
                ? updatedAnnouncement
                : announcement
          )
      );

      setSelectedAnnouncement(
        updatedAnnouncement
      );

      setSaveMessage(
        "Announcement changes saved temporarily."
      );
    };

  /*
   * There is currently no delete
   * announcement service, so removing
   * here only affects frontend state.
   */
  const handleDeleteAnnouncement = (
    announcement
  ) => {
    const shouldDelete =
      window.confirm(
        `Remove "${announcement.title}" from this page? This will not delete it from the database.`
      );

    if (!shouldDelete) {
      return;
    }

    setAnnouncements(
      (currentAnnouncements) =>
        currentAnnouncements.filter(
          (currentAnnouncement) =>
            currentAnnouncement.id !==
            announcement.id
        )
    );
  };

  const formatAnnouncementDate = (
    announcement
  ) => {
    if (
      !announcement.publishDate
    ) {
      return announcement.status ===
        "Published"
        ? "Published"
        : "Not scheduled";
    }

    if (
      announcement.publishTime
    ) {
      return `${announcement.publishDate} at ${announcement.publishTime}`;
    }

    return announcement.publishDate;
  };

  return (
    <div className="announcements-layout">
      <InstructorSidebar />

      <main className="announcements-main-content">
        <header className="announcements-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>
              Announcements
            </h1>

            <p>
              Share important updates
              with students in your
              courses.
            </p>
          </div>

          <button
            className="announcements-primary-button"
            onClick={() =>
              setShowCreateModal(
                true
              )
            }
          >
            <Plus size={19} />

            Create Announcement
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

        <section className="announcement-stat-grid">
          <article className="announcement-stat-card">
            <div className="announcement-stat-icon total">
              <Megaphone
                size={22}
              />
            </div>

            <div>
              <span>
                Total Announcements
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : announcements.length}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon published">
              <Send size={22} />
            </div>

            <div>
              <span>
                Published
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : publishedCount}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon scheduled">
              <CalendarDays
                size={22}
              />
            </div>

            <div>
              <span>
                Scheduled
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : scheduledCount}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon drafts">
              <Edit3
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
                  : draftCount}
              </strong>
            </div>
          </article>
        </section>

        <section className="announcement-filter-section">
          <div className="announcement-search-box">
            <Search
              size={19}
            />

            <input
              type="text"
              placeholder="Search announcements..."
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="announcement-filter-controls">
            <select
              value={
                selectedCourse
              }
              onChange={(
                event
              ) =>
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
              onChange={(
                event
              ) =>
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

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="Draft">
                Draft
              </option>
            </select>
          </div>
        </section>

        <section className="announcement-list-panel">
          <div className="announcement-list-heading">
            <div>
              <h2>
                All Announcements
              </h2>

              <p>
                {isLoading
                  ? "Loading announcements..."
                  : `Showing ${filteredAnnouncements.length} of ${announcements.length} announcements`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-announcement-message">
              <Megaphone
                size={36}
              />

              <h3>
                Loading announcements...
              </h3>

              <p>
                Retrieving announcements
                from your courses.
              </p>
            </div>
          ) : filteredAnnouncements.length >
            0 ? (
            <div className="announcement-card-list">
              {filteredAnnouncements.map(
                (
                  announcement
                ) => (
                  <article
                    className="announcement-card"
                    key={
                      announcement.id
                    }
                  >
                    <div className="announcement-card-icon">
                      <Megaphone
                        size={21}
                      />
                    </div>

                    <div className="announcement-card-content">
                      <div className="announcement-card-heading">
                        <div>
                          <h3>
                            {
                              announcement.title
                            }
                          </h3>

                          <div className="announcement-course-information">
                            <strong>
                              {
                                announcement.courseCode
                              }
                            </strong>

                            <span>
                              {
                                announcement.courseName
                              }
                            </span>
                          </div>
                        </div>

                        <span
                          className={`announcement-status ${announcement.status
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {
                            announcement.status
                          }
                        </span>
                      </div>

                      <p className="announcement-message">
                        {
                          announcement.message
                        }
                      </p>

                      <div className="announcement-card-footer">
                        <div className="announcement-metadata">
                          <span>
                            <Users
                              size={
                                16
                              }
                            />

                            {
                              announcement.audience
                            }
                          </span>

                          <span>
                            <CalendarDays
                              size={
                                16
                              }
                            />

                            {formatAnnouncementDate(
                              announcement
                            )}
                          </span>
                        </div>

                        <div className="announcement-actions">
                          <button
                            className="announcement-edit-button"
                            onClick={() =>
                              handleEditAnnouncement(
                                announcement
                              )
                            }
                          >
                            <Edit3
                              size={
                                16
                              }
                            />

                            Edit
                          </button>

                          <button
                            className="announcement-delete-button"
                            onClick={() =>
                              handleDeleteAnnouncement(
                                announcement
                              )
                            }
                          >
                            <Trash2
                              size={
                                17
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="empty-announcement-message">
              <Megaphone
                size={36}
              />

              <h3>
                No announcements found
              </h3>

              <p>
                Try changing your
                search or filter
                selections.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="announcement-modal-overlay">
          <section className="announcement-modal">
            <div className="announcement-modal-header">
              <div>
                <p className="page-label">
                  Announcement
                  Management
                </p>

                <h2>
                  Create Announcement
                </h2>
              </div>

              <button
                className="announcement-modal-close"
                onClick={() => {
                  setShowCreateModal(
                    false
                  );

                  resetAnnouncementForm();
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="announcement-form"
              onSubmit={
                handleCreateAnnouncement
              }
            >
              <div className="announcement-form-group">
                <label>
                  Announcement Title *
                </label>

                <input
                  name="title"
                  type="text"
                  placeholder="Enter announcement title"
                  value={
                    announcementForm.title
                  }
                  onChange={
                    handleAnnouncementFormChange
                  }
                />
              </div>

              <div className="announcement-form-grid">
                <div className="announcement-form-group">
                  <label>
                    Course *
                  </label>

                  <select
                    name="courseId"
                    value={
                      announcementForm.courseId
                    }
                    onChange={
                      handleAnnouncementFormChange
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

                <div className="announcement-form-group">
                  <label>
                    Audience
                  </label>

                  <select
                    name="audience"
                    value={
                      announcementForm.audience
                    }
                    onChange={
                      handleAnnouncementFormChange
                    }
                  >
                    {audienceOptions.map(
                      (
                        audience
                      ) => (
                        <option
                          key={
                            audience
                          }
                          value={
                            audience
                          }
                        >
                          {
                            audience
                          }
                        </option>
                      )
                    )}
                  </select>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      fontSize:
                        "12px",
                      color:
                        "#64748b",
                    }}
                  >
                    Audience is
                    currently a
                    frontend-only field.
                  </p>
                </div>
              </div>

              <div className="announcement-form-group">
                <label>
                  Message *
                </label>

                <textarea
                  name="message"
                  rows="6"
                  placeholder="Write your announcement..."
                  value={
                    announcementForm.message
                  }
                  onChange={
                    handleAnnouncementFormChange
                  }
                />
              </div>

              <div className="announcement-form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    announcementForm.status
                  }
                  onChange={
                    handleAnnouncementFormChange
                  }
                >
                  <option value="Published">
                    Publish Now
                  </option>

                  <option value="Draft">
                    Draft
                  </option>

                  <option value="Scheduled">
                    Schedule
                  </option>
                </select>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize:
                      "12px",
                    color:
                      "#64748b",
                  }}
                >
                  The current backend
                  service creates the
                  announcement
                  immediately. Draft and
                  schedule status are
                  currently UI-only.
                </p>
              </div>

              {announcementForm.status ===
                "Scheduled" && (
                <div className="announcement-form-grid">
                  <div className="announcement-form-group">
                    <label>
                      Publish Date *
                    </label>

                    <input
                      name="publishDate"
                      type="date"
                      value={
                        announcementForm.publishDate
                      }
                      onChange={
                        handleAnnouncementFormChange
                      }
                    />
                  </div>

                  <div className="announcement-form-group">
                    <label>
                      Publish Time *
                    </label>

                    <input
                      name="publishTime"
                      type="time"
                      value={
                        announcementForm.publishTime
                      }
                      onChange={
                        handleAnnouncementFormChange
                      }
                    />
                  </div>
                </div>
              )}

              {formError && (
                <div className="announcement-form-error">
                  {formError}
                </div>
              )}

              <div className="announcement-form-actions">
                <button
                  type="button"
                  className="announcement-cancel-button"
                  onClick={() => {
                    setShowCreateModal(
                      false
                    );

                    resetAnnouncementForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="announcement-save-button"
                  disabled={
                    isCreating
                  }
                >
                  <Send
                    size={17}
                  />

                  {isCreating
                    ? "Creating..."
                    : "Create Announcement"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal &&
        selectedAnnouncement && (
          <div className="announcement-modal-overlay">
            <section className="announcement-modal">
              <div className="announcement-modal-header">
                <div>
                  <p className="page-label">
                    Announcement
                    Management
                  </p>

                  <h2>
                    Edit Announcement
                  </h2>
                </div>

                <button
                  className="announcement-modal-close"
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="announcement-form">
                <div className="announcement-form-group">
                  <label>
                    Announcement Title
                  </label>

                  <input
                    name="title"
                    value={
                      selectedAnnouncement.title
                    }
                    onChange={
                      handleEditAnnouncementChange
                    }
                  />
                </div>

                <div className="announcement-form-grid">
                  <div className="announcement-form-group">
                    <label>
                      Course
                    </label>

                    <select
                      name="courseId"
                      value={
                        selectedAnnouncement.courseId
                      }
                      onChange={
                        handleEditAnnouncementChange
                      }
                    >
                      {courses.map(
                        (
                          course
                        ) => (
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

                  <div className="announcement-form-group">
                    <label>
                      Audience
                    </label>

                    <select
                      name="audience"
                      value={
                        selectedAnnouncement.audience
                      }
                      onChange={
                        handleEditAnnouncementChange
                      }
                    >
                      {audienceOptions.map(
                        (
                          audience
                        ) => (
                          <option
                            key={
                              audience
                            }
                            value={
                              audience
                            }
                          >
                            {
                              audience
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="announcement-form-group">
                  <label>
                    Message
                  </label>

                  <textarea
                    name="message"
                    rows="6"
                    value={
                      selectedAnnouncement.message
                    }
                    onChange={
                      handleEditAnnouncementChange
                    }
                  />
                </div>

                <div className="announcement-form-group">
                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      selectedAnnouncement.status
                    }
                    onChange={
                      handleEditAnnouncementChange
                    }
                  >
                    <option value="Published">
                      Published
                    </option>

                    <option value="Draft">
                      Draft
                    </option>

                    <option value="Scheduled">
                      Scheduled
                    </option>
                  </select>
                </div>

                {selectedAnnouncement.status ===
                  "Scheduled" && (
                  <div className="announcement-form-grid">
                    <div className="announcement-form-group">
                      <label>
                        Publish Date
                      </label>

                      <input
                        name="publishDate"
                        type="date"
                        value={
                          selectedAnnouncement.publishDate
                        }
                        onChange={
                          handleEditAnnouncementChange
                        }
                      />
                    </div>

                    <div className="announcement-form-group">
                      <label>
                        Publish Time
                      </label>

                      <input
                        name="publishTime"
                        type="time"
                        value={
                          selectedAnnouncement.publishTime
                        }
                        onChange={
                          handleEditAnnouncementChange
                        }
                      />
                    </div>
                  </div>
                )}

                <p
                  style={{
                    margin:
                      "10px 0",
                    fontSize:
                      "12px",
                    color:
                      "#64748b",
                  }}
                >
                  Editing is currently
                  frontend-only because
                  no update-announcement
                  service is connected.
                </p>

                {saveMessage && (
                  <div className="announcement-save-message">
                    {
                      saveMessage
                    }
                  </div>
                )}

                <div className="announcement-form-actions">
                  <button
                    type="button"
                    className="announcement-cancel-button"
                    onClick={() =>
                      setShowEditModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="announcement-save-button"
                    onClick={
                      handleSaveAnnouncement
                    }
                  >
                    <Save
                      size={17}
                    />

                    Save Changes
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorAnnouncements;