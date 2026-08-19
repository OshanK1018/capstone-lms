import "./Login.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../../../backend/authServices.js";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoginError("");
    setIsLoggingIn(true);

    const result = await loginUser(email, password);

    setIsLoggingIn(false);

    if (!result.success) {
      setLoginError(
        result.error || "Unable to log in."
      );

      return;
    }

    const user = result.user;

    if (!user) {
      setLoginError(
        "Login succeeded, but no user information was returned."
      );

      return;
    }

    const userRole = (
      user.role ||
      user.user_role ||
      ""
    ).toLowerCase();

    // Make sure the selected portal matches the user's real role.
    if (userRole !== role) {
      setLoginError(
        `This account is registered as a ${userRole}. Please select the correct login type.`
      );

      return;
    }

    if (userRole === "student") {
      navigate("/student/dashboard");
      return;
    }

    if (userRole === "instructor") {
      navigate("/instructor/dashboard");
      return;
    }

    if (userRole === "admin") {
      setLoginError(
        "Admin login is not connected to a portal yet."
      );

      return;
    }

    setLoginError(
      "Your account role could not be recognized."
    );
  }

  return (
    <main className="login">
      <div className="login__container">
        <h1 className="login__heading">
          LMS Login
        </h1>

        <section className="login__card">
          <div className="role-selection">
            <button
              type="button"
              className={
                role === "student"
                  ? "role-button active"
                  : "role-button"
              }
              onClick={() => {
                setRole("student");
                setLoginError("");
              }}
            >
              Student
            </button>

            <button
              type="button"
              className={
                role === "instructor"
                  ? "role-button active"
                  : "role-button"
              }
              onClick={() => {
                setRole("instructor");
                setLoginError("");
              }}
            >
              Instructor
            </button>
          </div>

          <p className="login__role-text">
            Logging in as{" "}
            <strong>
              {role === "student"
                ? "Student"
                : "Instructor"}
            </strong>
          </p>

          <form
            className="form"
            onSubmit={handleSubmit}
          >
            <div className="form__group">
              <label htmlFor="email">
                EMAIL
              </label>

              <input
                id="email"
                className="form__input"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="form__group">
              <label htmlFor="password">
                PASSWORD
              </label>

              <input
                id="password"
                className="form__input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            {loginError && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {loginError}
              </div>
            )}

            <div className="form__actions">
              <button
                type="submit"
                className="form__button"
                disabled={isLoggingIn}
              >
                {isLoggingIn
                  ? "Logging In..."
                  : "Log In"}
              </button>
            </div>

            <div className="form__footer">
              <a href="#">
                Forgot Password?
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Login;