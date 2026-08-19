import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  getCurrentUser,
} from "../../backend/authServices.js";

import {
  getCoursesForInstructor,
} from "../../backend/courseServices.js";

import {
  createQuiz,
  createQuizQuestion,
  deleteQuizQuestion,
  getQuizAttempts,
  getQuizQuestions,
  getQuizzesForCourse,
  updateQuiz,
  updateQuizQuestion,
} from "../../backend/quizServices.js";

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

const temporaryCategories = [
  "Quizzes",
  "Assignments",
  "Projects",
  "Midterm",
  "Final Exam",
];

function getResponseData(result) {
  return result?.data ?? result;
}

function getCoursesFromResult(result) {
  const data = getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.courses)) {
    return data.courses;
  }

  return [];
}

function getQuizzesFromResult(result) {
  const data = getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.quizzes)) {
    return data.quizzes;
  }

  return [];
}


function getQuizQuestionsFromResult(result) {
  const data = getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.questions)) {
    return data.questions;
  }

  if (Array.isArray(data?.quiz_questions)) {
    return data.quiz_questions;
  }

  return [];
}

function getQuizAttemptsFromResult(result) {
  const data = getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.attempts)) {
    return data.attempts;
  }

  if (Array.isArray(data?.quiz_attempts)) {
    return data.quiz_attempts;
  }

  return [];
}

function normalizeAttempt(attempt, index) {
  const studentID =
    attempt.student_id ??
    attempt.studentId ??
    attempt.user_id ??
    attempt.userId ??
    "";

  return {
    ...attempt,

    id:
      attempt.id ??
      attempt.attempt_id ??
      `attempt-${index}`,

    studentId:
      String(studentID),

    studentName:
      attempt.student_name ??
      attempt.studentName ??
      attempt.name ??
      (studentID
        ? `Student ${studentID}`
        : "Student"),

    score:
      Number(
        attempt.score ??
        attempt.grade ??
        0
      ),

    submittedAt:
      attempt.submitted_at ??
      attempt.submittedAt ??
      attempt.attempt_date ??
      attempt.date_taken ??
      attempt.created_at ??
      "Not provided",

    status:
      attempt.status ??
      "Completed",
  };
}

function normalizeCourse(course, index) {
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

    students:
      Number(
        course.students ??
          course.student_count ??
          course.total_students ??
          course.seats_taken ??
          0
      ),
  };
}

function normalizeQuestion(
  question,
  index
) {
  const correctAnswer =
    question.shortAnswer ??
    question.correct_answer ??
    "";

  const hasStoredChoices =
    Array.isArray(question.choices) &&
    question.choices.length > 0;

  return {
    ...question,

    id:
      question.id ??
      question.question_id ??
      `question-${index}`,

    backendQuestionId:
      question.question_id ??
      question.backendQuestionId ??
      null,

    type:
      question.type ??
      question.question_type ??
      "Short Answer",

    text:
      question.text ??
      question.question_text ??
      "",

    points:
      Number(
        question.points ??
          question.score ??
          10
      ),

    choices:
      hasStoredChoices
        ? question.choices
        : [],

    shortAnswer:
      correctAnswer,
  };
}

function normalizeQuiz(
  quiz,
  course
) {
  const backendQuestions =
    Array.isArray(quiz.questions)
      ? quiz.questions.map(
          (question, index) =>
            normalizeQuestion(
              question,
              index
            )
        )
      : [];

  return {
    ...quiz,

    id:
      quiz.id ??
      quiz.quiz_id,

    title:
      quiz.title ??
      "Untitled Quiz",

    courseId:
      course.id,

    courseCode:
      course.code,

    courseName:
      course.name,

    category:
      quiz.category ??
      "Quizzes",

    dueDate:
      quiz.dueDate ??
      quiz.due_date ??
      "",

    questions:
      backendQuestions,

    questionCount:
      Number(
        quiz.question_count ??
          quiz.questions_count ??
          backendQuestions.length
      ),

    /*
     * These fields are still UI-level
     * unless the backend happens to
     * include them.
     */
    timeLimit:
      Number(
        quiz.timeLimit ??
          quiz.time_limit ??
          0
      ),

    attempts:
      Number(
        quiz.attempts ??
          quiz.attempt_count ??
          0
      ),

    totalStudents:
      Number(
        course.students ?? 0
      ),

    status:
      quiz.status ??
      "Published",
  };
}

