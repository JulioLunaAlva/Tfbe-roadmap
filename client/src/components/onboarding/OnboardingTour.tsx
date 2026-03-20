import { useEffect, useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';

interface OnboardingTourProps {
  steps: Step[];
  tourKey: string; // e.g. 'dashboardTourCompleted'
  runTour?: boolean; // force run or auto-run based on localStorage
}

export const OnboardingTour = ({ steps, tourKey, runTour }: OnboardingTourProps) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // If runTour is explicitly provided, it overrides localStorage
    if (runTour !== undefined) {
      setRun(runTour);
      return;
    }

    // Auto-run if not seen before
    const hasSeenTour = localStorage.getItem(tourKey);
    if (!hasSeenTour) {
      // Small delay to ensure all elements (e.g. charts/tables) are mounted
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tourKey, runTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(tourKey, 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5', // Tailwind indigo-600
          textColor: '#333',
          backgroundColor: '#fff',
        },
        buttonClose: {
          display: 'none',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.5',
        }
      }}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Omitir'
      }}
    />
  );
};
