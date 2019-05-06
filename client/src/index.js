import React from 'react';
import ReactDOM from 'react-dom';
import App from './js/components/container/App.jsx';

const wrapper = document.getElementById('root');
wrapper ? ReactDOM.render(<App />, wrapper) : false;