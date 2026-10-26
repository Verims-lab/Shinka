import { useEffect, useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaInput from '@/components/shinka/ShinkaInput';
import BirthplaceCombobox from '@/features/profile/BirthplaceCombobox';
import { FieldError } from '@/features/onboarding/OnboardingForms';
import { youCopy } from '@/foundation/i18n/youCopy';
export default function ProfileEditor({ state, language, placeRequest }) {
  const { controller, draft, value, busy, error } = state, copy = key => youCopy(key, language);
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, []);
  const disabled = busy || !!error?.unknown;
  return <form noValidate className="space-y-5" onSubmit={event => { event.preventDefault(); void controller.saveProfile(); }} data-you-profile-form>
    {['display_name','birth_date','birth_time'].map((name, index) => <div key={name} className="space-y-2">
      <label htmlFor={name}>{copy(name)}</label>
      <ShinkaInput ref={index === 0 ? first : undefined} id={name} type={index === 0 ? 'text' : index === 1 ? 'date' : 'time'} value={draft[name]} required={index === 1} max={index === 1 ? value.today : undefined} disabled={disabled}
        aria-invalid={error?.field === name} aria-describedby={error?.field === name ? `${name}-error` : undefined} onChange={event => controller.change(name, event.target.value)}/>
      <FieldError name={name} error={error} t={copy}/>
    </div>)}
    <BirthplaceCombobox language={language} request={placeRequest} selection={draft.birthplace.selection} onChange={selection => controller.change('birthplace', selection)} disabled={disabled} error={error?.field === 'birthplace'}/>
    <FieldError name="birthplace" error={error} t={copy}/>
    <p>{copy('sun')}: <span data-you-sun>{copy(value.profile.sun_sign_code)}</span></p>
    <div className="flex flex-wrap gap-3"><ShinkaButton type="submit" disabled={disabled}>{copy(busy ? 'saving' : 'save')}</ShinkaButton><ShinkaButton variant="secondary" disabled={disabled} onClick={controller.cancel}>{copy('cancel')}</ShinkaButton></div>
  </form>;
}