function getCorrectAnswer(question) {
  if (
    question.type ===
    "Short Answer"
  ) {
    return question.shortAnswer.trim();
  }

  const correctChoices =
    question.choices
      .filter(
        (choice) => choice.correct
      )
      .map((choice) =>
        choice.text.trim()
      );

  /*
   * The current quiz-question service
   * only accepts one correct_answer field.
   *
   * Multiple-answer questions are stored
   * as one text value separated by " | ".
   */
  return correctChoices.join(" | ");
}

function getCreatedQuizId(result) {
  const data = getResponseData(result);

  return (
    data?.quiz_id ??
    data?.id ??
    data?.quiz?.quiz_id ??
    data?.quiz?.id ??
    null
  );
}

function InstructorQuizzes() {
  const [quizzes, setQuizzes] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [
    instructorID,
    setInstructorID,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

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
    showManageModal,
    setShowManageModal,
  ] = useState(false);

  const [
    selectedQuiz,
    setSelectedQuiz,
  ] = useState(null);

  const [
    selectedAttempt,
    setSelectedAttempt,
  ] = useState(null);

  const [
    quizAttempts,
    setQuizAttempts,
  ] = useState([]);

  const [
    deletedQuestionIds,
    setDeletedQuestionIds,
  ] = useState([]);

  const [
    isManaging,
    setIsManaging,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    manageError,
    setManageError,
  ] = useState("");

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [quizForm, setQuizForm] =
    useState({
      title: "",
      courseId: "",
      category: "",
      dueDate: "",
      timeLimit: "",
      status: "Draft",
    });

  const [questions, setQuestions] =
    useState([
      createEmptyQuestion(),
    ]);

  /*
   * Load the instructor's real courses,
   * then load quizzes for each course.
   */
  useEffect(() => {
    async function loadQuizPage() {
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

      const quizRequests =
        normalizedCourses.map(
          async (course) => {
            if (!course.id) {
              return [];
            }

            const quizResult =
              await getQuizzesForCourse(
                course.id
              );

            if (!quizResult.success) {
              return [];
            }

            const backendQuizzes =
              getQuizzesFromResult(
                quizResult
              );

            return backendQuizzes.map(
              (quiz) =>
                normalizeQuiz(
                  quiz,
                  course
                )
            );
          }
        );

      const quizGroups =
        await Promise.all(
          quizRequests
        );

      setQuizzes(
        quizGroups.flat()
      );

      setIsLoading(false);
    }

    loadQuizPage();
  }, []);

  const reloadQuizzesForCourse =
    async (course) => {
      if (!course?.id) {
        return;
      }

      const result =
        await getQuizzesForCourse(
          course.id
        );

      if (!result.success) {
        setPageError(
          result.error ||
            "Unable to refresh quizzes."
        );

        return;
      }

      const backendQuizzes =
        getQuizzesFromResult(result);

      const normalizedQuizzes =
        backendQuizzes.map(
          (quiz) =>
            normalizeQuiz(
              quiz,
              course
            )
        );

      setQuizzes(
        (previousQuizzes) => [
          ...previousQuizzes.filter(
            (quiz) =>
              String(quiz.courseId) !==
              String(course.id)
          ),

          ...normalizedQuizzes,
        ]
      );
    };

  const courseOptions =
    useMemo(() => {
      return [
        "All Courses",

        ...new Set(
          quizzes.map(
            (quiz) =>
              quiz.courseCode
          )
        ),
      ];
    }, [quizzes]);

  const filteredQuizzes =
    useMemo(() => {
      return quizzes.filter(
        (quiz) => {
          const normalizedSearch =
            searchTerm
              .toLowerCase()
              .trim();

          const matchesSearch =
            quiz.title
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            quiz.courseCode
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            quiz.courseName
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesCourse =
            selectedCourse ===
              "All Courses" ||
            quiz.courseCode ===
              selectedCourse;

          const matchesStatus =
            selectedStatus ===
              "All Statuses" ||
            quiz.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesCourse &&
            matchesStatus
          );
        }
      );
    }, [
      quizzes,
      searchTerm,
      selectedCourse,
      selectedStatus,
    ]);

  const publishedQuizzes =
    quizzes.filter(
      (quiz) =>
        quiz.status === "Published"
    ).length;

  const draftQuizzes =
    quizzes.filter(
      (quiz) =>
        quiz.status === "Draft"
    ).length;

  const totalAttempts =
    quizzes.reduce(
      (total, quiz) =>
        total +
        Number(quiz.attempts || 0),
      0
    );

  const handleQuizFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setQuizForm(
      (previousForm) => ({
        ...previousForm,

        [name]: value,
      })
    );

    setFormError("");
  };

  const updateQuestion = (
    questionId,
    field,
    value
  ) => {
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question) =>
            question.id ===
            questionId
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
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
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

                        correct:
                          true,
                      },

                      {
                        id:
                          Date.now() +
                          Math.random(),

                        text: "",

                        correct:
                          false,
                      },
                    ],
            };
          }
        )
    );

    setFormError("");
  };

  const addChoice = (
    questionId
  ) => {
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question) =>
            question.id ===
            questionId
              ? {
                  ...question,

                  choices: [
                    ...question.choices,

                    {
                      id:
                        Date.now() +
                        Math.random(),

                      text: "",

                      correct:
                        false,
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
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
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
        )
    );
  };

  const updateChoiceText = (
    questionId,
    choiceId,
    value
  ) => {
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question) =>
            question.id ===
            questionId
              ? {
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
                }
              : question
        )
    );
  };

  const setChoiceCorrect = (
    questionId,
    choiceId
  ) => {
    setQuestions(
      (previousQuestions) =>
        previousQuestions.map(
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
        )
    );
  };

  const handleAddQuestion =
    () => {
      setQuestions(
        (previousQuestions) => [
          ...previousQuestions,

          createEmptyQuestion(),
        ]
      );
    };

  const handleRemoveQuestion = (
    questionId
  ) => {
    if (questions.length === 1) {
      return;
    }

    setQuestions(
      (previousQuestions) =>
        previousQuestions.filter(
          (question) =>
            question.id !==
            questionId
        )
    );
  };

  const resetCreateQuiz = () => {
    setQuizForm({
      title: "",
      courseId: "",
      category: "",
      dueDate: "",
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
          Number(
            question.points
          ) <= 0
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
          question.choices.length <
          2
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
            (choice) =>
              choice.correct
          )
        ) {
          return true;
        }

        return false;
      }
    );
  };

  /*
   * Create the quiz through quizServices,
   * then create the quiz's questions.
   */
  const handleCreateQuiz =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        !quizForm.title.trim() ||
        !quizForm.courseId ||
        !quizForm.category ||
        !quizForm.dueDate
      ) {
        setFormError(
          "Please complete all required quiz fields."
        );

        return;
      }

      if (
        questionsAreInvalid(
          questions
        )
      ) {
        setFormError(
          "Complete every question, answer choice, and correct answer."
        );

        return;
      }

      const courseInformation =
        courses.find(
          (course) =>
            String(course.id) ===
            String(
              quizForm.courseId
            )
        );

      if (!courseInformation) {
        setFormError(
          "Please select a valid course."
        );

        return;
      }

      setIsCreating(true);

      const formattedDueDate =
        `${quizForm.dueDate} 23:59:59`;

      const quizResult =
        await createQuiz(
          Number(
            quizForm.courseId
          ),
          quizForm.title.trim(),
          formattedDueDate
        );

      if (!quizResult.success) {
        setIsCreating(false);

        setFormError(
          quizResult.error ||
            "Unable to create quiz."
        );

        return;
      }

      const createdQuizID =
        getCreatedQuizId(
          quizResult
        );

      /*
       * createQuizQuestion() requires
       * the new quiz ID.
       */
      if (createdQuizID) {
        for (
          const question of questions
        ) {
          const correctAnswer =
            getCorrectAnswer(
              question
            );

          const questionResult =
            await createQuizQuestion(
              Number(
                createdQuizID
              ),
              question.text.trim(),
              correctAnswer,
              Number(
                question.points
              )
            );

          if (
            !questionResult.success
          ) {
            setIsCreating(
              false
            );

            setFormError(
              questionResult.error ||
                "The quiz was created, but one or more questions could not be saved."
            );

            await reloadQuizzesForCourse(
              courseInformation
            );

            return;
          }
        }
      } else {
        /*
         * If the endpoint created the quiz
         * but did not return its ID, we
         * cannot safely attach questions.
         */
        setIsCreating(false);

        await reloadQuizzesForCourse(
          courseInformation
        );

        setFormError(
          "The quiz was created, but the backend response did not include a quiz ID, so its questions could not be attached."
        );

        return;
      }

      await reloadQuizzesForCourse(
        courseInformation
      );

      setIsCreating(false);

      setShowCreateModal(
        false
      );

      resetCreateQuiz();
    };

  const handleManageQuiz =
    async (quiz) => {
      setSelectedAttempt(null);
      setQuizAttempts([]);
      setDeletedQuestionIds([]);
      setSaveMessage("");
      setManageError("");
      setIsManaging(true);

      const questionResult =
        await getQuizQuestions(
          quiz.id
        );

      const attemptResult =
        await getQuizAttempts(
          quiz.id
        );

      const backendQuestions =
        questionResult.success
          ? getQuizQuestionsFromResult(
              questionResult
            )
          : [];

      const backendAttempts =
        attemptResult.success
          ? getQuizAttemptsFromResult(
              attemptResult
            )
          : [];

      const normalizedQuestions =
        backendQuestions.map(
          (question, index) =>
            normalizeQuestion(
              question,
              index
            )
        );

      const normalizedAttempts =
        backendAttempts.map(
          (attempt, index) =>
            normalizeAttempt(
              attempt,
              index
            )
        );

      setSelectedQuiz({
        ...quiz,

        questions:
          normalizedQuestions,
      });

      setQuizAttempts(
        normalizedAttempts
      );

      if (!questionResult.success) {
        setManageError(
          questionResult.error ||
            "Unable to load quiz questions."
        );
      } else if (!attemptResult.success) {
        setManageError(
          attemptResult.error ||
            "Unable to load quiz attempts."
        );
      }

      setIsManaging(false);
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
              question.id ===
              questionId
                ? {
                    ...question,

                    [field]:
                      value,
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

                  shortAnswer:
                    "",
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

                          correct:
                            true,
                        },

                        {
                          id:
                            Date.now() +
                            Math.random(),

                          text: "",

                          correct:
                            false,
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
              question.id ===
              questionId
                ? {
                    ...question,

                    choices: [
                      ...question.choices,

                      {
                        id:
                          Date.now() +
                          Math.random(),

                        text: "",

                        correct:
                          false,
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

  const handleManageAddQuestion =
    () => {
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
      selectedQuiz.questions
        .length === 1
    ) {
      return;
    }

    const questionToRemove =
      selectedQuiz.questions.find(
        (question) =>
          question.id ===
          questionId
      );

    if (
      questionToRemove?.backendQuestionId
    ) {
      setDeletedQuestionIds(
        (previousIds) => [
          ...previousIds,
          questionToRemove.backendQuestionId,
        ]
      );
    }

    setSelectedQuiz(
      (previousQuiz) => ({
        ...previousQuiz,

        questions:
          previousQuiz.questions.filter(
            (question) =>
              question.id !==
              questionId
          ),
      })
    );

    setSaveMessage("");
  };

  /*
   * Save quiz details and question changes
   * through the backend quiz services.
   */
  const handleSaveQuiz =
    async () => {
      if (
        !selectedQuiz.title.trim() ||
        !selectedQuiz.courseId
      ) {
        setManageError(
          "Please complete all required quiz fields."
        );

        return;
      }

      if (
        selectedQuiz.questions
          .length > 0 &&
        questionsAreInvalid(
          selectedQuiz.questions
        )
      ) {
        setManageError(
          "Complete every question, answer choice, and correct answer."
        );

        return;
      }

      setIsManaging(true);
      setManageError("");
      setSaveMessage("");

      const formattedDueDate =
        selectedQuiz.dueDate
          ? selectedQuiz.dueDate.includes(
              ":"
            )
            ? selectedQuiz.dueDate
            : `${selectedQuiz.dueDate} 23:59:59`
          : null;

      const quizResult =
        await updateQuiz(
          selectedQuiz.id,
          {
            title:
              selectedQuiz.title.trim(),

            course_id:
              Number(
                selectedQuiz.courseId
              ),

            due_date:
              formattedDueDate,
          }
        );

      if (!quizResult.success) {
        setIsManaging(false);

        setManageError(
          quizResult.error ||
            "Unable to update the quiz."
        );

        return;
      }

      for (
        const questionId of
        deletedQuestionIds
      ) {
        const deleteResult =
          await deleteQuizQuestion(
            questionId
          );

        if (!deleteResult.success) {
          setIsManaging(false);

          setManageError(
            deleteResult.error ||
              "The quiz was updated, but a deleted question could not be removed."
          );

          return;
        }
      }

      for (
        const question of
        selectedQuiz.questions
      ) {
        const correctAnswer =
          getCorrectAnswer(
            question
          );

        let questionResult;

        if (
          question.backendQuestionId
        ) {
          questionResult =
            await updateQuizQuestion(
              question.backendQuestionId,
              {
                question_text:
                  question.text.trim(),

                correct_answer:
                  correctAnswer,

                score:
                  Number(
                    question.points
                  ),
              }
            );
        } else {
          questionResult =
            await createQuizQuestion(
              Number(
                selectedQuiz.id
              ),
              question.text.trim(),
              correctAnswer,
              Number(
                question.points
              )
            );
        }

        if (!questionResult.success) {
          setIsManaging(false);

          setManageError(
            questionResult.error ||
              "The quiz was updated, but one or more questions could not be saved."
          );

          return;
        }
      }

      const courseInformation =
        courses.find(
          (course) =>
            String(course.id) ===
            String(
              selectedQuiz.courseId
            )
        );

      if (courseInformation) {
        await reloadQuizzesForCourse(
          courseInformation
        );
      }

      const refreshedQuestions =
        await getQuizQuestions(
          selectedQuiz.id
        );

      if (
        refreshedQuestions.success
      ) {
        const questionList =
          getQuizQuestionsFromResult(
            refreshedQuestions
          );

        setSelectedQuiz(
          (previousQuiz) => ({
            ...previousQuiz,

            questions:
              questionList.map(
                (question, index) =>
                  normalizeQuestion(
                    question,
                    index
                  )
              ),
          })
        );
      }

      setDeletedQuestionIds([]);
      setIsManaging(false);

      setSaveMessage(
        "Quiz changes saved successfully."
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
              Create, publish, and
              manage quizzes for your
              courses.
            </p>
          </div>

          <button
            className="quizzes-primary-button"
            onClick={() =>
              setShowCreateModal(
                true
              )
            }
          >
            <Plus size={19} />
            Create Quiz
          </button>
        </header>

        {pageError && (
          <div
            style={{
              margin: "20px 0",
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

        <section className="quiz-stat-grid">
          <article className="quiz-stat-card">
            <div className="quiz-stat-icon total">
              <CircleHelp
                size={22}
              />
            </div>

            <div>
              <span>
                Total Quizzes
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : quizzes.length}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon published">
              <CheckCircle2
                size={22}
              />
            </div>

            <div>
              <span>
                Published
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : publishedQuizzes}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon draft">
              <FileEdit
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
                  : draftQuizzes}
              </strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon attempts">
              <Users size={22} />
            </div>

            <div>
              <span>
                Total Attempts
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : totalAttempts}
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
              value={
                selectedCourse
              }
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
              value={
                selectedStatus
              }
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
              <h2>
                All Quizzes
              </h2>

              <p>
                {isLoading
                  ? "Loading quizzes..."
                  : `Showing ${filteredQuizzes.length} of ${quizzes.length} quizzes`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-quiz-message">
              <CircleHelp
                size={36}
              />

              <h3>
                Loading quizzes...
              </h3>

              <p>
                Retrieving quizzes from
                your courses.
              </p>
            </div>
          ) : filteredQuizzes.length >
            0 ? (
            <div className="quiz-table-wrapper">
              <table className="quiz-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Course</th>
                    <th>Questions</th>
                    <th>Due Date</th>
                    <th>Attempts</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuizzes.map(
                    (quiz) => (
                      <tr
                        key={
                          quiz.id
                        }
                      >
                        <td>
                          <div className="quiz-name-cell">
                            <div className="quiz-file-icon">
                              <CircleHelp
                                size={
                                  19
                                }
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  quiz.title
                                }
                              </strong>

                              <span>
                                {
                                  quiz.category
                                }
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
                            quiz.questionCount ??
                            quiz.questions
                              .length
                          }
                        </td>

                        <td>
                          <div className="quiz-time-cell">
                            <Clock
                              size={
                                17
                              }
                            />

                            <span>
                              {quiz.dueDate ||
                                "Not set"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="quiz-attempt-cell">
                            <span>
                              {
                                quiz.attempts
                              }
                              /
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
                            className={`quiz-status ${quiz.status
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
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
              <CircleHelp
                size={36}
              />

              <h3>
                No quizzes found
              </h3>

              <p>
                Try changing your search
                or filter selections.
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

                <h2>
                  Create Quiz
                </h2>
              </div>

              <button
                className="quiz-modal-close"
                onClick={() => {
                  setShowCreateModal(
                    false
                  );

                  resetCreateQuiz();
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="quiz-builder-form"
              onSubmit={
                handleCreateQuiz
              }
            >
              <div className="quiz-form-group">
                <label>
                  Quiz Title *
                </label>

                <input
                  name="title"
                  value={
                    quizForm.title
                  }
                  placeholder="Enter quiz title"
                  onChange={
                    handleQuizFormChange
                  }
                />
              </div>

              <div className="quiz-form-grid">
                <div className="quiz-form-group">
                  <label>
                    Course *
                  </label>

                  <select
                    name="courseId"
                    value={
                      quizForm.courseId
                    }
                    onChange={
                      handleQuizFormChange
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
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="quiz-form-grid">
                <div className="quiz-form-group">
                  <label>
                    Due Date *
                  </label>

                  <input
                    name="dueDate"
                    type="date"
                    value={
                      quizForm.dueDate
                    }
                    onChange={
                      handleQuizFormChange
                    }
                  />
                </div>

                <div className="quiz-form-group">
                  <label>
                    Time Limit
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
                    Time limit is
                    currently UI-only.
                  </p>
                </div>
              </div>

              <div className="quiz-form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={
                    quizForm.status
                  }
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
                  Status is
                  currently UI-only.
                </p>
              </div>

              <section className="quiz-question-section">
                <div className="quiz-question-header">
                  <div>
                    <h3>
                      Questions
                    </h3>

                    <p>
                      Create
                      multiple-choice,
                      multiple-answer,
                      or short-answer
                      questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="quiz-add-question-button"
                    onClick={
                      handleAddQuestion
                    }
                  >
                    <Plus
                      size={17}
                    />

                    Add Question
                  </button>
                </div>

                {questions.map(
                  (
                    question,
                    index
                  ) => (
                    <article
                      className="quiz-question-card"
                      key={
                        question.id
                      }
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
                            size={
                              17
                            }
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
                                event
                                  .target
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
                              Short
                              Answer
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
                                event
                                  .target
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
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      {question.type ===
                      "Short Answer" ? (
                        <div className="quiz-form-group">
                          <label>
                            Expected
                            Answer
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
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <div className="quiz-choice-list">
                            {question.choices.map(
                              (
                                choice
                              ) => (
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
                              addChoice(
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
              </section>

              <p
                style={{
                  margin:
                    "12px 0",
                  fontSize:
                    "12px",
                  color:
                    "#64748b",
                }}
              >
                The current
                quiz-question service
                stores question text,
                correct answer and point
                value. Question type and
                individual answer-choice
                records are not separate
                service parameters.
              </p>

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
                    setShowCreateModal(
                      false
                    );

                    resetCreateQuiz();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="quiz-save-button"
                  disabled={
                    isCreating
                  }
                >
                  <Plus
                    size={17}
                  />

                  {isCreating
                    ? "Creating..."
                    : "Create Quiz"}
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
                    {
                      selectedQuiz.title
                    }
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
                    setShowManageModal(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="quiz-manage-layout">
                <section className="quiz-manage-settings">
                  <h3>
                    Quiz Details
                  </h3>

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
                        name="courseId"
                        value={
                          selectedQuiz.courseId
                        }
                        onChange={
                          handleManageQuizChange
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
                          (
                            category
                          ) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {
                                category
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="quiz-form-grid">
                    <div className="quiz-form-group">
                      <label>
                        Due Date
                      </label>

                      <input
                        name="dueDate"
                        type="date"
                        value={
                          selectedQuiz.dueDate ||
                          ""
                        }
                        onChange={
                          handleManageQuizChange
                        }
                      />
                    </div>

                    <div className="quiz-form-group">
                      <label>
                        Status
                      </label>

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
                      <Plus
                        size={17}
                      />

                      Add Question
                    </button>
                  </div>

                  {selectedQuiz.questions
                    .length > 0 ? (
                    selectedQuiz.questions.map(
                      (
                        question,
                        index
                      ) => (
                        <article
                          className="quiz-question-card"
                          key={
                            question.id
                          }
                        >
                          <div className="quiz-question-card-header">
                            <h4>
                              Question{" "}
                              {index +
                                1}
                            </h4>

                            <button
                              type="button"
                              className="quiz-remove-question"
                              disabled={
                                selectedQuiz
                                  .questions
                                  .length ===
                                1
                              }
                              onClick={() =>
                                handleManageRemoveQuestion(
                                  question.id
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

                          <div className="quiz-form-grid">
                            <div className="quiz-form-group">
                              <label>
                                Question
                                Type
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
                                    event
                                      .target
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
                                  Short
                                  Answer
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
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="quiz-form-group">
                            <label>
                              Question
                              Text
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
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          {question.type ===
                          "Short Answer" ? (
                            <div className="quiz-form-group">
                              <label>
                                Expected
                                Answer
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
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="quiz-choice-list">
                                {question.choices.map(
                                  (
                                    choice
                                  ) => (
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
                                  size={
                                    16
                                  }
                                />

                                Add
                                Choice
                              </button>
                            </>
                          )}
                        </article>
                      )
                    )
                  ) : (
                    <div className="quiz-select-attempt">
                      <CircleHelp
                        size={30}
                      />

                      <p>
                        No questions are
                        currently stored for
                        this quiz. Use Add
                        Question to create
                        one.
                      </p>
                    </div>
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
                    disabled={
                      isManaging
                    }
                  >
                    <Save
                      size={17}
                    />

                    {isManaging
                      ? "Saving..."
                      : "Save Quiz Changes"}
                  </button>

                  <p
                    style={{
                      margin:
                        "10px 0 0",
                      fontSize:
                        "12px",
                      color:
                        "#64748b",
                    }}
                  >
                    Quiz details and
                    questions are saved
                    through the connected
                    backend quiz services.
                  </p>
                </section>

                {/* Real quiz attempts from backend */}
                <section className="quiz-attempt-panel">
                  <div className="quiz-attempt-panel-header">
                    <div>
                      <h3>
                        Student Attempts
                      </h3>

                      <p>
                        Review completed
                        quiz attempts.
                      </p>
                    </div>

                    <Users
                      size={21}
                    />
                  </div>

                  <div className="quiz-attempt-list">
                    {quizAttempts.map(
                      (
                        attempt
                      ) => (
                        <button
                          key={
                            attempt.id
                          }
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
                            {
                              attempt.score
                            }
                            %
                          </strong>
                        </button>
                      )
                    )}
                  </div>

                  {quizAttempts.length ===
                    0 && (
                    <div className="quiz-select-attempt">
                      <Users size={30} />

                      <p>
                        No quiz attempts
                        found for this quiz.
                      </p>
                    </div>
                  )}

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
                          <Eye
                            size={
                              16
                            }
                          />

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
                      <Users
                        size={30}
                      />

                      <p>
                        Select a student
                        attempt to view
                        the result.
                      </p>
                    </div>
                  )}

                  <p
                    style={{
                      margin:
                        "12px 0 0",
                      fontSize:
                        "12px",
                      color:
                        "#64748b",
                    }}
                  >
                    Attempts shown here
                    are loaded from the
                    selected quiz through
                    the backend service.
                  </p>
                </section>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorQuizzes;