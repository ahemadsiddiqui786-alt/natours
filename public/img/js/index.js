/* eslint-disable */
import { login } from './login';

const form = document.querySelector('.form');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        console.log('login');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    })
}