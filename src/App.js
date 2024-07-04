import React from 'react';
import BoardPage from './pages/BoardPage';
import LoginPage from './pages/LoginPage';
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import MainPage from "./pages/MainPage";
import SignUpPage from "./pages/SignUpPage";
import WritePage from "./pages/WritePage";
import PostDetailPage from "./pages/PostDetailPage";

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/board" element={<BoardPage />}/>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/signup" element={<SignUpPage />}/>
            <Route path="/write" element={<WritePage />}/>
            <Route path="/post/:id" element={<PostDetailPage/>}/>
        </Routes>
    </Router>
  );
}

export default App;
