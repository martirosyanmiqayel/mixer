const $ = (id) => document.getElementById(id);

const screens = {
  login: $('login-screen'),
  form: $('form-screen'),
  success: $('success-screen'),
};

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}

// ── Инициализация ────────────────────────────────────────────────
(async function init() {
  const err = new URLSearchParams(location.search).get('error');
  if (err) {
    const banner = $('login-error');
    banner.textContent =
      err === 'config'
        ? 'Вход через Discord не настроен (нет Client ID на сервере).'
        : 'Не удалось войти. Попробуйте ещё раз.';
    banner.classList.remove('hidden');
    history.replaceState(null, '', '/');
  }

  $('login-btn').addEventListener('click', () => (location.href = '/api/login'));
  $('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.href = '/';
  });

  try {
    const res = await fetch('/api/me');
    if (!res.ok) return show('login');
    const { user } = await res.json();
    await setupForm(user);
    show('form');
  } catch {
    show('login');
  }
})();

// ── Построение формы ─────────────────────────────────────────────
async function setupForm(user) {
  $('user-name').textContent = user.tag;
  $('user-id').textContent = `Discord ID: ${user.id}`;
  $('user-avatar').src = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const form = await (await fetch('/api/form')).json();
  $('form-title').textContent = form.title;
  $('form-desc').textContent = form.description;

  const container = $('fields');
  container.innerHTML = '';

  form.fields.forEach((f, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.dataset.name = f.name;
    wrap.style.animationDelay = `${i * 35}ms`;

    const label = document.createElement('label');
    label.className = 'q';
    label.innerHTML = `${escapeHtml(f.label)}${f.required ? ' <span class="req">*</span>' : ''}`;
    if (f.minWords) {
      const wc = document.createElement('span');
      wc.className = 'wordcount';
      wc.dataset.for = f.name;
      wc.textContent = `0 / ${f.minWords} слов`;
      label.appendChild(wc);
    }
    wrap.appendChild(label);

    wrap.appendChild(renderControl(f));

    if (f.hint) {
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = f.hint;
      wrap.appendChild(hint);
    }

    const err = document.createElement('div');
    err.className = 'field-error';
    wrap.appendChild(err);

    container.appendChild(wrap);
  });

  const formEl = $('app-form');
  formEl.addEventListener('input', () => {
    updateProgress(form);
    updateWordCounts(form);
  });
  formEl.addEventListener('change', () => updateProgress(form));
  formEl.addEventListener('submit', onSubmit);
  updateProgress(form);
}

function updateProgress(form) {
  const fd = new FormData($('app-form'));
  let filled = 0;
  for (const f of form.fields) {
    const v = fd.get(f.name);
    if (v != null && String(v).trim() !== '') filled++;
  }
  const pct = Math.round((filled / form.fields.length) * 100);
  $('progress-bar').style.width = `${pct}%`;
}

function updateWordCounts(form) {
  for (const f of form.fields) {
    if (!f.minWords) continue;
    const el = document.querySelector(`.wordcount[data-for="${f.name}"]`);
    const ta = document.querySelector(`[name="${f.name}"]`);
    if (!el || !ta) continue;
    const n = ta.value.trim().split(/\s+/).filter(Boolean).length;
    el.textContent = `${n} / ${f.minWords} слов`;
    el.classList.toggle('ok', n >= f.minWords);
  }
}

function renderControl(f) {
  if (f.type === 'textarea') {
    const t = document.createElement('textarea');
    t.name = f.name;
    return t;
  }
  if (f.type === 'choice') {
    const box = document.createElement('div');
    box.className = 'choices';
    for (const opt of f.options) {
      const lbl = document.createElement('label');
      lbl.className = 'choice';
      lbl.innerHTML = `<input type="radio" name="${f.name}" value="${escapeHtml(opt)}"><span>${escapeHtml(opt)}</span>`;
      box.appendChild(lbl);
    }
    return box;
  }
  const input = document.createElement('input');
  input.type = f.type === 'number' ? 'number' : 'text';
  input.name = f.name;
  if (f.min != null) input.min = f.min;
  if (f.max != null) input.max = f.max;
  return input;
}

// ── Отправка ─────────────────────────────────────────────────────
async function onSubmit(e) {
  e.preventDefault();
  clearErrors();

  const fd = new FormData(e.target);
  const data = {};
  for (const [k, v] of fd.entries()) data[k] = v;

  const btn = $('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Отправка…';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      $('success-code').textContent = json.code || '—';
      show('success');
      return;
    }
    if (json.errors) {
      applyErrors(json.errors);
    } else {
      alert(json.error || 'Произошла ошибка. Попробуйте позже.');
    }
  } catch {
    alert('Сеть недоступна. Попробуйте позже.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить заявку';
  }
}

function clearErrors() {
  document.querySelectorAll('.field.invalid').forEach((el) => {
    el.classList.remove('invalid');
    el.querySelector('.field-error').textContent = '';
  });
}

function applyErrors(errors) {
  let first = null;
  for (const [name, msg] of Object.entries(errors)) {
    const field = document.querySelector(`.field[data-name="${name}"]`);
    if (!field) continue;
    field.classList.add('invalid');
    field.querySelector('.field-error').textContent = msg;
    if (!first) first = field;
  }
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
