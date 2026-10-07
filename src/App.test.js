import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/Classify', () => () => <div>Classification interface</div>);

test('renders the application inside its required router', () => {
  const container = document.createElement('div');
  ReactDOM.render(<MemoryRouter><App updateAvailable={false} /></MemoryRouter>, container);
  expect(container.textContent).toContain('Classification interface');
  ReactDOM.unmountComponentAtNode(container);
});
