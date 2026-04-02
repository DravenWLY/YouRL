import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { StatsPage } from '@/pages/StatsPage';
import { RecentPage } from '@/pages/RecentPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/recent" element={<RecentPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;