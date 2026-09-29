// Input, Select, Textarea, Checkbox, Radio, Switch — ported from design/components/forms.
// Change from the source: ids come from useId() rather than the label text, so two fields sharing a
// label on one page cannot share an id.
import { useId, type ChangeEvent, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './core';
import { cx, injectStyles } from './injectStyles';

const FIELD_CSS = [
'.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
'.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}',
'.br-field__hint--error{color:var(--status-danger-fg)}',
].join('');

function FieldHint({ id, error, hint }: { id: string; error?: ReactNode; hint?: ReactNode }) {
  if (error) return <span id={id} className="br-field__hint br-field__hint--error">{error}</span>;
  if (hint) return <span id={id} className="br-field__hint">{hint}</span>;
  return null;
}

// --- Input ---------------------------------------------------------------------------------------

const INPUT_CSS = [
'.br-input{display:flex;align-items:center;gap:8px;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 12px;color:var(--text-muted);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}',
'.br-input:hover{border-color:var(--tan-500)}',
'.br-input:focus-within{border-color:var(--border-focus);box-shadow:var(--focus-ring);color:var(--text-brand)}',
'.br-input--error{border-color:var(--terracotta-500)}',
'.br-input--disabled{background:var(--surface-sunken);opacity:.6}',
'.br-input--sm{height:var(--control-h-sm)}.br-input--md{height:var(--control-h-md)}.br-input--lg{height:var(--control-h-lg)}',
'.br-input input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-family:var(--font-body);font-size:15px;color:var(--text-primary);height:100%;padding:0}',
'.br-input input::placeholder{color:var(--text-disabled)}',
'.br-input__suffix{font-family:var(--font-body);font-size:14px;color:var(--text-muted)}',
].join('');

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  label?: ReactNode;
  hint?: ReactNode;
  /** Replaces the hint and marks the field invalid. */
  error?: ReactNode;
  iconLeft?: IconName;
  suffix?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export function Input({ label, hint, error, iconLeft, suffix, size = 'md', disabled, id, style, ...rest }: InputProps) {
  injectStyles('field', FIELD_CSS);
  injectStyles('input', INPUT_CSS);
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = inputId + '-hint';
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={inputId}>{label}</label> : null}
      <div className={cx('br-input', 'br-input--' + size, !!error && 'br-input--error', disabled && 'br-input--disabled')}>
        {iconLeft ? <Icon name={iconLeft} size={16} /> : null}
        <input id={inputId} disabled={disabled} aria-invalid={!!error} aria-describedby={error || hint ? hintId : undefined} {...rest} />
        {suffix ? <span className="br-input__suffix">{suffix}</span> : null}
      </div>
      <FieldHint id={hintId} error={error} hint={hint} />
    </div>
  );
}

// --- Select --------------------------------------------------------------------------------------

const SELECT_CSS = [
'.br-select{position:relative;display:flex;align-items:center}',
'.br-select select{appearance:none;-webkit-appearance:none;width:100%;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 36px 0 12px;font-family:var(--font-body);font-size:15px;color:var(--text-primary);cursor:pointer;transition:border-color var(--duration-fast) var(--ease-out)}',
'.br-select select:hover{border-color:var(--tan-500)}',
'.br-select select:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}',
'.br-select select:disabled{background:var(--surface-sunken);opacity:.6;cursor:not-allowed}',
'.br-select--sm select{height:var(--control-h-sm);font-size:14px}.br-select--md select{height:var(--control-h-md)}.br-select--lg select{height:var(--control-h-lg)}',
'.br-select__chev{position:absolute;right:10px;pointer-events:none;color:var(--text-brand)}',
].join('');

export type SelectOption = string | { value: string | number; label: string; disabled?: boolean };

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'style'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export function Select({ label, hint, error, options, size = 'md', id, style, ...rest }: SelectProps) {
  injectStyles('field', FIELD_CSS);
  injectStyles('select', SELECT_CSS);
  const auto = useId();
  const selId = id ?? auto;
  const hintId = selId + '-hint';
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={selId}>{label}</label> : null}
      <div className={'br-select br-select--' + size}>
        <select id={selId} aria-invalid={!!error} aria-describedby={error || hint ? hintId : undefined} {...rest}>
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={16} className="br-select__chev" />
      </div>
      <FieldHint id={hintId} error={error} hint={hint} />
    </div>
  );
}

// --- Textarea ------------------------------------------------------------------------------------

const TEXTAREA_CSS = [
'.br-textarea{width:100%;min-height:96px;resize:vertical;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 12px;font-family:var(--font-body);font-size:15px;line-height:1.5;color:var(--text-primary);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}',
'.br-textarea::placeholder{color:var(--text-disabled)}',
'.br-textarea:hover{border-color:var(--tan-500)}',
'.br-textarea:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}',
'.br-textarea--error{border-color:var(--terracotta-500)}',
'.br-textarea:disabled{background:var(--surface-sunken);opacity:.6}',
].join('');

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  style?: CSSProperties;
}

