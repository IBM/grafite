type ValueType = 'Number' | 'String' | 'Boolean' | 'List, object';

export type AdditionalParameter = {
  name: string;
  value: unknown;
  valueType: ValueType;
  id: string;
};

export type AdditionalParameterValue = { [key in keyof AdditionalParameter]: AdditionalParameter[key] };

export type DefaultParameters = {
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
};

export const mapDefaultParameterPayload = (parameters: DefaultParameters) => {
  const entries = Object.entries(parameters).map(([key, val]) => {
    const payloadKey = (() => {
      switch (key) {
        case 'topP':
          return 'top_p';
        case 'frequencyPenalty':
          return 'frequency_penalty';
        case 'presencePenalty':
          return 'presence_penalty';
        case 'maxTokens':
          return 'max_tokens';
        case 'temperature':
        default:
          return key;
      }
    })();
    return [payloadKey, val];
  });
  return Object.fromEntries(entries);
};

export const mapAdditionalParameterPayload = (parameters: AdditionalParameter[]) => {
  const entries = parameters.map(({ name, value, valueType }) => {
    const formattedValue = (() => {
      switch (valueType) {
        case 'String':
          return (value as string).toString();
        case 'Number':
          return Number(value);
        case 'Boolean':
          return Boolean(value);
        case 'List, object':
          try {
            console.log(JSON.parse(value as string));
            return JSON.parse(value as string);
          } catch (e) {
            console.error(e);
          }
        default:
          return null;
      }
    })();

    return [name, formattedValue];
  });
  return Object.fromEntries(entries);
};

export const getDefaultParameters = () => {
  return {
    temperature: 0,
    topP: 1,
    frequencyPenalty: 0.06,
    presencePenalty: 0,
    maxTokens: 1024,
  };
};

export const getDefaultAdditionalParameter = () =>
  ({ name: '', value: '', valueType: 'Number', id: '' }) as AdditionalParameterValue;
