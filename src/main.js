import './style.css';
import { greeting } from './greeting.js';

document.querySelector('#app').innerHTML = `
  <h1>Alimichu</h1>
  <p>${greeting(new Date())}</p>
`;
