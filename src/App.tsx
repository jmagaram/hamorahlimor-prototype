import { useStack, type Route } from './nav/nav';
import { AssignToStudent, AssignToStudents } from './pages/Assign';
import { Assignment, Assignments } from './pages/Assignments';
import { Classes } from './pages/Classes';
import { Material, QuestionEditor } from './pages/Editors';
import { Exercise, Exercises } from './pages/Exercises';
import { Home } from './pages/Home';
import { Review } from './pages/Review';
import { Student, Students } from './pages/Students';
import { DrawerProvider } from './ui/Drawer';
import { Header } from './ui/Header';

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'home': return <Home />;
    case 'classes': return <Classes />;
    case 'students': return <Students />;
    case 'student': return <Student id={route.id} />;
    case 'exercises': return <Exercises />;
    case 'exercise': return <Exercise id={route.id} />;
    case 'material': return <Material id={route.id} />;
    case 'question': return <QuestionEditor exerciseId={route.exerciseId} questionId={route.questionId} />;
    case 'assignToStudents': return <AssignToStudents exerciseId={route.exerciseId} />;
    case 'assignToStudent': return <AssignToStudent studentId={route.studentId} />;
    case 'assignments': return <Assignments />;
    case 'assignment': return <Assignment id={route.id} />;
    case 'review': return <Review id={route.id} />;
  }
}

export default function App() {
  const stack = useStack();
  const top = stack[stack.length - 1];
  return (
    <DrawerProvider>
      <Header />
      {/* key: a different page (or the same page with other params) starts with fresh state */}
      <main><Page key={top.key} route={top.route} /></main>
    </DrawerProvider>
  );
}
