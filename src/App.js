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
import Room from "./pages/roompage/Room";
import VoiceChatRoom from "./pages/roompage/voicechat/Socket";

function App() {
  return (
    <Router>
        <Routes>
            {/*<Route path="/" element={<MainPage />} />*/}
            <Route path="/board" element={<BoardPage />}/>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/signup" element={<SignUpPage />}/>
            <Route path="/write" element={<WritePage />}/>
            <Route path="/post/:id" element={<PostDetailPage/>}/>
            <Route path="/room/:game" element={<RoomPage/>}/>
            <Route path="/rooms/:roomNum" element={<Room />} />
            {/*test 용 VoiceChatRoom endpoint 생성*/}
            <Route path="/" element={<VoiceChatRoom />} />
        </Routes>
    </Router>
  );
}

export default App;
