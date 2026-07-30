import { useState } from "react";

import {
  Bell,
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
  });

  const [notificationSettings, setNotificationSettings] = useState({
    assignmentSubmissions: true,
    quizCompletions: true,
    studentMessages: true,
    courseAnnouncements: false,
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Updates instructor profile input values.
  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));
  };

  // Updates instructor notification preferences.
  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;

    setNotificationSettings((currentSettings) => ({
      ...currentSettings,
      [name]: checked,
    }));
  };

  // Updates password input values.
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));
  };

  // Temporary profile save behavior until the backend is connected.
  const handleSaveProfile = (event) => {
    event.preventDefault();

    window.alert("Profile settings saved temporarily.");
  };

  // Temporary notification save behavior.
  const handleSaveNotifications = () => {
    window.alert("Notification preferences saved temporarily.");
  };

  // Validates and temporarily handles a password update.
  const handleUpdatePassword = (event) => {
    event.preventDefault();

    if (
      !passwordSettings.currentPassword ||
      !passwordSettings.newPassword ||
      !passwordSettings.confirmPassword
    ) {
      window.alert("Please complete all password fields.");
      return;
    }

    if (
      passwordSettings.newPassword !==
      passwordSettings.confirmPassword
    ) {
      window.alert("The new passwords do not match.");
      return;
    }

    window.alert("Password update will be connected to the backend later.");

    setPasswordSettings({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="settings-layout">
      {/* Reusable instructor navigation */}
      <InstructorSidebar />

      <main className="settings-main-content">
        {/* Page heading */}
        <header className="settings-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Settings</h1>
            <p>Manage your profile, notifications, and account security.</p>
          </div>

          <div className="settings-header-icon">
            <Settings size={24} />
          </div>
        </header>

        <div className="settings-content-grid">
          {/* Instructor profile */}
          <section className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon profile">
                <User size={20} />
              </div>

              <div>
                <h2>Profile Information</h2>
                <p>Update your instructor account details.</p>
              </div>
            </div>

            <form
              className="settings-form"
              onSubmit={handleSaveProfile}
            >
              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="firstName">First Name</label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={profileSettings.firstName}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="lastName">Last Name</label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={profileSettings.lastName}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="email">Email Address</label>

                <div className="settings-input-with-icon">
                  <Mail size={18} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileSettings.email}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="department">Department</label>

                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={profileSettings.department}
                    onChange={handleProfileChange}
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
                    value={profileSettings.officeLocation}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

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

          {/* Notification preferences */}
          <section className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon notifications">
                <Bell size={20} />
              </div>

              <div>
                <h2>Notifications</h2>
                <p>Choose which instructor alerts you receive.</p>
              </div>
            </div>

            <div className="notification-list">
              <label className="notification-option">
                <div>
                  <strong>Assignment Submissions</strong>
                  <span>
                    Receive an alert when students submit assignments.
                  </span>
                </div>

                <input
                  name="assignmentSubmissions"
                  type="checkbox"
                  checked={
                    notificationSettings.assignmentSubmissions
                  }
                  onChange={handleNotificationChange}
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>Quiz Completions</strong>
                  <span>
                    Receive an alert when students complete quizzes.
                  </span>
                </div>

                <input
                  name="quizCompletions"
                  type="checkbox"
                  checked={notificationSettings.quizCompletions}
                  onChange={handleNotificationChange}
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>Student Messages</strong>
                  <span>
                    Receive an alert when a student sends a message.
                  </span>
                </div>

                <input
                  name="studentMessages"
                  type="checkbox"
                  checked={notificationSettings.studentMessages}
                  onChange={handleNotificationChange}
                />
              </label>

              <label className="notification-option">
                <div>
                  <strong>Course Announcements</strong>
                  <span>
                    Receive confirmation when announcements are posted.
                  </span>
                </div>

                <input
                  name="courseAnnouncements"
                  type="checkbox"
                  checked={notificationSettings.courseAnnouncements}
                  onChange={handleNotificationChange}
                />
              </label>
            </div>

            <div className="settings-form-actions">
              <button
                className="settings-secondary-button"
                type="button"
                onClick={handleSaveNotifications}
              >
                <Save size={18} />
                Save Preferences
              </button>
            </div>
          </section>

          {/* Password and security */}
          <section className="settings-panel settings-security-panel">
            <div className="settings-panel-heading">
              <div className="settings-section-icon security">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2>Password and Security</h2>
                <p>Update the password used for your account.</p>
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

                <div className="settings-input-with-icon">
                  <LockKeyhole size={18} />

                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={passwordSettings.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="newPassword">New Password</label>

                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordSettings.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">
                    Confirm New Password
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordSettings.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>

              <div className="security-notice">
                <ShieldCheck size={19} />

                <p>
                  Use at least eight characters and include a mix of
                  letters, numbers, and symbols.
                </p>
              </div>

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