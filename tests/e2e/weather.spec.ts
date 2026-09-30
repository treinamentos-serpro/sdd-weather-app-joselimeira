import { expect, test } from '@playwright/test';

const city = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.5,
  longitude: -46.6,
};
const weather = {
  timezone: 'America/Sao_Paulo',
  current: { time: '2026-09-30T12:00', temperature_2m: 20, weather_code: 0 },
  daily: {
    time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
    temperature_2m_min: [10, 11, 12, 13, 14],
    temperature_2m_max: [20, 21, 22, 23, 24],
    weather_code: [0, 1, 2, 3, 61],
  },
};

async function mockWeatherEndpoints(page: import('@playwright/test').Page) {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: weather }));
}

test('busca cidade, mostra cinco dias e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  await mockWeatherEndpoints(page);
  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByText('68°F').first()).toBeVisible();
});

test('impede busca vazia ou contendo apenas espaços', async ({ page }) => {
  const geocodingRequests: string[] = [];
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    geocodingRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto('/');

  for (const query of ['', '   ']) {
    await page.getByLabel('Nome da cidade').fill(query);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('alert')).toContainText('Informe o nome');
  }

  expect(geocodingRequests).toHaveLength(0);
});

test('preserva caracteres especiais no termo enviado ao geocoding', async ({ page }) => {
  const query = "São Tomé & Príncipe / D'Arcy #2";
  let requestedName: string | null = null;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    requestedName = new URL(route.request().url()).searchParams.get('name');
    await route.fulfill({ json: { results: [city] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: weather }));
  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill(query);
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(requestedName).toBe(query);
});

test('mostra estado vazio quando geocoding retorna lista vazia', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    await route.fulfill({ json: weather });
  });
  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('Atlantis');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(forecastRequests).toBe(0);
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('mantém os cinco dias e informa campos ausentes no forecast', async ({ page }) => {
  const partialWeather = {
    current: {},
    daily: {
      time: weather.daily.time,
      temperature_2m_min: [10, null, 12, 13, 14],
      weather_code: [0, null, 2, 3, 61],
    },
  };
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: partialWeather }),
  );
  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByText('Horário da observação indisponível')).toBeVisible();
  await expect(page.getByText('Indisponível').first()).toBeVisible();
  await expect(page.getByText('Condição indisponível').first()).toBeVisible();
  await expect(page.getByText('Chuva indisponível').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/NaN|undefined|null|Invalid Date/);
});

test('renderiza o clima no viewport mobile 375x812', async ({ page }) => {
  await mockWeatherEndpoints(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByLabel('Nome da cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByText('20°C')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
