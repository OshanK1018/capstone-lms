import { useMemo, useState } from "react";

import {
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorSettings.css";

function InstructorSettings() {
  const [profileSettings, setProfileSettings] = useState({
    firstName: "Oshan",
    lastName: "Karunarathna",
    email: "oshan@example.com",
    department: "Computer Science",
    officeLocation: "Room 405",
    officeHours: "Monday & Wednesday, 2:00 PM - 4:00 PM",
    bio: "Computer Science instructor focused on software development and web technologies.",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    assignmentSubmissions: true,
    quizCompletions: true,
    studentMessages: true,
    courseAnnouncements: false,
    lateSubmissions: true,
    upcomingDeadlines: true,
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [notificationMessage, setNotificationMessage] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));

    setProfileMessage("");
  };

  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;

    setNotificationSettings((currentSettings) => ({
      ...currentSettings,
      [name]: checked,
    }));

    setNotificationMessage("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();

    if (
      !profileSettings.firstName.trim() ||
      !profileSettings.lastName.trim() ||
      !profileSettings.email.trim()
    ) {
      setProfileMessage(
        "First name, last name, and email are required."
      );

      return;
    }

    setProfileMessage(
      "Profile settings saved temporarily."
    );
  };

  const handleSaveNotifications = () => {
    setNotificationMessage(
      "Notification preferences saved temporarily."
    );
  };

  const passwordChecks = useMemo(() => {
    const hasEightCharacters =
      passwordSettings.newPassword.length >= 8;

    const passwordsMatch =
      passwordSettings.newPassword !== "" &&
      passwordSettings.newPassword ===
        passwordSettings.confirmPassword;

    const differentFromCurrent =
      passwordSettings.newPassword !== "" &&
      passwordSettings.newPassword !==
        passwordSettings.currentPassword;

    return {
      hasEightCharacters,
      passwordsMatch,
      differentFromCurrent,
    };
  }, [passwordSettings]);

  const handleUpdatePassword = (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwordSettings.currentPassword ||
      !passwordSettings.newPassword ||
      !passwordSettings.confirmPassword
    ) {
      setPasswordError(
        "Please complete all password fields."
      );

      return;
    }

    if (!passwordChecks.hasEightCharacters) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );

      return;
    }

    if (!passwordChecks.differentFromCurrent) {
      setPasswordError(
        "Your new password must be different from your current password."
      );

      return;
    }

    if (!passwordChecks.passwordsMatch) {
      setPasswordError(
        "The new passwords do not match."
      );

      return;
    }

    setPasswordMessage(
      "Password change is ready for backend connection."
    );

    setPasswordSettings({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="settings-layout">
      <InstructorSidebar />

      <main className="settings-main-content">
        <header className="settings-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>Settings</h1>

            <p>
              Manage your profile, notifications,
              and account security.
            </p>
          </div>

          <div className="settings-header-icon">
            <Settings size={24} />
          </div>
        </header>

        <div className="settings-content-grid">
          {/* Profile */}
          <section className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon profile">
                <User size={20} />
              </div>

              <div>
                <h2>Profile Information</h2>

                <p>
                  Update your instructor account
                  details.
                </p>
              </div>
            </div>

            <form
              className="settings-form"
              onSubmit={handleSaveProfile}
            >
              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="firstName">
                    First Name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={
                      profileSettings.firstName
                    }
                    onChange={
                      handleProfileChange
                    }
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="lastName">
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={
                      profileSettings.lastName
                    }
                    onChange={
                      handleProfileChange
                    }
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <div className="settings-input-with-icon">
                  <Mail size={18} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={
                      profileSettings.email
                    }
                    onChange={
                      handleProfileChange
                    }
                  />
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="department">
                    Department
                  </label>

                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={
                      profileSettings.department
                    }
                    onChange={
                      handleProfileChange
                    }
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="officeLocation">
                    Office Location
                  </label>

                  <input
                    id="officeLocation"
                    name="officeLocation"
                    type="text"
                    value={
                      profileSettings.officeLocation
                    }
                    onChange={
                      handleProfileChange
                    }
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="officeHours">
                  Office Hours
                </label>

                <input
                  id="officeHours"
                  name="officeHours"
                  type="text"
                  placeholder="Example: Monday 2 PM - 4 PM"
                  value={
                    profileSettings.officeHours
                  }
                  onChange={
                    handleProfileChange
                  }
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="bio">
                  Instructor Bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  placeholder="Add a short instructor bio..."
                  value={profileSettings.bio}
                  onChange={
                    handleProfileChange
                  }
                />
              </div>

              {profileMessage && (
                <div className="settings-save-message">
                  <CheckCircle2 size={17} />

                  {profileMessage}
                </div>
              )}

              <div className="settings-form-actions">
                <button
                  className="settings-primary-button"
                  type="submit"
                >
                  <Save size={18} />
                  Save Profile
                </button>
              </div>
            </form>
          </section>

          {/* Notifications */}
          <section className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon notifications">
                <Bell size={20} />
              </div>

              <div>
                <h2>Notifications</h2>

                <p>
                  Choose which instructor alerts
                  you receive.
                </p>
              </div>
            </div>

            <div className="notification-list">
              <label className="notification-option">
                <div>
                  <strong>
                    Assignment Submissions
                  </strong>

                  <span>
                    Receive an alert when students
                    submit assignments.
                  </span>
                </div>

                <input
                  name="assignmentSubmissions"
                  type="checkbox"
                  checked={
                    notificationSettings.assignmentSubmissions
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>
                    Quiz Completions
                  </strong>

                  <span>
                    Receive an alert when students
                    complete quizzes.
                  </span>
                </div>

                <input
                  name="quizCompletions"
                  type="checkbox"
                  checked={
                    notificationSettings.quizCompletions
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>
                    Student Messages
                  </strong>

                  <span>
                    Receive an alert when a
                    student sends a message.
                  </span>
                </div>

                <input
                  name="studentMessages"
                  type="checkbox"
                  checked={
                    notificationSettings.studentMessages
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>
                    Course Announcements
                  </strong>

                  <span>
                    Receive confirmation when
                    announcements are posted.
                  </span>
                </div>

                <input
                  name="courseAnnouncements"
                  type="checkbox"
                  checked={
                    notificationSettings.courseAnnouncements
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>
                    Late Submissions
                  </strong>

                  <span>
                    Receive an alert when work is
                    submitted after its deadline.
                  </span>
                </div>

                <input
                  name="lateSubmissions"
                  type="checkbox"
                  checked={
                    notificationSettings.lateSubmissions
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>
                    Upcoming Deadlines
                  </strong>

                  <span>
                    Receive reminders for
                    upcoming assignments and
                    quizzes.
                  </span>
                </div>

                <input
                  name="upcomingDeadlines"
                  type="checkbox"
                  checked={
                    notificationSettings.upcomingDeadlines
                  }
                  onChange={
                    handleNotificationChange
                  }
                />
              </label>
            </div>

            {notificationMessage && (
              <div className="settings-save-message">
                <CheckCircle2 size={17} />

                {notificationMessage}
              </div>
            )}

            <div className="settings-form-actions">
              <button
                className="settings-secondary-button"
                type="button"
                onClick={
                  handleSaveNotifications
                }
              >
                <Save size={18} />
                Save Preferences
              </button>
            </div>
          </section>

          {/* Account information */}
          <section className="settings-panel settings-account-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon account">
                <IdCard size={20} />
              </div>

              <div>
                <h2>Account Information</h2>

                <p>
                  Basic information about your
                  instructor account.
                </p>
              </div>
            </div>

            <div className="settings-account-grid">
              <div className="settings-account-item">
                <span>Instructor ID</span>

                <strong>INS-10001</strong>
              </div>

              <div className="settings-account-item">
                <span>Account Type</span>

                <strong>Instructor</strong>
              </div>

              <div className="settings-account-item">
                <span>Department</span>

                <strong>
                  {profileSettings.department}
                </strong>
              </div>

              <div className="settings-account-item">
                <span>Account Status</span>

                <strong className="settings-active-status">
                  Active
                </strong>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="settings-panel settings-security-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon security">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2>
                  Password and Security
                </h2>

                <p>
                  Update the password used for
                  your account.
                </p>
              </div>
            </div>

            <form
              className="settings-form"
              onSubmit={handleUpdatePassword}
            >
              <div className="settings-form-group">
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <div className="settings-password-input">
                  <LockKeyhole size={18} />

                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter current password"
                    value={
                      passwordSettings.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (currentValue) =>
                          !currentValue
                      )
                    }
                    aria-label="Show or hide current password"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="newPassword">
                    New Password
                  </label>

                  <div className="settings-password-input">
                    <LockKeyhole size={18} />

                    <input
                      id="newPassword"
                      name="newPassword"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={
                        passwordSettings.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (currentValue) =>
                            !currentValue
                        )
                      }
                      aria-label="Show or hide new password"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">
                    Confirm New Password
                  </label>

                  <div className="settings-password-input">
                    <LockKeyhole size={18} />

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={
                        passwordSettings.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (currentValue) =>
                            !currentValue
                        )
                      }
                      aria-label="Show or hide confirmed password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="password-requirement-list">
                <div
                  className={
                    passwordChecks.hasEightCharacters
                      ? "password-requirement valid"
                      : "password-requirement"
                  }
                >
                  <CheckCircle2 size={16} />

                  At least 8 characters
                </div>

                <div
                  className={
                    passwordChecks.differentFromCurrent
                      ? "password-requirement valid"
                      : "password-requirement"
                  }
                >
                  <CheckCircle2 size={16} />

                  Different from current password
                </div>

                <div
                  className={
                    passwordChecks.passwordsMatch
                      ? "password-requirement valid"
                      : "password-requirement"
                  }
                >
                  <CheckCircle2 size={16} />

                  New passwords match
                </div>
              </div>

              <div className="security-notice">
                <ShieldCheck size={19} />

                <p>
                  Password changes are
                  frontend-only until account
                  authentication is connected to
                  the backend.
                </p>
              </div>

              {passwordError && (
                <div className="settings-error-message">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="settings-save-message">
                  <CheckCircle2 size={17} />

                  {passwordMessage}
                </div>
              )}

              <div className="settings-form-actions">
                <button
                  className="settings-primary-button"
                  type="submit"
                >
                  <LockKeyhole size={18} />
                  Update Password
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InstructorSettings;