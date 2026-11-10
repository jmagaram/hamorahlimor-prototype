import { useDb } from './model/store';
import { useStack, type Route } from './nav/nav';
import { PageEntryContext } from './nav/pageState';
import { routeHeading, routeHeadingExtras } from './nav/titles';
import { Badge } from './ui/Badge';
import { Assign, ChooseExercise } from './pages/Assign';
import { AnswerFeedback, OverallFeedback } from './pages/AnswerFeedback';
import { Assignment, Assignments } from './pages/Assignments';
import { Material, QuestionEditor } from './pages/Editors';
import { Exercise, Exercises } from './pages/Exercises';
import { Home } from './pages/Home';
import { Student, Students } from './pages/Students';
import { DrawerProvider } from './ui/Drawer';
import { Header } from './ui/Header';

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'home': return <Home />;
    case 'students': return <Students />;
    case 'student': return <Student id={route.id} />;
    case 'exercises': return <Exercises />;
    case 'exercise': return <Exercise id={route.id} />;
    case 'material': return <Material id={route.id} />;
    case 'question': return <QuestionEditor exerciseId={route.exerciseId} questionId={route.questionId} />;
    case 'assign': return <Assign exerciseId={route.exerciseId} studentId={route.studentId} />;
    case 'chooseExercise': return <ChooseExercise />;
    case 'assignments': return <Assignments />;
    case 'assignment': return <Assignment id={route.id} />;
    case 'overallFeedback': return <OverallFeedback assignmentId={route.assignmentId} />;
    case 'answerFeedback': return <AnswerFeedback assignmentId={route.assignmentId} questionId={route.questionId} />;
  }
}

export default function App() {
  const stack = useStack();
  const db = useDb();
  const top = stack[stack.length - 1];
  const extras = routeHeadingExtras(db, top.route);
  return (
    <DrawerProvider>
      <Header />
      {/* key: a different page (or the same page with other params) starts with fresh state */}
      <main>
        {extras.kicker && <p className="kicker">{extras.kicker}</p>}
        <h2>{routeHeading(db, top.route)}{extras.badges?.map(b => <span key={b.label}> <Badge color={b.color}>{b.label}</Badge></span>)}</h2>
        <PageEntryContext.Provider value={top}>
          <Page key={top.key} route={top.route} />
        </PageEntryContext.Provider>
      </main>
    </DrawerProvider>
  );
}
