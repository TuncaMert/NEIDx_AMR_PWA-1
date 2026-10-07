import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import App from './App';
import OfflineStatus from './components/OfflineStatus';

ReactDOM.render(
  <BrowserRouter><OfflineStatus /><App updateAvailable={false} /></BrowserRouter>,
  document.getElementById('root')
);
