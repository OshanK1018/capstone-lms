import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();
        // Temporary mock login until real authentication is added
        navigate("/student/dashboard");
    }

    return (
        <main className="login">
            <div className="login__container">
                <h1 className="login__heading">LMS Login</h1>

                <section className="login__card">
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="form__group">
                            <label htmlFor="username">USERNAME</label>
                            <input
                                id="username"
                                className="form__input"
                                type="text"
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="form__group">
                            <label htmlFor="password">PASSWORD</label>
                            <input
                                id="password"
                                className="form__input"
                                type="password"
                                placeholder="Enter password"
                            />
                        </div>

                        <div className="form__actions">
                            <button type="submit" className="form__button">
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