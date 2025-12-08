import React from "react";
import App from "./App.jsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";
import ReactDOM from "react-dom/client";
import { env } from "./config/env";

// Validate environment variables in development
if (import.meta.env.DEV) {
  try {
    // Only validate if env module is imported successfully
    if (env.API_URL && env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID) {
      console.log("✅ Environment variables loaded successfully");
    }
  } catch (error) {
    console.warn("⚠️ Environment validation warning:", error);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={env.AUTH0_DOMAIN}
      clientId={env.AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
