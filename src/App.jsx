import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Models from "./pages/Models";
import ModelPage from "./pages/ModelPage";
import Watch from "./pages/Watch";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onlyf" element={<Models />} />
        <Route path="/model/:slug" element={<ModelPage />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
