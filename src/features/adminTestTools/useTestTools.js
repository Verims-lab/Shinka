import { useEffect, useRef, useState } from 'react';
import { adminTestRequest } from '@/services/internal/adminTestTools';

export function useTestTools(request = adminTestRequest) {
  const [input, setInput] = useState('');
  const [value, setValue] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [job, setJob] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0), inFlight = useRef(false);
  useEffect(() => () => { generation.current++; }, []);
  function changeInput(next) {
    generation.current++; inFlight.current = false;
    setInput(next); setValue(null); setPreview(null); setConfirmation(''); setJob(null); setPendingId(null); setError(null); setBusy(false);
  }
  async function run(action, payload, accept) {
    if (inFlight.current) return;
    const version = generation.current;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const result = await request(action, payload);
      if (version === generation.current) accept(result);
    } catch (e) { if (version === generation.current) setError(e.code || 'TEST_TOOLS_FAILED'); }
    finally { if (version === generation.current) { inFlight.current = false; setBusy(false); } }
  }
  const lookup = () => {
    setValue(null); setPreview(null); setConfirmation(''); setJob(null); setPendingId(null);
    return run('lookup', { target_id: input.trim() }, result => { setValue(result); setJob(result.job || null); });
  };
  const inspect = operation => {
    if (!value?.target || busy) return;
    setPreview(null); setConfirmation('');
    return run('preview', { target_id: value.target.id, operation }, result => { setPreview(result); setJob(result.active_operation || null); });
  };
  function cancel() { generation.current++; inFlight.current = false; setPreview(null); setConfirmation(''); setBusy(false); setError(null); }
  function execute() {
    if (inFlight.current || !preview?.enabled || confirmation !== preview.target.id || Date.parse(preview.expires_at) <= Date.now()) return;
    const id = pendingId || crypto.randomUUID(); setPendingId(id);
    return run('execute', { target_id: preview.target.id, operation: preview.operation, confirmation, preview_token: preview.preview_token, request_id: id }, result => { setJob(result.job); setPreview(null); setConfirmation(''); });
  }
  const status = () => run('status', { target_id: input.trim(), operation_id: job?.operation_id || pendingId }, result => { setJob(result.job); setValue(previous => ({ ...previous, ...result })); });
  const resume = () => run('resume', { target_id: input.trim(), operation_id: job?.operation_id || pendingId }, result => setJob(result.job));
  return { input, value, preview, confirmation, job, pendingId, error, busy, changeInput, setConfirmation, lookup, inspect, cancel, execute, status, resume };
}
