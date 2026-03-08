
import React, {useState} from 'react';
import { Box, Typography, Card } from '@mui/material';
import { Link, Route, Routes } from 'react-router-dom'
export default function LoginPanel({setLogin}){
    
    function userLogin(formData){
        const userName = formData.get('userName')
    }

    const handleLogin = () => {
        let redirect_uri = 'agelmkoaekkmemnioakhdfenimaipjaa.chromiumapp.org'
        fetch(`https://ufldev.instructure.com/login/oauth2/auth?client_id=180240000000000199&response_type=code&redirect_uri=https://agelmkoaekkmemnioakhdfenimaipjaa.chromiumapp.org`)
        .then((response) => response.text())
        .then(json => console.log(json))
    }

    
    return(
        <div className="flex flex-col items-center justify-center border-2 border-gray-400 rounded-xl mt-20">
            <img 
            src={chrome.runtime.getURL("CompassLogoPlain.png")}
            alt="Compass Logo" 
            style={{ 
                width: '60px',
                height: '60px', 
                objectFit: 'contain'
            }} 
            />

            <div className="mb-10">Welcome!</div>
            <div className="mb-10">Click The Button Below To Login </div>

            <button onClick={handleLogin}>Login</button>
        </div>
    )
}