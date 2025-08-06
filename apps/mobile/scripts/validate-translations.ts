import en from '../src/i18n/messages/en.json';
import es from '../src/i18n/messages/es.json';

function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function validateTranslations() {
  const enKeys = getAllKeys(en);
  const esKeys = getAllKeys(es);

  const missingInSpanish = enKeys.filter(
    (key: string) => !esKeys.includes(key)
  );
  const extraInSpanish = esKeys.filter((key: string) => !enKeys.includes(key));

  if (missingInSpanish.length > 0) {
    console.error('❌ Missing Spanish translations:');
    missingInSpanish.forEach((key: string) => console.error(`  - ${key}`));
  }

  if (extraInSpanish.length > 0) {
    console.warn('⚠️  Extra Spanish translations (not in English):');
    extraInSpanish.forEach((key: string) => console.warn(`  - ${key}`));
  }

  if (missingInSpanish.length > 0) {
    console.error(
      `\n❌ Validation failed: ${missingInSpanish.length} missing translations`
    );
    process.exit(1);
  }

  console.log('✅ All translations are valid!');
}

// Run validation
validateTranslations();
