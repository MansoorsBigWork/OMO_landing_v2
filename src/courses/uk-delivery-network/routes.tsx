import { Navigate, Outlet, Route, Routes } from "react-router";
import CourseNav from "./nav/CourseNav";
import { ukDeliveryNetwork as course } from "./course";
import Welcome from "../welcome/Welcome";
import Interlude from "../ai-interlude/Interlude";
import Overview from "./overview/Overview";
import Intro from "./intro/Intro";
import Pathfinding from "./pathfinding/Pathfinding";
import Build from "./build/Build";
import { resumePath } from "./resume";

/* Everything under /portal/omoships/uk-delivery-network. The course shell
   mounts this once with a trailing splat route; paths below are relative
   to that mount. The course sections sidebar wraps every page of the
   course, including the shared welcome and interlude stages. */

/* "Continue" from the dashboard lands here and is sent on to where the student left off */
function Resume() {
  return <Navigate to={resumePath()} replace />;
}

function CourseLayout() {
  return (
    <>
      <CourseNav />
      <Outlet />
    </>
  );
}

export default function UkDeliveryNetworkRoutes() {
  return (
    <Routes>
      <Route element={<CourseLayout />}>
        <Route index element={<Overview />} />
        <Route path="continue" element={<Resume />} />
        <Route path="welcome" element={<Welcome omoship={course} />} />
        <Route path="intro" element={<Intro />} />
        <Route path="week-1/pathfinding" element={<Pathfinding />} />
        <Route path="week-1/interlude" element={<Interlude omoship={course} />} />
        <Route path="week-1/build" element={<Build />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
