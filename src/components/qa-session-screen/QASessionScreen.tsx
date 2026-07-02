import { useCallback, useState } from 'preact/hooks';
import { History, MessageCirclePlus, Pin } from 'lucide-preact';
import { QASessionProvider, useQASessionContext } from './QASessionProvider';
import { QASessionHistory } from './QASessionHistory';
import { QAMessages } from './QAMessages';
import { QAInput } from './QAInput';
import { QAPinCard } from './QAPinCard';
import { Modal, Button } from '../commons';
import { ProviderModelSelect } from '../ai-shared';
import { useHeaderCenter, useLanguage } from '../../hooks';

function QASettingsFields() {
  const { selectedProviderId, setSelectedProviderId, selectedModel, setSelectedModel } = useQASessionContext();

  return (
    <ProviderModelSelect
      selectedProviderId={selectedProviderId}
      selectedModel={selectedModel}
      onProviderChange={setSelectedProviderId}
      onModelChange={setSelectedModel}
    />
  );
}

function QAPinsView() {
  const { t } = useLanguage();
  const { newSession, pins, removePin } = useQASessionContext();

  return (
    <div class="relative flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto py-4">
        {pins.length === 0 ? (
          <div class="flex flex-col items-center justify-center text-center gap-2 py-16 px-4">
            <p class="text-sm text-text-secondary max-w-xs">{t.qa.emptyPinned}</p>
          </div>
        ) : (
          <div class="flex flex-col gap-3 items-center">
            {pins.map(pin => (
              <div key={pin.id} class="w-[85%] max-w-sm mx-auto">
                <QAPinCard pin={pin} onDelete={removePin} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="solid"
        color="primary"
        size="icon"
        icon={MessageCirclePlus}
        onClick={newSession}
        aria-label={t.qa.newQuestion}
        class="absolute bottom-4 right-4 rounded-full w-14 h-14 shadow-(--shadow-lg) z-10"
      />
    </div>
  );
}

function QAChatView() {
  const { activeSession } = useQASessionContext();
  const { t } = useLanguage();

  return (
    <>
      {activeSession ? <QAMessages /> : (
        <div class="flex flex-col items-center justify-center flex-1 gap-6 px-6">
          <div class="text-center">
            <h2 class="text-lg font-semibold text-text-primary m-0 mb-1">{t.qa.title}</h2>
            <p class="text-sm text-text-secondary m-0">{t.qa.subtitle}</p>
          </div>
          <div class="w-full max-w-xs">
            <QASettingsFields />
          </div>
        </div>
      )}
      <QAInput />
    </>
  );
}

function QASessionScreenInner() {
  const { activeSession, viewMode, pinsLoaded, selectedProviderId, providerList, setDrawerOpen, newSession, goToPins } = useQASessionContext();
  const { t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const providerLabel = providerList.find(p => p.type === selectedProviderId)?.label ?? '';
  const headerTitle = viewMode === 'chat'
    ? (activeSession?.messages[0]?.content.slice(0, 30) || t.qa.newQuestion)
    : t.qa.title;

  useHeaderCenter(
    <div class="flex items-center justify-between w-full">
      <Button variant="ghost" color="default" size="icon" icon={History} onClick={() => setDrawerOpen(true)} />
      {viewMode === 'chat' ? (
        <Button variant="ghost" color="default" onClick={openSettings} class="flex-1 min-w-0 max-w-[60%]">
          <span class="text-sm font-medium text-text-primary truncate">{headerTitle}</span>
          {providerLabel && (
            <span class="text-xs text-text-muted shrink-0">· {providerLabel}</span>
          )}
        </Button>
      ) : (
        <span class="text-sm font-medium text-text-primary truncate flex-1 min-w-0 text-center">{headerTitle}</span>
      )}
      {viewMode === 'chat'
        ? <Button variant="ghost" color="default" size="icon" icon={Pin} onClick={goToPins} aria-label={t.qa.title} />
        : <span class="w-9" />}
    </div>,
    [activeSession?.id, activeSession?.messages[0]?.content, viewMode, selectedProviderId, providerLabel, openSettings, newSession, goToPins, setDrawerOpen],
  );

  return (
    <div class="flex flex-col" style="height: 100%">
      <QASessionHistory />
      {viewMode === 'pins' && !pinsLoaded ? null : (viewMode === 'pins' ? <QAPinsView /> : <QAChatView />)}
      {settingsOpen && (
        <Modal onClose={() => setSettingsOpen(false)} maxWidth="sm">
          <Modal.Header title={t.chat.settings} onClose={() => setSettingsOpen(false)} />
          <Modal.Body>
            <QASettingsFields />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}

export function QASessionScreen() {
  return (
    <QASessionProvider>
      <QASessionScreenInner />
    </QASessionProvider>
  );
}
