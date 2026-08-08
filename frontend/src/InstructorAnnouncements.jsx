import { useMemo, useState } from "react";

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

import "./InstructorAnnouncements.css";

const initialAnnouncements = [
  {
    id: 1,
    title: "Project Submission Reminder",
    message:
      "Remember to submit the responsive website project before the deadline.",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    audience: "All Students",
    publishDate: "2026-08-08",
    publishTime: "09:00",
    status: "Published",
  },
  {
    id: 2,
    title: "Sprint Review Schedule",
    message:
      "The next sprint review will take place during Thursday's class session.",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    audience: "All Students",
    publishDate: "2026-08-07",
    publishTime: "10:30",
    status: "Published",
  },
  {
    id: 3,
    title: "Quiz Study Materials",
    message:
      "Study materials for the machine learning quiz are now available.",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    audience: "All Students",
    publishDate: "2026-08-10",
    publishTime: "08:00",
    status: "Scheduled",
  },
  {
    id: 4,
    title: "Office Hours Update",
    message:
      "Office hours will be moved to Friday afternoon for this week.",
    courseCode: "All Courses",
    courseName: "All Active Courses",
    audience: "All Students",
    publishDate: "",
    publishTime: "",
    status: "Draft",
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

const audienceOptions = [
  "All Students",
  "Enrolled Students",
];

function InstructorAnnouncements() {
  const [announcements, setAnnouncements] =
    useState(initialAnnouncements);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCourse, setSelectedCourse] =
    useState("All Courses");

  const [selectedStatus, setSelectedStatus] =
    useState("All Statuses");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [announcementForm, setAnnouncementForm] =
    useState({
      title: "",
      message: "",
      courseCode: "",
      audience: "All Students",
      status: "Draft",
      publishDate: "",
      publishTime: "",
    });

  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(
        announcements
          .map(
            (announcement) =>
              announcement.courseCode
          )
          .filter(
            (course) =>
              course !== "All Courses"
          )
      ),
    ];
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch =
      searchTerm.toLowerCase().trim();

    return announcements.filter(
      (announcement) => {
        const matchesSearch =
          announcement.title
            .toLowerCase()
            .includes(normalizedSearch) ||
          announcement.message
            .toLowerCase()
            .includes(normalizedSearch) ||
          announcement.courseCode
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesCourse =
          selectedCourse === "All Courses" ||
          announcement.courseCode ===
            selectedCourse;

        const matchesStatus =
          selectedStatus === "All Statuses" ||
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
        announcement.status === "Published"
    ).length;

  const scheduledCount =
    announcements.filter(
      (announcement) =>
        announcement.status === "Scheduled"
    ).length;

  const draftCount =
    announcements.filter(
      (announcement) =>
        announcement.status === "Draft"
    ).length;

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      message: "",
      courseCode: "",
      audience: "All Students",
      status: "Draft",
      publishDate: "",
      publishTime: "",
    });

    setFormError("");
  };

  const handleAnnouncementFormChange = (
    event
  ) => {
    const { name, value } = event.target;

    setAnnouncementForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );

    setFormError("");
  };

  const getCourseName = (courseCode) => {
    if (courseCode === "All Courses") {
      return "All Active Courses";
    }

    const course =
      temporaryCourses.find(
        (currentCourse) =>
          currentCourse.code ===
          courseCode
      );

    return course?.name || "";
  };

  const handleCreateAnnouncement = (
    event
  ) => {
    event.preventDefault();

    if (
      !announcementForm.title.trim() ||
      !announcementForm.message.trim() ||
      !announcementForm.courseCode
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

    const newAnnouncement = {
      id: Date.now(),
      title:
        announcementForm.title.trim(),
      message:
        announcementForm.message.trim(),
      courseCode:
        announcementForm.courseCode,
      courseName: getCourseName(
        announcementForm.courseCode
      ),
      audience:
        announcementForm.audience,
      status:
        announcementForm.status,
      publishDate:
        announcementForm.status ===
        "Draft"
          ? ""
          : announcementForm.publishDate ||
            new Date()
              .toISOString()
              .split("T")[0],
      publishTime:
        announcementForm.status ===
        "Draft"
          ? ""
          : announcementForm.publishTime ||
            "09:00",
    };

    setAnnouncements(
      (previousAnnouncements) => [
        ...previousAnnouncements,
        newAnnouncement,
      ]
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
    const { name, value } = event.target;

    setSelectedAnnouncement(
      (previousAnnouncement) => ({
        ...previousAnnouncement,
        [name]: value,
      })
    );

    setSaveMessage("");
  };

  const handleSaveAnnouncement = () => {
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

    const updatedAnnouncement = {
      ...selectedAnnouncement,
      courseName: getCourseName(
        selectedAnnouncement.courseCode
      ),
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

  const handleDeleteAnnouncement = (
    announcement
  ) => {
    const shouldDelete =
      window.confirm(
        `Delete "${announcement.title}"?`
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
    if (!announcement.publishDate) {
      return "Not published";
    }

    if (announcement.publishTime) {
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

            <h1>Announcements</h1>

            <p>
              Share important updates with
              students in your courses.
            </p>
          </div>

          <button
            className="announcements-primary-button"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            <Plus size={19} />
            Create Announcement
          </button>
        </header>

        <section className="announcement-stat-grid">
          <article className="announcement-stat-card">
            <div className="announcement-stat-icon total">
              <Megaphone size={22} />
            </div>

            <div>
              <span>
                Total Announcements
              </span>

              <strong>
                {announcements.length}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon published">
              <Send size={22} />
            </div>

            <div>
              <span>Published</span>

              <strong>
                {publishedCount}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon scheduled">
              <CalendarDays size={22} />
            </div>

            <div>
              <span>Scheduled</span>

              <strong>
                {scheduledCount}
              </strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon drafts">
              <Edit3 size={22} />
            </div>

            <div>
              <span>Drafts</span>

              <strong>
                {draftCount}
              </strong>
            </div>
          </article>
        </section>

        <section className="announcement-filter-section">
          <div className="announcement-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="announcement-filter-controls">
            <select
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(
                  event.target.value
                )
              }
            >
              {courseOptions.map(
                (course) => (
                  <option
                    key={course}
                    value={course}
                  >
                    {course}
                  </option>
                )
              )}
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
                Showing{" "}
                {
                  filteredAnnouncements.length
                }{" "}
                of {announcements.length}{" "}
                announcements
              </p>
            </div>
          </div>

          {filteredAnnouncements.length >
          0 ? (
            <div className="announcement-card-list">
              {filteredAnnouncements.map(
                (announcement) => (
                  <article
                    className="announcement-card"
                    key={announcement.id}
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
                          className={`announcement-status ${announcement.status.toLowerCase()}`}
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
                              size={16}
                            />

                            {
                              announcement.audience
                            }
                          </span>

                          <span>
                            <CalendarDays
                              size={16}
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
                              size={16}
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
                              size={17}
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
              <Megaphone size={36} />

              <h3>
                No announcements found
              </h3>

              <p>
                Try changing your search or
                filter selections.
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
                  Announcement Management
                </p>

                <h2>
                  Create Announcement
                </h2>
              </div>

              <button
                className="announcement-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
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
                  <label>Course *</label>

                  <select
                    name="courseCode"
                    value={
                      announcementForm.courseCode
                    }
                    onChange={
                      handleAnnouncementFormChange
                    }
                  >
                    <option value="">
                      Select course
                    </option>

                    <option value="All Courses">
                      All Courses
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

                <div className="announcement-form-group">
                  <label>Audience</label>

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
                      (audience) => (
                        <option
                          key={audience}
                          value={audience}
                        >
                          {audience}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="announcement-form-group">
                <label>Message *</label>

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
                <label>Status</label>

                <select
                  name="status"
                  value={
                    announcementForm.status
                  }
                  onChange={
                    handleAnnouncementFormChange
                  }
                >
                  <option value="Draft">
                    Draft
                  </option>

                  <option value="Published">
                    Publish Now
                  </option>

                  <option value="Scheduled">
                    Schedule
                  </option>
                </select>
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
                    setShowCreateModal(false);
                    resetAnnouncementForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="announcement-save-button"
                >
                  {announcementForm.status ===
                  "Published" ? (
                    <Send size={17} />
                  ) : (
                    <Save size={17} />
                  )}

                  {announcementForm.status ===
                  "Published"
                    ? "Publish Announcement"
                    : announcementForm.status ===
                      "Scheduled"
                    ? "Schedule Announcement"
                    : "Save Draft"}
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
                    Announcement Management
                  </p>

                  <h2>
                    Edit Announcement
                  </h2>
                </div>

                <button
                  className="announcement-modal-close"
                  onClick={() =>
                    setShowEditModal(false)
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
                    <label>Course</label>

                    <select
                      name="courseCode"
                      value={
                        selectedAnnouncement.courseCode
                      }
                      onChange={
                        handleEditAnnouncementChange
                      }
                    >
                      <option value="All Courses">
                        All Courses
                      </option>

                      {temporaryCourses.map(
                        (course) => (
                          <option
                            key={
                              course.code
                            }
                            value={
                              course.code
                            }
                          >
                            {course.code} -{" "}
                            {course.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="announcement-form-group">
                    <label>Audience</label>

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
                        (audience) => (
                          <option
                            key={audience}
                            value={audience}
                          >
                            {audience}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="announcement-form-group">
                  <label>Message</label>

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
                  <label>Status</label>

                  <select
                    name="status"
                    value={
                      selectedAnnouncement.status
                    }
                    onChange={
                      handleEditAnnouncementChange
                    }
                  >
                    <option value="Draft">
                      Draft
                    </option>

                    <option value="Published">
                      Published
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

                {saveMessage && (
                  <div className="announcement-save-message">
                    {saveMessage}
                  </div>
                )}

                <div className="announcement-form-actions">
                  <button
                    type="button"
                    className="announcement-cancel-button"
                    onClick={() =>
                      setShowEditModal(false)
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
                    <Save size={17} />
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