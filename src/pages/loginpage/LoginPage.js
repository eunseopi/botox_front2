import React from 'react';
import { useNavigate } from "react-router-dom";
import BotoxImage from '../../images/white.png';
import menuImage from "../../images/menu.png";

const LoginPage = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await fetch('https://botox-chat.site/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password,
                }),
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);

                // 여기서 accessToken을 올바르게 추출합니다.
                if (data.data && data.data.accessToken) {
                    localStorage.setItem('token', data.data.accessToken);
                    console.log('Token saved to localStorage:', data.data.accessToken);
                    navigate('/main');
                } else {
                    console.log('로그인에 실패했습니다. 토큰이 제공되지 않았습니다.');
                    alert('로그인에 실패했습니다. 토큰이 제공되지 않았습니다.');
                }
            } else if (response.status === 403) {
                console.log('로그인에 실패했습니다. 접근이 거부되었습니다.');
                alert('로그인에 실패했습니다. 접근이 거부되었습니다.');
            } else {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    console.log('로그인에 실패했습니다.', errorData);
                    alert(`로그인에 실패했습니다. ${errorData.message}`);
                } catch (e) {
                    console.log('로그인에 실패했습니다. 응답 본문:', errorText);
                    alert(`로그인에 실패했습니다. 응답 본문: ${errorText}`);
                }
            }
        } catch (error) {
            console.error('로그인 중 에러 발생:', error);
            alert('로그인 중 에러가 발생했습니다.');
        }
    };

    const handleSignUp = () => {
        navigate('/signup');
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
                <button
                    onClick={handleLogin}
                    className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400 transition duration-300">
                    로그인
                </button>
                <p className="mt-4 text-center">
                    계정이 없으시다면?{' '}
                    <a href="#" className="text-blue-500 font-bold hover:underline" onClick={handleSignUp}>
                        회원가입
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
