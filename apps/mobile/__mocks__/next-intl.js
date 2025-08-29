module.exports = {
  useTranslations: jest.fn(() => (key) => key),
  useFormatter: jest.fn(() => ({})),
  NextIntlClientProvider: ({ children }) => children,
};
