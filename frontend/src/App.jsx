import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import AssignmentsPage from "./pages/AssignmentsPage";
import CreateAssignmentPage from "./pages/CreateAssignmentPage";
import AssignmentDetailsPage from "./pages/AssignmentDetailsPage";
import GroupsPage from "./pages/GroupsPage";
import LibraryPage from "./pages/LibraryPage";
import ToolkitPage from "./pages/ToolkitPage";
import SettingsPage from "./pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/assignments" replace /> },
      { path: "assignments", element: <AssignmentsPage /> },
      { path: "assignments/:id", element: <AssignmentDetailsPage /> },
      { path: "assignments/create", element: <CreateAssignmentPage /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "toolkit", element: <ToolkitPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default router;
