(function () {
  'use strict';
  // The archived app supplies its own React runtime and mocked auth context.
  window.__TP_RENDER_AUTH__ = function (jsx, React, options) {
    const h = (type, props, ...children) => jsx.jsxs(type, children.length ? { ...props, children } : (props || {}));
    const symbol = (name, size = 20) => h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': true }, h('use', { href: '/prototipo/bootstrap-icons.svg#' + name }));
    const [brand, setBrand] = React.useState(() => window.__WHITELABEL_BRANDING__ || {});
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmation, setConfirmation] = React.useState('');
    const [visible, setVisible] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    const [error, setError] = React.useState('');
    React.useEffect(() => {
      const update = (event) => setBrand(event.detail || {});
      window.addEventListener('whitelabel:update', update);
      setBrand(window.__WHITELABEL_BRANDING__ || {});
      return () => window.removeEventListener('whitelabel:update', update);
    }, []);
    const mode = options.mode;
    const params = new URLSearchParams(window.location.search);
    const skeleton = params.get('skeleton') === '1';
    const selectedTemplate = 'split';
    const template = ['split', 'centered', 'hero', 'glassmorphism', 'minimal'].includes(selectedTemplate) ? selectedTemplate : 'split';
    const bar = (width = '100%', size = 'small') => h('div', { className: 'tp-auth-placeholder tp-auth-placeholder-' + size, style: { width } });
    const go = (path) => { setError(''); setSent(false); options.navigate(path); };
    const link = (label, path) => h('a', { href: '/prototipo' + path, onClick: (event) => { event.preventDefault(); go(path); } }, label);
    const icon = () => h('span', { className: 'tp-auth-icon', 'aria-hidden': true }, symbol('lightning-charge-fill', 24));
    const brandHeader = h('div', { className: 'tp-auth-brand' },
      brand.logo ? h('img', { src: brand.logo, alt: brand.name || 'Gotrade', style:{maxWidth:220,maxHeight:60,objectFit:'contain'} }) : icon(),
      !brand.logo && (skeleton ? bar('160px', 'heading') : h('strong', {}, brand.name || 'Gotrade')));
    const input = (label, type, value, setter, autocomplete) => h('label', { className: 'tp-auth-field' }, h('span', {}, label),
      h('input', { type, value, autoComplete: autocomplete, placeholder: type === 'email' ? 'voce@email.com' : 'Sua senha', onChange: (event) => setter(event.target.value) }));
    const passwordInput = h('label', { className: 'tp-auth-field' }, h('span', {}, mode === 'reset' ? 'Nova senha' : 'Senha'),
      h('div', { className: 'tp-auth-password' },
        h('input', { type: visible ? 'text' : 'password', value: password, autoComplete: mode === 'reset' ? 'new-password' : 'current-password', placeholder: 'Sua senha', onChange: (event) => setPassword(event.target.value) }),
        h('button', { type: 'button', title: visible ? 'Ocultar senha' : 'Mostrar senha', 'aria-label': visible ? 'Ocultar senha' : 'Mostrar senha', onClick: () => setVisible(!visible) },
          symbol(visible ? 'eye-slash' : 'eye'))));
    const title = mode === 'forgot' ? 'Esqueceu sua senha?' : mode === 'reset' ? 'Crie uma nova senha' : 'Entre na sua conta';
    async function submit(event) {
      event.preventDefault();
      setError('');
      if (mode === 'forgot') { setSent(true); return; }
      if (mode === 'reset' && password !== confirmation) { setError('As senhas devem ser iguais.'); return; }
      setBusy(true);
      try { await options.login(email, password); go('/app'); }
      catch { setError('Não foi possível abrir o protótipo. Tente novamente.'); }
      finally { setBusy(false); }
    }
    const form = h('form', { className: 'tp-auth-form', noValidate: true, onSubmit: submit },
      h('div', { className: 'tp-auth-eyebrow' }, 'SUA PLATAFORMA'), h('h1', {}, title),
      h('p', {}, mode === 'forgot' ? 'Enviaremos um link para recuperar seu acesso.' : mode === 'reset' ? 'Defina sua nova senha para continuar.' : 'Acesse sua conta e acompanhe suas operações.'),
      sent ? h('div', { className: 'tp-auth-success', role: 'status' }, h('strong', {}, 'Confira seu e-mail'), h('p', {}, 'O link de recuperação foi enviado.'), link('Redefinir senha', '/reset?token=demo')) : h(React.Fragment, {},
        mode !== 'reset' ? input('E-mail', 'email', email, setEmail, 'username') : null,
        mode !== 'forgot' ? passwordInput : null,
        mode === 'reset' ? input('Confirmar senha', visible ? 'text' : 'password', confirmation, setConfirmation, 'new-password') : null,
        mode === 'login' ? h('div', { className: 'tp-auth-options' }, h('label', {}, h('input', { type: 'checkbox' }), 'Lembrar de mim'), link('Esqueci minha senha', '/forgot')) : null,
        error ? h('p', { role: 'alert', className: 'tp-auth-error' }, error) : null,
        h('button', { className: 'tp-auth-submit', disabled: busy }, busy ? 'Entrando...' : mode === 'forgot' ? 'Enviar link' : mode === 'reset' ? 'Salvar nova senha' : 'Entrar', symbol('arrow-up-right', 17))),
      mode !== 'login' ? h('div', { className: 'tp-auth-back' }, link('Voltar ao login', '/login')) : h('p', { className: 'tp-auth-footer' }, 'Ambiente demonstrativo. Nenhuma ordem real é enviada.'));
    const skeletonForm = h('div', { className: 'tp-auth-form tp-auth-skeleton-form' },
      bar('38%'), bar('90%', 'title'), bar('78%'),
      h('div', { className: 'tp-auth-field' }, bar('25%'), h('div', { className: 'tp-auth-placeholder-input' }, bar('48%'))),
      h('div', { className: 'tp-auth-field' }, bar('20%'), h('div', { className: 'tp-auth-placeholder-input' }, bar('34%'))),
      h('div', { className: 'tp-auth-options' }, bar('28%'), bar('40%')),
      h('div', { className: 'tp-auth-submit' }, bar('38%')), bar('60%'));
    const intro = h('section', { className: 'tp-auth-intro' }, brandHeader,
      h('div', { className: 'tp-auth-copy' }, skeleton ? h('div', {}, bar('90%', 'title'), bar('80%', 'title'), bar('68%', 'title')) : h('h2', {}, 'Seu próximo movimento ', h('span', {}, 'começa aqui.')),
        skeleton ? h('div', {}, bar('86%'), bar('72%')) : h('p', {}, 'Um novo olhar para o mercado. Acompanhe suas operações, explore estratégias e mantenha o controle da sua jornada, em um só lugar.'),
        h('div', { className: 'tp-auth-features' }, ...['Acompanhe suas operações', 'Gerencie sua conta', 'Explore novas estratégias'].map((label) => h('div', {}, symbol('check-lg', 16), skeleton ? bar('58%') : h('span', {}, label))))),
      skeleton ? bar('40%') : h('span', { className: 'tp-auth-status' }, 'Ambiente demonstrativo'));
    return h('main', { className: 'tp-auth tp-auth-' + template, 'data-auth-mode': mode, 'data-auth-template': template },
      h('div', { className: 'tp-auth-atmosphere', 'aria-hidden': true },
        h('div', { className: 'tp-auth-wash' }),
        ...Array.from({ length: 18 }, (_, index) => h('i', { key: index, className: 'tp-auth-particle', style: { left: ((index * 37 + 7) % 100) + '%', top: ((index * 23 + 11) % 100) + '%', '--drift-duration': (18 + index % 7 * 3) + 's', '--drift-delay': (-index * 2.7) + 's' } }))),
      template === 'split' || template === 'hero' ? intro : null,
      h('section', { className: 'tp-auth-main' }, template !== 'split' && template !== 'hero' ? brandHeader : h('div', { className: 'tp-auth-mobile-brand' }, brandHeader), skeleton ? skeletonForm : form));
  };
})();
