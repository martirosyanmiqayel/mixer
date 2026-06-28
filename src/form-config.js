// Единый источник правды для формы: используется и сервером (валидация),
// и фронтендом (рендер полей). Порядок полей = порядок в форме и в embed.

export const FORM = {
  title: 'Заявка в Команду проекта MixerGrief',
  description: 'Заполните все поля. Заявка отправляется в Discord на рассмотрение.',
  fields: [
    {
      name: 'nickname',
      label: 'Ваш никнейм?',
      type: 'text',
      required: true,
    },
    {
      name: 'age',
      label: 'Сколько Вам лет?',
      type: 'number',
      required: true,
      min: 1,
      max: 99,
    },
    {
      name: 'knows_rules',
      label: 'Знаете ли Вы правила проекта?',
      type: 'choice',
      required: true,
      options: ['Да', 'Нет'],
    },
    {
      name: 'other_projects',
      label: 'Стояли ли Вы на других проектах?',
      hint: 'Если да — укажите причину ухода.',
      type: 'textarea',
      required: true,
    },
    {
      name: 'blacklist',
      label: 'Находились ли Вы в списке ЧСП/ЧСКП проекта MixerGrief?',
      type: 'choice',
      required: true,
      options: ['Да', 'Нет'],
    },
    {
      name: 'ready_to_help',
      label: 'Готовы ли Вы помогать проекту?',
      type: 'choice',
      required: true,
      options: ['Да', 'Нет'],
    },
    {
      name: 'has_mic',
      label: 'Имеется ли у Вас микрофон?',
      type: 'choice',
      required: true,
      options: ['Да', 'Нет'],
    },
    {
      name: 'telegram',
      label: 'Аккаунт Telegram',
      hint: 'Обязательно @username, без него заявка не рассматривается.',
      type: 'text',
      required: true,
      pattern: '^@[A-Za-z0-9_]{4,32}$',
      patternError: 'Укажите @username (например @ivan_petrov), 5–33 символа.',
    },
    {
      name: 'mode',
      label: 'На какой режим Вы подаёте заявку?',
      type: 'choice',
      required: true,
      options: ['MG (гриф)', 'MA (анархия)'],
    },
  ],
};

// Серверная валидация ответов. Возвращает { ok, errors, clean }.
export function validate(body) {
  const errors = {};
  const clean = {};

  for (const f of FORM.fields) {
    let v = body[f.name];
    v = typeof v === 'string' ? v.trim() : v;

    if (f.required && (v === undefined || v === null || v === '')) {
      errors[f.name] = 'Обязательное поле.';
      continue;
    }

    if (f.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) {
        errors[f.name] = `Введите число от ${f.min} до ${f.max}.`;
        continue;
      }
      clean[f.name] = String(n);
      continue;
    }

    if (f.type === 'choice' && !f.options.includes(v)) {
      errors[f.name] = 'Выберите один из вариантов.';
      continue;
    }

    if (f.minWords) {
      const words = String(v).split(/\s+/).filter(Boolean).length;
      if (words < f.minWords) {
        errors[f.name] = `Минимум ${f.minWords} слов (сейчас ${words}).`;
        continue;
      }
    }

    if (f.pattern && !new RegExp(f.pattern).test(v)) {
      errors[f.name] = f.patternError || 'Неверный формат.';
      continue;
    }

    clean[f.name] = String(v);
  }

  return { ok: Object.keys(errors).length === 0, errors, clean };
}
