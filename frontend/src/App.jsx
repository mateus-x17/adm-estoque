import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          {/* Outras páginas podem ser adicionadas aqui */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

