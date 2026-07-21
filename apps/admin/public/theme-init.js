(() => {
  try {
    const stored = localStorage.getItem('linketry_theme');
    const preference = stored === 'light' || stored === 'dark' ? stored : 'dark';
    const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
  } catch {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.themePreference = 'system';
  }
})();
