import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";

const Chat = (function () {
    const myName = "blue";
    function init() {
        document.addEventListener('keydown', function (e) {
            if (e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                const message = document.querySelector('div.input-div textarea').value;
                sendMessage(message);
                focusTextarea();
            }
        });
    }

    function createMessageTag(LR_className, senderName, message) {
        let chatLi = document.querySelector('div.chat.format ul li').cloneNode(true);
        chatLi.classList.add(LR_className);
        chatLi.querySelector('.sender span').textContent = senderName;
        chatLi.querySelector('.message span').textContent = message;
        return chatLi;
    }

    function appendMessageTag(LR_className, senderName, message) {
        const chatLi = createMessageTag(LR_className, senderName, message);
        document.querySelector('div.chat:not(.format) ul').appendChild(chatLi);
        document.querySelector('div.chat').scrollTop = document.querySelector('div.chat').scrollHeight;
    }

    function sendMessage(message) {
        if (message.trim() !== "") { // 빈 문자열이 아닌 경우에만 메시지를 전송
            const data = {
                "senderName": "은섭",
                "message": message
            };
            appendMessageTag("right", data.senderName, data.message);
            clearTextarea(); // 메시지를 보낸 후에 입력 칸 비우기
            simulateResponse(); // 상대방의 응답 시뮬레이션
        }
    }

    function clearTextarea() {
        document.querySelector('div.input-div textarea').value = '';
    }

    function focusTextarea() {
        document.querySelector('div.input-div textarea').focus();
    }

    function getRandomResponse() {
        const responses = [
            "네, 알겠습니다.",
            "고마워요!",
            "그렇군요!",
            "무슨 말인지 잘 몰라요.",
            "저도 그렇게 생각해요.",
            "정말로요?",
            "그래요?",
            "네, 알겠어요.",
            "와우!",
            "멋져요!"
        ];

        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }

    function simulateResponse() {
        const senderName = "모르는 사람"; // 대답할 상대방의 이름
        const message = getRandomResponse();
        appendMessageTag("left", senderName, message); // left는 상대방, right는 본인의 메시지를 의미하는 클래스명입니다.
    }

    return {
        init: init,
        sendMessage : sendMessage
    };
})();

const TextChat = () => {
    const [messages, setMessages] = useState([]);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        Chat.init();
    }, []);

    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (chatContainer.scrollHeight > chatContainer.clientHeight) {
            chatContainer.style.overflowY = 'scroll';
        } else {
            chatContainer.style.overflowY = 'hidden';
        }
    }, [messages]);

    const handleSendMessage = () => {
        const message = textareaRef.current.value;
        if (message.trim() !== "") {
            Chat.sendMessage(message);
            textareaRef.current.value = ""; // 입력칸 클리어
        }
    };

    const handleExit = () => {
        navigate("/RoomList");
    };

    const handleReport = () => {
        // 신고하기 버튼 클릭 시 동작할 코드 작성
    };

    const navigate = useNavigate();
    return (
        <div className="bg-gray-900 text-white rounded-2xl p-4">
            <div className="text-center text-xl font-bold mb-4">협곡 인원 구합니다. (3/5)</div>
            <div className="overflow-y-auto h-96" ref={chatContainerRef}>
                <ul className="space-y-4">
                    {messages.map((msg, index) => (
                        <li key={index} className={`flex ${msg.isMyMessage ? "justify-end" : "justify-start"}`}>
                            <div className="bg-white text-black p-2 rounded-lg">
                                <div className="font-bold">{msg.senderName}</div>
                                <div>{msg.message}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex justify-between mt-4">
                <div className="flex-1">
                    <textarea ref={textareaRef} placeholder="채팅을 입력해주세요." className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"></textarea>
                </div>
                <div className="flex items-center ml-4">
                    <button onClick={handleSendMessage} className="bg-blue-500 text-white py-2 px-4 rounded-lg">전송</button>
                </div>
            </div>
            <div className="flex justify-between mt-4">
                <button className="bg-red-500 text-white py-2 px-4 rounded-lg" onClick={handleExit}>나가기</button>
                <button className="bg-yellow-500 text-white py-2 px-4 rounded-lg" onClick={handleReport}>신고하기</button>
            </div>
        </div>
    );
}

export default TextChat;