export function Textarea({ label, hint, error, id, rows = 4, style, ...rest }: TextareaProps) {
  injectStyles('field', FIELD_CSS);
  injectStyles('textarea', TEXTAREA_CSS);
  const auto = useId();
  const taId = id ?? auto;
  const hintId = taId + '-hint';
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={taId}>{label}</label> : null}
      <textarea id={taId} rows={rows} className={cx('br-textarea', !!error && 'br-textarea--error')} aria-invalid={!!error}
        aria-describedby={error || hint ? hintId : undefined} {...rest} />
      <FieldHint id={hintId} error={error} hint={hint} />
    </div>
  );
}

// --- Checkbox ------------------------------------------------------------------------------------

const CHECKBOX_CSS = [
'.br-check{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35;position:relative}',
'.br-check--disabled{opacity:.5;cursor:not-allowed}',
'.br-check input{position:absolute;opacity:0;width:0;height:0}',
'.br-check__box{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:var(--radius-xs);background:var(--surface-card);display:flex;align-items:center;justify-content:center;color:var(--text-on-brand);transition:all var(--duration-fast) var(--ease-out)}',
'.br-check:hover .br-check__box{border-color:var(--teal-400)}',
'.br-check input:focus-visible + .br-check__box{box-shadow:var(--focus-ring)}',
'.br-check--on .br-check__box{background:var(--action-primary);border-color:var(--action-primary)}',
'.br-check__desc{display:block;font-size:13px;color:var(--text-muted)}',
].join('');

type ToggleInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'style' | 'checked'>;

export interface CheckboxProps extends ToggleInputProps {
  label?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

export function Checkbox({ label, description, checked, indeterminate, onChange, disabled, style, ...rest }: CheckboxProps) {
  injectStyles('checkbox', CHECKBOX_CSS);
  const on = checked || indeterminate;
  return (
    <label className={cx('br-check', on && 'br-check--on', disabled && 'br-check--disabled')} style={style}>
      <input type="checkbox" checked={!!checked} disabled={disabled} aria-checked={indeterminate ? 'mixed' : undefined}
        onChange={e => onChange?.(e.target.checked, e)} {...rest} />
      <span className="br-check__box">{indeterminate ? <Icon name="minus" size={13} strokeWidth={3} /> : checked ? <Icon name="check" size={13} strokeWidth={3} /> : null}</span>
      {label || description ? <span>{label}{description ? <span className="br-check__desc">{description}</span> : null}</span> : null}
    </label>
  );
}

// --- Radio ---------------------------------------------------------------------------------------

const RADIO_CSS = [
'.br-radio{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35;position:relative}',
'.br-radio--disabled{opacity:.5;cursor:not-allowed}',
'.br-radio input{position:absolute;opacity:0;width:0;height:0}',
'.br-radio__dot{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:50%;background:var(--surface-card);display:flex;align-items:center;justify-content:center;transition:all var(--duration-fast) var(--ease-out)}',
'.br-radio:hover .br-radio__dot{border-color:var(--teal-400)}',
'.br-radio input:focus-visible + .br-radio__dot{box-shadow:var(--focus-ring)}',
'.br-radio--on .br-radio__dot{border-color:var(--action-primary);border-width:5.5px}',
'.br-radio__desc{display:block;font-size:13px;color:var(--text-muted)}',
].join('');

export interface RadioProps<V extends string> extends Omit<ToggleInputProps, 'value'> {
  label?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  value: V;
  onChange?: (value: V, event: ChangeEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

export function Radio<V extends string>({ label, description, checked, onChange, disabled, name, value, style, ...rest }: RadioProps<V>) {
  injectStyles('radio', RADIO_CSS);
  return (
    <label className={cx('br-radio', checked && 'br-radio--on', disabled && 'br-radio--disabled')} style={style}>
      <input type="radio" name={name} value={value} checked={!!checked} disabled={disabled} onChange={e => onChange?.(value, e)} {...rest} />
      <span className="br-radio__dot" />
      {label || description ? <span>{label}{description ? <span className="br-radio__desc">{description}</span> : null}</span> : null}
    </label>
  );
}

// --- Switch --------------------------------------------------------------------------------------

const SWITCH_CSS = [
'.br-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);position:relative}',
'.br-switch--disabled{opacity:.5;cursor:not-allowed}',
'.br-switch input{position:absolute;opacity:0;width:0;height:0}',
'.br-switch__track{position:relative;width:36px;height:20px;border-radius:var(--radius-pill);background:var(--ink-300);transition:background var(--duration-base) var(--ease-out);flex-shrink:0}',
'.br-switch__thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--white);box-shadow:var(--shadow-sm);transition:transform var(--duration-base) var(--ease-out)}',
'.br-switch--on .br-switch__track{background:var(--action-primary)}',
'.br-switch--on .br-switch__thumb{transform:translateX(16px);background:var(--cream-100)}',
'.br-switch input:focus-visible + .br-switch__track{box-shadow:var(--focus-ring)}',
].join('');

export interface SwitchProps extends ToggleInputProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

export function Switch({ label, checked, onChange, disabled, style, ...rest }: SwitchProps) {
  injectStyles('switch', SWITCH_CSS);
  return (
    <label className={cx('br-switch', checked && 'br-switch--on', disabled && 'br-switch--disabled')} style={style}>
      <input type="checkbox" role="switch" checked={!!checked} disabled={disabled} onChange={e => onChange?.(e.target.checked, e)} {...rest} />
      <span className="br-switch__track"><span className="br-switch__thumb" /></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
