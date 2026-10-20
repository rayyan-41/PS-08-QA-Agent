import brandTokens from '@pokayoke/brand/tokens.css?inline';

export type InitOptions = {
  publishableKey: string;
  apiBaseUrl: string;
  platformUrl: string;
};

export type SubmitOptions = { returnUrl: string; clientRef?: string };

let host: HTMLDivElement | undefined;

export class WidgetUnavailableError extends Error {
  readonly code = 'NOT_IMPLEMENTED';

  constructor(action: string) {
    super(
      `${action} is not available in the widget scaffold. The backend contract must be confirmed before this feature is connected.`,
    );
    this.name = 'WidgetUnavailableError';
  }
}

/** Scaffold only: initialization never uploads data or requests job status. */
export function init(options: InitOptions): void {
  validateOptions(options);
  if (!document.body) throw new Error('Initialize Pokayoke after the document body is available.');
  destroy();

  host = document.createElement('div');
  host.setAttribute('data-pokayoke-widget', 'scaffold');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const panel = document.createElement('section');
  panel.setAttribute('aria-labelledby', 'pokayoke-widget-title');
  const heading = document.createElement('h2');
  heading.id = 'pokayoke-widget-title';
  heading.textContent = 'Pokayoke widget setup';
  const description = document.createElement('p');
  description.textContent =
    'The widget is initialized. Upload and job status are not connected yet.';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close setup notice';
  close.addEventListener('click', destroy);
  panel.append(heading, description, close);
  shadow.append(style, panel);
  document.body.append(host);
}

/** Reject explicitly until intake is confirmed in the backend's OpenAPI schema. */
export async function submit(_file: File, _options: SubmitOptions): Promise<{ jobId: string }> {
  throw new WidgetUnavailableError('Submitting a file');
}

/** No polling against guessed endpoints. */
export function watch(_jobId: string, _statusToken: string): never {
  throw new WidgetUnavailableError('Watching a job');
}

export function destroy(): void {
  host?.remove();
  host = undefined;
}

function validateOptions(options: InitOptions): void {
  if (!options || !options.publishableKey) throw new Error('Pokayoke requires a publishable key.');
  for (const [name, value] of [
    ['apiBaseUrl', options.apiBaseUrl],
    ['platformUrl', options.platformUrl],
  ] as const) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Pokayoke ${name} must be an absolute HTTP or HTTPS URL.`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      throw new Error(`Pokayoke ${name} must use HTTP or HTTPS.`);
  }
}

// The shared token scope must target the Shadow DOM host instead of the page root.
const styles =
  brandTokens.replaceAll(':root', ':host') +
  `
  :host { all: initial; position: fixed; inset: auto 20px 20px auto; z-index: 2147483000; max-width: calc(100vw - 40px); width: 360px; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  section { padding: 24px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); color: var(--ink); font: 15px/1.55 var(--font-ui); }
  h2 { margin: 0 0 12px; font: 600 18px/1.4 var(--font-display); }
  p { margin: 0 0 20px; color: var(--ink-2); }
  button { min-height: 44px; padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font: 600 13px/1.5 var(--font-ui); cursor: pointer; touch-action: manipulation; }
  button:hover { background: var(--surface-2); }
  button:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
  @media (max-width: 420px) { :host { inset: auto 12px 12px; width: auto; max-width: none; } section { padding: 20px; } }
`;
