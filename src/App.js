import React from 'react';
import BoardPage from './pages/BoardPage';
import LoginPage from './pages/LoginPage';
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import MainPage from "./pages/MainPage";

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/board" element={<BoardPage />}/>
            <Route path="/login" element={<LoginPage />}/>
        </Routes>
    </Router>
  );
}

export default App;
