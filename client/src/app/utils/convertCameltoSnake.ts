export const camelToSnake = (camel: string) => {
  return camel.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

export const formatDataKeysToSnakeCase = (data: unknown): unknown => {
  switch (true) {
    case typeof data === 'object' && data !== null && !Array.isArray(data):
      const formatted: Record<string, unknown> = {};

      Object.keys(data as Record<string, unknown>).forEach((key) => {
        formatted[camelToSnake(key)] = formatDataKeysToSnakeCase((data as Record<string, unknown>)[key]);
      });

      return formatted;
    case Array.isArray(data):
      return data.map((value) => formatDataKeysToSnakeCase(value));
    default:
      return data;
  }
};
