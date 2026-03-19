import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./App";
import { AssignmentsProvider } from "./context/AssignmentsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AssignmentsProvider>
      <RouterProvider router={router} />
    </AssignmentsProvider>
  </React.StrictMode>
);
