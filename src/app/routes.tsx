import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AppLayout } from '../components/layout/AppLayout';

import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { TestWizardPage } from '../pages/NewTest/TestWizardPage';
import { RLConfigPage } from '../pages/RLConfiguration/RLConfigPage';
import { CVUVerificationPage } from '../pages/CVUVerification/CVUVerificationPage';
import { CalibrationPage } from '../pages/Calibration/CalibrationPage';
import { MCBTestingPage } from '../pages/MCBTesting/MCBTestingPage';
import { WaveformMonitoringPage } from '../pages/WaveformMonitoring/WaveformMonitoringPage';
import { TestResultsPage } from '../pages/TestResults/TestResultsPage';
import { WaveformAnalysisPage } from '../pages/WaveformAnalysis/WaveformAnalysisPage';
import { TestReportPage } from '../pages/TestReport/TestReportPage';
import { TestHistoryPage } from '../pages/TestHistory/TestHistoryPage';
import { TestRecipesPage } from '../pages/TestRecipes/TestRecipesPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

import { ProtectedRoute } from './ProtectedRoute';

export const routes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          
          // Test Wizard with step routes
          { path: '/new-test', element: <TestWizardPage /> },
          { path: '/new-test/rl-configuration', element: <TestWizardPage /> },
          { path: '/new-test/cvu-verification', element: <TestWizardPage /> },
          { path: '/new-test/calibration', element: <TestWizardPage /> },
          { path: '/new-test/testing', element: <TestWizardPage /> },
          { path: '/new-test/results', element: <TestResultsPage /> },

          // Direct standalone laboratory console pages
          { path: '/rl-configuration', element: <RLConfigPage /> },
          { path: '/cvu-verification', element: <CVUVerificationPage /> },
          { path: '/calibration', element: <CalibrationPage /> },
          { path: '/mcb-testing', element: <MCBTestingPage /> },
          { path: '/waveform-monitoring', element: <WaveformMonitoringPage /> },
          { path: '/test-results', element: <TestResultsPage /> },
          { path: '/waveform-analysis', element: <WaveformAnalysisPage /> },
          { path: '/reports', element: <TestReportPage /> },
          { path: '/test-history', element: <TestHistoryPage /> },
          { path: '/test-recipes', element: <TestRecipesPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
];
