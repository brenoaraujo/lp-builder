
import React from "react";
import ReactDOM from "react-dom/client";
import { BuilderOverridesProvider } from "./context/BuilderOverridesContext.jsx";
import { AppRouterShell } from "./App.jsx"; 
import './index.css'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BuilderOverridesProvider>
      <AppRouterShell />
    </BuilderOverridesProvider>
  </React.StrictMode>
);