import { useMemo, useState } from "react";

import {
  CheckCircle2,
  CircleHelp,
  Clock,
  Eye,
  FileEdit,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorQuizzes.css";

const createEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  type: "Multiple Choice",
  text: "",
  points: 10,
  choices: [
    {
      id: Date.now() + Math.random(),
      text: "",
      correct: true,
    },
    {
      id: Date.now() + Math.random(),
      text: "",
      correct: false,
    },
  ],
  shortAnswer: "",
});

const initialQuizzes = [
  {
    id: 1,
    title: "HTML and CSS Fundamentals",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    category: "Quizzes",
    questions: [
      {
        id: 1,
        type: "Multiple Choice",
        text: "What does CSS stand for?",
        points: 5,
        choices: [
          {
            id: 1,
            text: "Cascading Style Sheets",
            correct: true,
          },
          {
            id: 2,
            text: "Computer Style Sheets",
            correct: false,
          },
          {
            id: 3,
            text: "Creative Style System",
            correct: false,
          },
        ],
        shortAnswer: "",
      },
      {
        id: 2,
        type: "Multiple Answers",
        text: "Which are JavaScript variable keywords?",
        points: 10,
        choices: [
          {
            id: 1,
            text: "let",
            correct: true,
          },
          {
            id: 2,
            text: "const",
            correct: true,
          },
          {
            id: 3,
            text: "style",
            correct: false,
          },
        ],
        shortAnswer: "",
      },
      {
        id: 3,
        type: "Short Answer",
        text: "What HTML tag creates a hyperlink?",
        points: 5,
        choices: [],
        shortAnswer: "<a>",
      },
    ],
    timeLimit: 30,
    attempts: 28,
    totalStudents: 32,
    status: "Published",
  },
  {
    id: 2,
    title: "Agile Development Concepts",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    category: "Quizzes",
    questions: [
      {
        id: 1,
        type: "Multiple Choice",
        text: "Which is an Agile methodology?",
        points: 10,
        choices: [
          {
            id: 1,
            text: "Scrum",
            correct: true,
          },
          {
            id: 2,
            text: "Waterfall",
            correct: false,
          },
        ],
        shortAnswer: "",
      },
    ],
    timeLimit: 40,
    attempts: 19,
    totalStudents: 28,
    status: "Published",
  },
  {
    id: 3,
    title: "Machine Learning Basics",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    category: "Quizzes",
    questions: [
      {
        id: 1,
        type: "Multiple Choice",
        text: "Which is an example of supervised learning?",
        points: 10,
        choices: [
          {
            id: 1,
            text: "Classification",
            correct: true,
          },
          {
            id: 2,
            text: "Clustering",
            correct: false,
          },
        ],
        shortAnswer: "",
      },
    ],
    timeLimit: 25,
    attempts: 0,
    totalStudents: 24,
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

const temporaryCategories = [
  "Quizzes",
  "Assignments",
  "Projects",
  "Midterm",
  "Final Exam",
];

const temporaryAttempts = [
  {
    id: 1,
    studentId: "10024567",
    studentName: "Alex Johnson",
    score: 90,
    submittedAt: "August 10, 2026",
    status: "Completed",
  },
  {
    id: 2,
    studentId: "10024568",
    studentName: "Jordan Smith",
    score: 85,
    submittedAt: "August 10, 2026",
    status: "Completed",
  },
  {
    id: 3,
    studentId: "10024569",
    studentName: "Taylor Brown",
    score: 100,
    submittedAt: "August 11, 2026",
    status: "Completed",
  },
];

function InstructorQuizzes() {
  const [quizzes, setQuizzes] =
    useState(initialQuizzes);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCourse, setSelectedCourse] =
    useState("All Courses");

  const [selectedStatus, setSelectedStatus] =
    useState("All Statuses");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showManageModal, setShowManageModal] =
    useState(false);

  const [selectedQuiz, setSelectedQuiz] =
    useState(null);

  const [selectedAttempt, setSelectedAttempt] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [manageError, setManageError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [quizForm, setQuizForm] = useState({
    title: "",
    courseCode: "",
    category: "",
    timeLimit: "",
    status: "Draft",
  });

  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
  ]);

  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(
        quizzes.map((quiz) => quiz.courseCode)
      ),
    ];
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const normalizedSearch =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        quiz.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        quiz.courseCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        quiz.courseName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        quiz.courseCode === selectedCourse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        quiz.status === selectedStatus;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus
      );
    });
  }, [
    quizzes,
    searchTerm,
    selectedCourse,
    selectedStatus,
  ]);

  const publishedQuizzes = quizzes.filter(
    (quiz) => quiz.status === "Published"
  ).length;

  const draftQuizzes = quizzes.filter(
    (quiz) => quiz.status === "Draft"
  ).length;

  const totalAttempts = quizzes.reduce(
    (total, quiz) => total + quiz.attempts,
    0
  );

  const handleQuizFormChange = (event) => {
    const { name, value } = event.target;

    setQuizForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setFormError("");
  };

  const updateQuestion = (
    questionId,
    field,
    value
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );

    setFormError("");
  };

  const changeQuestionType = (
    questionId,
    newType
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        if (newType === "Short Answer") {
          return {
            ...question,
            type: newType,
            choices: [],
            shortAnswer: "",
          };
        }

        return {
          ...question,
          type: newType,
          shortAnswer: "",
          choices:
            question.choices.length >= 2
              ? question.choices
              : [
                  {
                    id:
                      Date.now() +
                      Math.random(),
                    text: "",
                    correct: true,
                  },
                  {
                    id:
                      Date.now() +
                      Math.random(),
                    text: "",
                    correct: false,
                  },
                ],
        };
      })
    );

    setFormError("");
  };

  const addChoice = (questionId) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              choices: [
                ...question.choices,
                {
                  id:
                    Date.now() +
                    Math.random(),
                  text: "",
                  correct: false,
                },
              ],
            }
          : question
      )
    );
  };

  const removeChoice = (
    questionId,
    choiceId
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        if (question.choices.length <= 2) {
          return question;
        }

        return {
          ...question,
          choices: question.choices.filter(
            (choice) =>
              choice.id !== choiceId
          ),
        };
      })
    );
  };

  const updateChoiceText = (
    questionId,
    choiceId,
    value
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              choices: question.choices.map(
                (choice) =>
                  choice.id === choiceId
                    ? {
                        ...choice,
                        text: value,
                      }
                    : choice
              ),
            }
          : question
      )
    );
  };

  const setChoiceCorrect = (
    questionId,
    choiceId
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        if (
          question.type ===
          "Multiple Choice"
        ) {
          return {
            ...question,
            choices: question.choices.map(
              (choice) => ({
                ...choice,
                correct:
                  choice.id === choiceId,
              })
            ),
          };
        }

        return {
          ...question,
          choices: question.choices.map(
            (choice) =>
              choice.id === choiceId
                ? {
                    ...choice,
                    correct:
                      !choice.correct,
                  }
                : choice
          ),
        };
      })
    );
  };

  const handleAddQuestion = () => {
    setQuestions((previousQuestions) => [
      ...previousQuestions,
      createEmptyQuestion(),
    ]);
  };

  const handleRemoveQuestion = (
    questionId
  ) => {
    if (questions.length === 1) {
      return;
    }

    setQuestions((previousQuestions) =>
      previousQuestions.filter(
        (question) =>
          question.id !== questionId
      )
    );
  };

  const resetCreateQuiz = () => {
    setQuizForm({
      title: "",
      courseCode: "",
      category: "",
      timeLimit: "",
      status: "Draft",
    });

    setQuestions([
      createEmptyQuestion(),
    ]);

    setFormError("");
  };

  const questionsAreInvalid = (
    questionList
  ) => {
    return questionList.some(
      (question) => {
        if (!question.text.trim()) {
          return true;
        }

        if (
          Number(question.points) <= 0
        ) {
          return true;
        }

        if (
          question.type ===
          "Short Answer"
        ) {
          return !question.shortAnswer.trim();
        }

        if (
          question.choices.length < 2
        ) {
          return true;
        }

        if (
          question.choices.some(
            (choice) =>
              !choice.text.trim()
          )
        ) {
          return true;
        }

        if (
          !question.choices.some(
            (choice) => choice.correct
          )
        ) {
          return true;
        }

        return false;
      }
    );
  };

  const handleCreateQuiz = (event) => {
    event.preventDefault();

    if (
      !quizForm.title.trim() ||
      !quizForm.courseCode ||
      !quizForm.category ||
      !quizForm.timeLimit
    ) {
      setFormError(
        "Please complete all required quiz fields."
      );

      return;
    }

    if (questionsAreInvalid(questions)) {
      setFormError(
        "Complete every question, answer choice, and correct answer."
      );

      return;
    }

    const courseInformation =
      temporaryCourses.find(
        (course) =>
          course.code ===
          quizForm.courseCode
      );

    const newQuiz = {
      id: Date.now(),
      title: quizForm.title.trim(),
      courseCode:
        quizForm.courseCode,
      courseName:
        courseInformation?.name || "",
      category:
        quizForm.category,
      questions,
      timeLimit: Number(
        quizForm.timeLimit
      ),
      attempts: 0,
      totalStudents: 0,
      status:
        quizForm.status,
    };

    setQuizzes((previousQuizzes) => [
      ...previousQuizzes,
      newQuiz,
    ]);

    setShowCreateModal(false);

    resetCreateQuiz();
  };

  const handleManageQuiz = (quiz) => {
    setSelectedQuiz({
      ...quiz,

      questions: quiz.questions.map(
        (question) => ({
          ...question,

          choices: question.choices.map(
            (choice) => ({
              ...choice,
            })
          ),
        })
      ),
    });

    setSelectedAttempt(null);
    setSaveMessage("");
    setManageError("");
    setShowManageModal(true);
  };

  const handleManageQuizChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,
        [name]: value,
      })
    );

    setSaveMessage("");
    setManageError("");
  };

  const handleManageQuestionChange = (
    questionId,
    field,
    value
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) =>
              question.id === questionId
                ? {
                    ...question,
                    [field]: value,
                  }
                : question
          ),
      })
    );

    setSaveMessage("");
    setManageError("");
  };

  const handleManageQuestionTypeChange = (
    questionId,
    newType
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) => {
              if (
                question.id !==
                questionId
              ) {
                return question;
              }

              if (
                newType ===
                "Short Answer"
              ) {
                return {
                  ...question,
                  type: newType,
                  choices: [],
                  shortAnswer: "",
                };
              }

              return {
                ...question,
                type: newType,
                shortAnswer: "",
                choices:
                  question.choices
                    .length >= 2
                    ? question.choices
                    : [
                        {
                          id:
                            Date.now() +
                            Math.random(),
                          text: "",
                          correct: true,
                        },
                        {
                          id:
                            Date.now() +
                            Math.random(),
                          text: "",
                          correct: false,
                        },
                      ],
              };
            }
          ),
      })
    );

    setSaveMessage("");
    setManageError("");
  };

  const handleManageChoiceText = (
    questionId,
    choiceId,
    value
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) => {
              if (
                question.id !==
                questionId
              ) {
                return question;
              }

              return {
                ...question,

                choices:
                  question.choices.map(
                    (choice) =>
                      choice.id ===
                      choiceId
                        ? {
                            ...choice,
                            text: value,
                          }
                        : choice
                  ),
              };
            }
          ),
      })
    );

    setSaveMessage("");
  };

  const handleManageCorrectChoice = (
    questionId,
    choiceId
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) => {
              if (
                question.id !==
                questionId
              ) {
                return question;
              }

              if (
                question.type ===
                "Multiple Choice"
              ) {
                return {
                  ...question,

                  choices:
                    question.choices.map(
                      (choice) => ({
                        ...choice,

                        correct:
                          choice.id ===
                          choiceId,
                      })
                    ),
                };
              }

              return {
                ...question,

                choices:
                  question.choices.map(
                    (choice) =>
                      choice.id ===
                      choiceId
                        ? {
                            ...choice,

                            correct:
                              !choice.correct,
                          }
                        : choice
                  ),
              };
            }
          ),
      })
    );

    setSaveMessage("");
  };

  const handleManageAddChoice = (
    questionId
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) =>
              question.id === questionId
                ? {
                    ...question,

                    choices: [
                      ...question.choices,

                      {
                        id:
                          Date.now() +
                          Math.random(),
                        text: "",
                        correct: false,
                      },
                    ],
                  }
                : question
          ),
      })
    );
  };

  const handleManageRemoveChoice = (
    questionId,
    choiceId
  ) => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.map(
            (question) => {
              if (
                question.id !==
                questionId
              ) {
                return question;
              }

              if (
                question.choices
                  .length <= 2
              ) {
                return question;
              }

              return {
                ...question,

                choices:
                  question.choices.filter(
                    (choice) =>
                      choice.id !==
                      choiceId
                  ),
              };
            }
          ),
      })
    );
  };

  const handleManageAddQuestion = () => {
    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions: [
          ...previousQuiz.questions,
          createEmptyQuestion(),
        ],
      })
    );

    setSaveMessage("");
  };

  const handleManageRemoveQuestion = (
    questionId
  ) => {
    if (
      selectedQuiz.questions.length ===
      1
    ) {
      return;
    }

    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.filter(
            (question) =>
              question.id !== questionId
          ),
      })
    );

    setSaveMessage("");
  };

  const handleSaveQuiz = () => {
    if (
      !selectedQuiz.title.trim() ||
      !selectedQuiz.courseCode ||
      !selectedQuiz.category ||
      !selectedQuiz.timeLimit
    ) {
      setManageError(
        "Please complete all required quiz fields."
      );

      return;
    }

    if (
      questionsAreInvalid(
        selectedQuiz.questions
      )
    ) {
      setManageError(
        "Complete every question, answer choice, and correct answer."
      );

      return;
    }

    const courseInformation =
      temporaryCourses.find(
        (course) =>
          course.code ===
          selectedQuiz.courseCode
      );

    const updatedQuiz = {
      ...selectedQuiz,

      courseName:
        courseInformation?.name || "",

      timeLimit: Number(
        selectedQuiz.timeLimit
      ),
    };

    setQuizzes((previousQuizzes) =>
      previousQuizzes.map((quiz) =>
        quiz.id === updatedQuiz.id
          ? updatedQuiz
          : quiz
      )
    );

    setSelectedQuiz(updatedQuiz);

    setManageError("");

    setSaveMessage(
      "Quiz changes saved temporarily."
    );
  };

  return (
    <div className="quizzes-layout">
      <InstructorSidebar />

      <main className="quizzes-main-content">
        <header className="quizzes-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>Quizzes</h1>

            <p>
              Create, publish, and manage
              quizzes for your courses.
            </p>
          </div>

          <button
            className="quizzes-primary-button"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            <Plus size={19} />
            Create Quiz
          </button>
        </header>

        <section className="quiz-stat-grid">
          <article className="quiz-stat-card">
            <div className="quiz-stat-icon total">
              <CircleHelp size={22} />
            </div>

            <div>
              <span>Total Quizzes</span>

              <strong>
                {quizzes.length}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon published">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Published</span>

              <strong>
                {publishedQuizzes}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon draft">
              <FileEdit size={22} />
            </div>

            <div>
              <span>Drafts</span>

              <strong>
                {draftQuizzes}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon attempts">
              <Users size={22} />
            </div>

            <div>
              <span>Total Attempts</span>

              <strong>
                {totalAttempts}
              </strong>
            </div>
          </article>
        </section>

        <section className="quiz-filter-section">
          <div className="quiz-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search quizzes or courses..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="quiz-filter-controls">
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

              <option value="Draft">
                Draft
              </option>

              <option value="Closed">
                Closed
              </option>
            </select>
          </div>
        </section>

        <section className="quiz-list-panel">
          <div className="quiz-list-heading">
            <div>
              <h2>All Quizzes</h2>

              <p>
                Showing{" "}
                {filteredQuizzes.length} of{" "}
                {quizzes.length} quizzes
              </p>
            </div>
          </div>

          {filteredQuizzes.length > 0 ? (
            <div className="quiz-table-wrapper">
              <table className="quiz-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Course</th>
                    <th>Questions</th>
                    <th>Time Limit</th>
                    <th>Attempts</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuizzes.map(
                    (quiz) => (
                      <tr key={quiz.id}>
                        <td>
                          <div className="quiz-name-cell">
                            <div className="quiz-file-icon">
                              <CircleHelp
                                size={19}
                              />
                            </div>

                            <div>
                              <strong>
                                {quiz.title}
                              </strong>

                              <span>
                                {quiz.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="quiz-course-cell">
                            <strong>
                              {
                                quiz.courseCode
                              }
                            </strong>

                            <span>
                              {
                                quiz.courseName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {
                            quiz.questions
                              .length
                          }
                        </td>

                        <td>
                          <div className="quiz-time-cell">
                            <Clock
                              size={17}
                            />

                            <span>
                              {
                                quiz.timeLimit
                              }{" "}
                              minutes
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="quiz-attempt-cell">
                            <span>
                              {quiz.attempts}/
                              {
                                quiz.totalStudents
                              }
                            </span>

                            <div className="quiz-progress">
                              <div
                                className="quiz-progress-fill"
                                style={{
                                  width:
                                    quiz.totalStudents >
                                    0
                                      ? `${
                                          (quiz.attempts /
                                            quiz.totalStudents) *
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
                            className={`quiz-status ${quiz.status.toLowerCase()}`}
                          >
                            {
                              quiz.status
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            className="quiz-action-button"
                            onClick={() =>
                              handleManageQuiz(
                                quiz
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
            <div className="empty-quiz-message">
              <CircleHelp size={36} />

              <h3>
                No quizzes found
              </h3>

              <p>
                Try changing your search or
                filter selections.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Create Quiz */}
      {showCreateModal && (
        <div className="quiz-modal-overlay">
          <section className="quiz-modal">
            <div className="quiz-modal-header">
              <div>
                <p className="page-label">
                  Quiz Builder
                </p>

                <h2>Create Quiz</h2>
              </div>

              <button
                className="quiz-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateQuiz();
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="quiz-builder-form"
              onSubmit={handleCreateQuiz}
            >
              <div className="quiz-form-group">
                <label>
                  Quiz Title *
                </label>

                <input
                  name="title"
                  value={quizForm.title}
                  placeholder="Enter quiz title"
                  onChange={
                    handleQuizFormChange
                  }
                />
              </div>

              <div className="quiz-form-grid">
                <div className="quiz-form-group">
                  <label>Course *</label>

                  <select
                    name="courseCode"
                    value={
                      quizForm.courseCode
                    }
                    onChange={
                      handleQuizFormChange
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

                <div className="quiz-form-group">
                  <label>
                    Grade Category *
                  </label>

                  <select
                    name="category"
                    value={
                      quizForm.category
                    }
                    onChange={
                      handleQuizFormChange
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

              <div className="quiz-form-grid">
                <div className="quiz-form-group">
                  <label>
                    Time Limit *
                  </label>

                  <input
                    name="timeLimit"
                    type="number"
                    min="1"
                    value={
                      quizForm.timeLimit
                    }
                    placeholder="30"
                    onChange={
                      handleQuizFormChange
                    }
                  />
                </div>

                <div className="quiz-form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={quizForm.status}
                    onChange={
                      handleQuizFormChange
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
              </div>

              <section className="quiz-question-section">
                <div className="quiz-question-header">
                  <div>
                    <h3>Questions</h3>

                    <p>
                      Create multiple-choice,
                      multiple-answer, or
                      short-answer questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="quiz-add-question-button"
                    onClick={
                      handleAddQuestion
                    }
                  >
                    <Plus size={17} />
                    Add Question
                  </button>
                </div>

                {questions.map(
                  (question, index) => (
                    <article
                      className="quiz-question-card"
                      key={question.id}
                    >
                      <div className="quiz-question-card-header">
                        <h4>
                          Question{" "}
                          {index + 1}
                        </h4>

                        <button
                          type="button"
                          className="quiz-remove-question"
                          disabled={
                            questions.length ===
                            1
                          }
                          onClick={() =>
                            handleRemoveQuestion(
                              question.id
                            )
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>

                      <div className="quiz-form-grid">
                        <div className="quiz-form-group">
                          <label>
                            Question Type
                          </label>

                          <select
                            value={
                              question.type
                            }
                            onChange={(
                              event
                            ) =>
                              changeQuestionType(
                                question.id,
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="Multiple Choice">
                              Multiple Choice
                            </option>

                            <option value="Multiple Answers">
                              Multiple Answers
                            </option>

                            <option value="Short Answer">
                              Short Answer
                            </option>
                          </select>
                        </div>

                        <div className="quiz-form-group">
                          <label>
                            Points
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              question.points
                            }
                            onChange={(
                              event
                            ) =>
                              updateQuestion(
                                question.id,
                                "points",
                                event.target
                                  .value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="quiz-form-group">
                        <label>
                          Question Text
                        </label>

                        <input
                          value={
                            question.text
                          }
                          placeholder="Enter question..."
                          onChange={(
                            event
                          ) =>
                            updateQuestion(
                              question.id,
                              "text",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      {question.type ===
                      "Short Answer" ? (
                        <div className="quiz-form-group">
                          <label>
                            Expected Answer
                          </label>

                          <input
                            value={
                              question.shortAnswer
                            }
                            placeholder="Enter expected answer..."
                            onChange={(
                              event
                            ) =>
                              updateQuestion(
                                question.id,
                                "shortAnswer",
                                event.target
                                  .value
                              )
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <div className="quiz-choice-list">
                            {question.choices.map(
                              (choice) => (
                                <div
                                  className="quiz-choice-edit-row"
                                  key={
                                    choice.id
                                  }
                                >
                                  <input
                                    type={
                                      question.type ===
                                      "Multiple Choice"
                                        ? "radio"
                                        : "checkbox"
                                    }
                                    name={`correct-${question.id}`}
                                    checked={
                                      choice.correct
                                    }
                                    onChange={() =>
                                      setChoiceCorrect(
                                        question.id,
                                        choice.id
                                      )
                                    }
                                  />

                                  <input
                                    type="text"
                                    value={
                                      choice.text
                                    }
                                    placeholder="Answer choice"
                                    onChange={(
                                      event
                                    ) =>
                                      updateChoiceText(
                                        question.id,
                                        choice.id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />

                                  <button
                                    type="button"
                                    className="quiz-remove-choice"
                                    disabled={
                                      question
                                        .choices
                                        .length <=
                                      2
                                    }
                                    onClick={() =>
                                      removeChoice(
                                        question.id,
                                        choice.id
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={16}
                                    />
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          <button
                            type="button"
                            className="quiz-add-choice-button"
                            onClick={() =>
                              addChoice(
                                question.id
                              )
                            }
                          >
                            <Plus size={16} />
                            Add Choice
                          </button>
                        </>
                      )}
                    </article>
                  )
                )}
              </section>

              {formError && (
                <div className="quiz-form-error">
                  {formError}
                </div>
              )}

              <div className="quiz-form-actions">
                <button
                  type="button"
                  className="quiz-cancel-button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateQuiz();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="quiz-save-button"
                >
                  <Plus size={17} />
                  Create Quiz
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Manage Quiz */}
      {showManageModal &&
        selectedQuiz && (
          <div className="quiz-modal-overlay">
            <section className="quiz-modal quiz-manage-modal">
              <div className="quiz-modal-header">
                <div>
                  <p className="page-label">
                    Quiz Management
                  </p>

                  <h2>
                    {selectedQuiz.title}
                  </h2>

                  <p>
                    {
                      selectedQuiz.courseCode
                    }{" "}
                    -{" "}
                    {
                      selectedQuiz.courseName
                    }
                  </p>
                </div>

                <button
                  className="quiz-modal-close"
                  onClick={() =>
                    setShowManageModal(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="quiz-manage-layout">
                <section className="quiz-manage-settings">
                  <h3>Quiz Details</h3>

                  <div className="quiz-form-group">
                    <label>
                      Quiz Title
                    </label>

                    <input
                      name="title"
                      value={
                        selectedQuiz.title
                      }
                      onChange={
                        handleManageQuizChange
                      }
                    />
                  </div>

                  <div className="quiz-form-grid">
                    <div className="quiz-form-group">
                      <label>
                        Course
                      </label>

                      <select
                        name="courseCode"
                        value={
                          selectedQuiz.courseCode
                        }
                        onChange={
                          handleManageQuizChange
                        }
                      >
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
                              {course.code}{" "}
                              -{" "}
                              {course.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="quiz-form-group">
                      <label>
                        Grade Category
                      </label>

                      <select
                        name="category"
                        value={
                          selectedQuiz.category
                        }
                        onChange={
                          handleManageQuizChange
                        }
                      >
                        {temporaryCategories.map(
                          (category) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {category}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="quiz-form-grid">
                    <div className="quiz-form-group">
                      <label>
                        Time Limit
                      </label>

                      <input
                        name="timeLimit"
                        type="number"
                        min="1"
                        value={
                          selectedQuiz.timeLimit
                        }
                        onChange={
                          handleManageQuizChange
                        }
                      />
                    </div>

                    <div className="quiz-form-group">
                      <label>Status</label>

                      <select
                        name="status"
                        value={
                          selectedQuiz.status
                        }
                        onChange={
                          handleManageQuizChange
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
                  </div>

                  <div className="quiz-manage-question-header">
                    <div>
                      <h3>
                        Quiz Questions
                      </h3>

                      <p>
                        Edit questions,
                        answers, and point
                        values.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="quiz-add-question-button"
                      onClick={
                        handleManageAddQuestion
                      }
                    >
                      <Plus size={17} />
                      Add Question
                    </button>
                  </div>

                  {selectedQuiz.questions.map(
                    (question, index) => (
                      <article
                        className="quiz-question-card"
                        key={question.id}
                      >
                        <div className="quiz-question-card-header">
                          <h4>
                            Question{" "}
                            {index + 1}
                          </h4>

                          <button
                            type="button"
                            className="quiz-remove-question"
                            disabled={
                              selectedQuiz
                                .questions
                                .length === 1
                            }
                            onClick={() =>
                              handleManageRemoveQuestion(
                                question.id
                              )
                            }
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>

                        <div className="quiz-form-grid">
                          <div className="quiz-form-group">
                            <label>
                              Question Type
                            </label>

                            <select
                              value={
                                question.type
                              }
                              onChange={(
                                event
                              ) =>
                                handleManageQuestionTypeChange(
                                  question.id,
                                  event.target
                                    .value
                                )
                              }
                            >
                              <option value="Multiple Choice">
                                Multiple
                                Choice
                              </option>

                              <option value="Multiple Answers">
                                Multiple
                                Answers
                              </option>

                              <option value="Short Answer">
                                Short Answer
                              </option>
                            </select>
                          </div>

                          <div className="quiz-form-group">
                            <label>
                              Points
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={
                                question.points
                              }
                              onChange={(
                                event
                              ) =>
                                handleManageQuestionChange(
                                  question.id,
                                  "points",
                                  event.target
                                    .value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="quiz-form-group">
                          <label>
                            Question Text
                          </label>

                          <input
                            value={
                              question.text
                            }
                            onChange={(
                              event
                            ) =>
                              handleManageQuestionChange(
                                question.id,
                                "text",
                                event.target
                                  .value
                              )
                            }
                          />
                        </div>

                        {question.type ===
                        "Short Answer" ? (
                          <div className="quiz-form-group">
                            <label>
                              Expected Answer
                            </label>

                            <input
                              value={
                                question.shortAnswer
                              }
                              onChange={(
                                event
                              ) =>
                                handleManageQuestionChange(
                                  question.id,
                                  "shortAnswer",
                                  event.target
                                    .value
                                )
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <div className="quiz-choice-list">
                              {question.choices.map(
                                (choice) => (
                                  <div
                                    className="quiz-choice-edit-row"
                                    key={
                                      choice.id
                                    }
                                  >
                                    <input
                                      type={
                                        question.type ===
                                        "Multiple Choice"
                                          ? "radio"
                                          : "checkbox"
                                      }
                                      name={`manage-correct-${question.id}`}
                                      checked={
                                        choice.correct
                                      }
                                      onChange={() =>
                                        handleManageCorrectChoice(
                                          question.id,
                                          choice.id
                                        )
                                      }
                                    />

                                    <input
                                      type="text"
                                      value={
                                        choice.text
                                      }
                                      placeholder="Answer choice"
                                      onChange={(
                                        event
                                      ) =>
                                        handleManageChoiceText(
                                          question.id,
                                          choice.id,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                    />

                                    <button
                                      type="button"
                                      className="quiz-remove-choice"
                                      disabled={
                                        question
                                          .choices
                                          .length <=
                                        2
                                      }
                                      onClick={() =>
                                        handleManageRemoveChoice(
                                          question.id,
                                          choice.id
                                        )
                                      }
                                    >
                                      <Trash2
                                        size={
                                          16
                                        }
                                      />
                                    </button>
                                  </div>
                                )
                              )}
                            </div>

                            <button
                              type="button"
                              className="quiz-add-choice-button"
                              onClick={() =>
                                handleManageAddChoice(
                                  question.id
                                )
                              }
                            >
                              <Plus
                                size={16}
                              />
                              Add Choice
                            </button>
                          </>
                        )}
                      </article>
                    )
                  )}

                  {manageError && (
                    <div className="quiz-form-error">
                      {manageError}
                    </div>
                  )}

                  {saveMessage && (
                    <div className="quiz-save-message">
                      {saveMessage}
                    </div>
                  )}

                  <button
                    className="quiz-save-button"
                    onClick={
                      handleSaveQuiz
                    }
                  >
                    <Save size={17} />
                    Save Quiz Changes
                  </button>
                </section>

                <section className="quiz-attempt-panel">
                  <div className="quiz-attempt-panel-header">
                    <div>
                      <h3>
                        Student Attempts
                      </h3>

                      <p>
                        Review completed quiz
                        attempts.
                      </p>
                    </div>

                    <Users size={21} />
                  </div>

                  <div className="quiz-attempt-list">
                    {temporaryAttempts.map(
                      (attempt) => (
                        <button
                          key={attempt.id}
                          className={
                            selectedAttempt?.id ===
                            attempt.id
                              ? "quiz-attempt-item active"
                              : "quiz-attempt-item"
                          }
                          onClick={() =>
                            setSelectedAttempt(
                              attempt
                            )
                          }
                        >
                          <div>
                            <strong>
                              {
                                attempt.studentName
                              }
                            </strong>

                            <span>
                              {
                                attempt.studentId
                              }
                            </span>
                          </div>

                          <strong>
                            {attempt.score}%
                          </strong>
                        </button>
                      )
                    )}
                  </div>

                  {selectedAttempt ? (
                    <div className="quiz-attempt-details">
                      <div className="quiz-attempt-details-header">
                        <div>
                          <h4>
                            {
                              selectedAttempt.studentName
                            }
                          </h4>

                          <p>
                            Submitted{" "}
                            {
                              selectedAttempt.submittedAt
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          className="quiz-view-attempt-button"
                        >
                          <Eye size={16} />
                          View Attempt
                        </button>
                      </div>

                      <div className="quiz-attempt-score">
                        <span>
                          Score
                        </span>

                        <strong>
                          {
                            selectedAttempt.score
                          }
                          %
                        </strong>
                      </div>

                      <div className="quiz-attempt-score">
                        <span>
                          Status
                        </span>

                        <strong>
                          {
                            selectedAttempt.status
                          }
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="quiz-select-attempt">
                      <Users size={30} />

                      <p>
                        Select a student
                        attempt to view the
                        result.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorQuizzes;