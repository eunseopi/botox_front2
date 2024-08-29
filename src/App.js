import React from 'react';
import BoardPage from './pages/postpage/BoardPage.js'
import LoginPage from './pages/loginpage/LoginPage.js'
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import MainPage from './pages/mainpage/MainPage.js'
import SignUpPage from './pages/loginpage/SignUpPage.js'
import WritePage from './pages/postpage/WritePage.js'
import PostDetailPage from './pages/postpage/PostDetailPage.js'
import RoomPage from './pages/roompage/RoomPage.js'
import Room from './pages/roompage/Room.js'

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
            <Route path="/rooms" element={<RoomPage />} />
            <Route path="/rooms/:roomNum" element={<Room />} />
        </Routes>
    </Router>
  );
}

export default App;
