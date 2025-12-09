import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Editor } from './components/Editor';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'editor'>('landing');

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onStart={() => setView('editor')} />
      ) : (
        <Editor onBack={() => setView('landing')} />
      )}
    </>
  );
};

export default App;