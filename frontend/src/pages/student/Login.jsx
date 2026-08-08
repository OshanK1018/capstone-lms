import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    // Stores whether the user selected student or instructor.
    const [role, setRole] = useState("student");

    function handleSubmit(event) {
        event.preventDefault();

        // Temporary frontend routing until authentication is connected.
        if (role === "student") {
            navigate("/student/dashboard");
        } else {
            navigate("/instructor/dashboard");
        }
    }

    return (
        <main className="login">
            <div className="login__container">
                <h1 className="login__heading">LMS Login</h1>

                <section className="login__card">

                    {/* User role selection */}
                    <div className="role-selection">
                        <button
                            type="button"
                            className={
                                role === "student"
                                    ? "role-button active"
                                    : "role-button"
                            }
                            onClick={() => setRole("student")}
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
                            onClick={() => setRole("instructor")}
                        >
                            Instructor
                        </button>
                    </div>

                    <p className="login__role-text">
                        Logging in as{" "}
                        <strong>
                            {role === "student" ? "Student" : "Instructor"}
                        </strong>
                    </p>

                    <form className="form" onSubmit={handleSubmit}>
                        <div className="form__group">
                            <label htmlFor="username">USERNAME</label>

                            <input
                                id="username"
                                className="form__input"
                                type="text"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div className="form__group">
                            <label htmlFor="password">PASSWORD</label>

                            <input
                                id="password"
                                className="form__input"
                                type="password"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <div className="form__actions">
                            <button
                                type="submit"
                                className="form__button"
                            >
                                Log In
                            </button>
                        </div>

                        <div className="form__footer">
                            <a href="#">Forgot Password?</a>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default Login;