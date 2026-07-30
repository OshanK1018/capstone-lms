import { useMemo, useState } from "react";

import {
  CalendarDays,
  Edit3,
  Megaphone,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorAnnouncements.css";

// Temporary announcement data until the backend is connected.
const announcementData = [
  {
    id: 1,
    title: "Project Submission Reminder",
    message:
      "Remember to submit the responsive website project before the deadline.",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    audience: "32 students",
    publishDate: "July 28, 2026",
    status: "Published",
  },
  {
    id: 2,
    title: "Sprint Review Schedule",
    message:
      "The next sprint review will take place during Thursday's class session.",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    audience: "28 students",
    publishDate: "July 27, 2026",
    status: "Published",
  },
  {
    id: 3,
    title: "Quiz Study Materials",
    message:
      "Study materials for the machine learning quiz are now available.",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    audience: "24 students",
    publishDate: "July 30, 2026",
    status: "Scheduled",
  },
  {
    id: 4,
    title: "Office Hours Update",
    message:
      "Office hours will be moved to Friday afternoon for this week.",
    courseCode: "All Courses",
    courseName: "All Active Courses",
    audience: "84 students",
    publishDate: "July 31, 2026",
    status: "Draft",
  },
];

function InstructorAnnouncements() {
  const [announcements, setAnnouncements] = useState(announcementData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Creates the available course filter options.
  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(
        announcements
          .map((announcement) => announcement.courseCode)
          .filter((course) => course !== "All Courses")
      ),
    ];
  }, [announcements]);

  // Filters announcements by search text, course, and status.
  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title.toLowerCase().includes(normalizedSearch) ||
        announcement.message.toLowerCase().includes(normalizedSearch) ||
        announcement.courseCode.toLowerCase().includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        announcement.courseCode === selectedCourse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        announcement.status === selectedStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [announcements, searchTerm, selectedCourse, selectedStatus]);

  const publishedCount = announcements.filter(
    (announcement) => announcement.status === "Published"
  ).length;

  const scheduledCount = announcements.filter(
    (announcement) => announcement.status === "Scheduled"
  ).length;

  const draftCount = announcements.filter(
    (announcement) => announcement.status === "Draft"
  ).length;

  // Temporary behavior until the announcement form is created.
  const handleCreateAnnouncement = () => {
    window.alert("The Create Announcement form will be added later.");
  };

  // Temporary behavior until editing is connected.
  const handleEditAnnouncement = (announcement) => {
    window.alert(`Editing announcement: ${announcement.title}`);
  };

  // Removes an announcement from the temporary page data.
  const handleDeleteAnnouncement = (announcement) => {
    const shouldDelete = window.confirm(
      `Delete "${announcement.title}"?`
    );

    if (!shouldDelete) {
      return;
    }

    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.filter(
        (currentAnnouncement) =>
          currentAnnouncement.id !== announcement.id
      )
    );
  };

  return (
    <div className="announcements-layout">
      {/* Reusable instructor navigation */}
      <InstructorSidebar />

      <main className="announcements-main-content">
        {/* Page heading */}
        <header className="announcements-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Announcements</h1>
            <p>Share important updates with students in your courses.</p>
          </div>

          <button
            className="announcements-primary-button"
            onClick={handleCreateAnnouncement}
          >
            <Plus size={19} />
            Create Announcement
          </button>
        </header>

        {/* Announcement summary cards */}
        <section className="announcement-stat-grid">
          <article className="announcement-stat-card">
            <div className="announcement-stat-icon total">
              <Megaphone size={22} />
            </div>

            <div>
              <span>Total Announcements</span>
              <strong>{announcements.length}</strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon published">
              <Send size={22} />
            </div>

            <div>
              <span>Published</span>
              <strong>{publishedCount}</strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon scheduled">
              <CalendarDays size={22} />
            </div>

            <div>
              <span>Scheduled</span>
              <strong>{scheduledCount}</strong>
            </div>
          </article>

          <article className="announcement-stat-card">
            <div className="announcement-stat-icon drafts">
              <Edit3 size={22} />
            </div>

            <div>
              <span>Drafts</span>
              <strong>{draftCount}</strong>
            </div>
          </article>
        </section>

        {/* Search and filter controls */}
        <section className="announcement-filter-section">
          <div className="announcement-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="announcement-filter-controls">
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              aria-label="Filter announcements by course"
            >
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              aria-label="Filter announcements by status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </section>

        {/* Announcement list */}
        <section className="announcement-list-panel">
          <div className="announcement-list-heading">
            <div>
              <h2>All Announcements</h2>
              <p>
                Showing {filteredAnnouncements.length} of{" "}
                {announcements.length} announcements
              </p>
            </div>
          </div>

          {filteredAnnouncements.length > 0 ? (
            <div className="announcement-card-list">
              {filteredAnnouncements.map((announcement) => (
                <article
                  className="announcement-card"
                  key={announcement.id}
                >
                  <div className="announcement-card-icon">
                    <Megaphone size={21} />
                  </div>

                  <div className="announcement-card-content">
                    <div className="announcement-card-heading">
                      <div>
                        <h3>{announcement.title}</h3>

                        <div className="announcement-course-information">
                          <strong>{announcement.courseCode}</strong>
                          <span>{announcement.courseName}</span>
                        </div>
                      </div>

                      <span
                        className={`announcement-status ${announcement.status.toLowerCase()}`}
                      >
                        {announcement.status}
                      </span>
                    </div>

                    <p className="announcement-message">
                      {announcement.message}
                    </p>

                    <div className="announcement-card-footer">
                      <div className="announcement-metadata">
                        <span>
                          <Users size={16} />
                          {announcement.audience}
                        </span>

                        <span>
                          <CalendarDays size={16} />
                          {announcement.publishDate}
                        </span>
                      </div>

                      <div className="announcement-actions">
                        <button
                          className="announcement-edit-button"
                          onClick={() =>
                            handleEditAnnouncement(announcement)
                          }
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>

                        <button
                          className="announcement-delete-button"
                          onClick={() =>
                            handleDeleteAnnouncement(announcement)
                          }
                          aria-label={`Delete ${announcement.title}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-announcement-message">
              <Megaphone size={36} />
              <h3>No announcements found</h3>
              <p>Try changing your search or filter selections.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorAnnouncements;