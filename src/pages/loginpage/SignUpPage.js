import React from 'react';
import { useNavigate } from "react-router-dom";
import BotoxImage from '../../images/white.png';
import menuImage from "../../images/menu.png";

const SignUpPage = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [nickName, setNickName] = React.useState('');
    const navigate = useNavigate();

    const handleSignUp = async () => {
        try {
            if (password !== confirmPassword) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }

            const response = await fetch('http://localhost:8080/api/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password1: password,
                    password2: confirmPassword,
                    userNickName: nickName
                })
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('username', email);
                console.log('Signup success:', data);
                navigate('/login');
            } else {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    console.log('Signup failed:', errorData);
                    alert(`Signup failed: ${errorData.message}`);
                } catch (e) {
                    console.log('Signup failed. Response body:', errorText);
                    alert(`Signup failed. Response body: ${errorText}`);
                }
            }
        } catch (error) {
            console.log('회원가입 중 에러 발생:', error);
            alert('회원가입 중 에러가 발생하였습니다.');
        }
    }

    return (
        <div className="bg-customMainBg flex flex-col items-center justify-center">
            <div className="w-full bg-customTopNav h-10 mb-60">
                <nav className="flex items-center px-4">
                    <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2" />
                </nav>
            </div>
            <div className="bg-customLoginBg p-8 rounded-lg shadow-2xl w-1/3 h-1/2">
                <h1 className="text-3xl font-bold mb-6 flex items-center justify-center">
                    <img src={BotoxImage} alt="Botox" className="w-8 h-8 mr-3" />
                    B o t o x
                </h1>
                <h3 className="text-customDarkBlue text-sm mb-2">이메일 또는 아이디</h3>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value) }}
                    className="w-full p-2 mb-4 border-0 rounded"
                />
                <h3 className="text-customDarkBlue text-sm mb-2">비밀번호</h3>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value) }}
                    className="w-full p-2 mb-6 border-0 rounded"
                />
                <h3 className="text-customDarkBlue text-sm mb-2">비밀번호 확인</h3>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value) }}
                    className={`w-full p-2 mb-6 border rounded ${password !== confirmPassword && confirmPassword !== '' ? 'border-red-500' : ''}`}
                />
                <h3 className="text-customDarkBlue text-sm mb-2">닉네임</h3>
                <input
                    type="text"
                    value={nickName}
                    onChange={(e) => { setNickName(e.target.value) }}
                    className="w-full p-2 mb-4 border-0 rounded"
                />
                <button
                    onClick={handleSignUp}
                    className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400 transition duration-300">
                    회원가입
                </button>
            </div>
        </div>
    );
};

export default SignUpPage;
