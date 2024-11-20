import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Home } from './pages/Home';
import { Statistics } from './pages/Statistics';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
      <BrowserRouter>
        <MantineProvider
          theme={theme}
          defaultColorScheme="dark"
        >
          <Notifications position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </MantineProvider>
      </BrowserRouter>
      );
}

      export default App;
