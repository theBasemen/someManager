import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import LinkedInPostGenerator from "./components/LinkedInPostGenerator";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {/* Fix the routing issue by using Routes properly */}
        <Routes>
          <Route path="/" element={<LinkedInPostGenerator />} />
          {/* Add this before any catch-all routes */}
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" element={null} />
          )}
        </Routes>
        {/* Keep the useRoutes for Tempo */}
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
