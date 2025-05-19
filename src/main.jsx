import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { HashRouter } from 'react-router-dom';
import App from './App';

// Corrigir URLs inválidas que misturam pathname + hash
const pathname = window.location.pathname;
const hash = window.location.hash;

if (!pathname.endsWith('/') && hash.startsWith('#/')) {
  const novaUrl = `${window.location.origin}/#${pathname}${hash.slice(1)}`;
  window.location.replace(novaUrl);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ChakraProvider>
  </React.StrictMode>
);
