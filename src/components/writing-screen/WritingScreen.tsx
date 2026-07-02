import { History } from 'lucide-preact';
import { WritingProvider, useWritingContext } from './WritingProvider';
import { WritingSetup } from './WritingSetup';
import { WritingAssignmentView } from './WritingAssignmentView';
import { WritingResult } from './WritingResult';
import { WritingHistory } from './WritingHistory';
import { Button } from '../commons';
import { useHeaderCenter, useBackOverride, useLanguage } from '../../hooks';

function WritingScreenInner() {
  const { phase, setDrawerOpen, goToSetup, closeViewing } = useWritingContext();
  const { t } = useLanguage();

  useBackOverride(() => {
    if (phase === 'viewing') {
      closeViewing();
      return true;
    }
    if (phase !== 'setup') {
      goToSetup();
      return true;
    }
    return false;
  }, [phase, goToSetup, closeViewing]);

  useHeaderCenter(
    <div class="flex items-center justify-between w-full">
      <Button variant="ghost" color="default" size="icon" icon={History} onClick={() => setDrawerOpen(true)} />
      <span class="text-sm font-medium text-text-primary truncate flex-1 min-w-0 text-center">{t.writing.title}</span>
      <span class="w-9" />
    </div>,
    [t.writing.title, setDrawerOpen],
  );

  return (
    <div class="flex flex-col mx-auto w-full max-w-md" style="height: 100%">
      <WritingHistory />
      {phase === 'setup' && <WritingSetup />}
      {(phase === 'assignment' || phase === 'reviewing') && <WritingAssignmentView />}
      {(phase === 'result' || phase === 'viewing') && <WritingResult />}
    </div>
  );
}

export function WritingScreen() {
  return (
    <WritingProvider>
      <WritingScreenInner />
    </WritingProvider>
  );
}
