import React from 'react';
import BoardPage from './pages/postpage/BoardPage';
import LoginPage from './pages/loginpage/LoginPage';
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import MainPage from "./pages/mainpage/MainPage";
import SignUpPage from "./pages/loginpage/SignUpPage";
import WritePage from "./pages/postpage/WritePage";
import PostDetailPage from "./pages/postpage/PostDetailPage";
import RoomPage from "./pages/roompage/RoomPage";
import VoiceChat from "./pages/roompage/voicechat/VoiceChat";
import TextChat from "./pages/roompage/textchat/TextChat";

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
            <Route path="/room" element={<RoomPage/>}/>
            <Route path='/voicechat/:id' element={<VoiceChat/>}/>
            <Route path='/textchat/:id' element={<TextChat/>}/>
        </Routes>
    </Router>
  );
}

export default App;
