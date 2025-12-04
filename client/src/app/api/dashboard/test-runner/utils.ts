export type Run = {
  _id?: string;
  run_id: string;
  creator: string;
  model_id: string;
  judge_model_id?: string;
  judge_model_ids?: string[];
  databuilder: string;
  created_at: string;
  status: string;
  error_msg?: string;
  number_of_tests?: number | null;
};

type Parameters = {
  temperature: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
  repetition_penalty: number;
  max_new_tokens: number;
  additional_params: { [key: string]: unknown };
  thinking?: boolean;
};

type ModelSource = 'ollama' | 'watsonx';

type Credentials = {
  watsonx_api_key?: string;
  watsonx_project_id?: string;
};

export type StartRunBody = {
  user: string;
  model_id: string;
  source: ModelSource;
  credentials?: Credentials;
  tests?: string[];
  judges?: string[];
  model_inference_url?: string;
  parameters: Parameters;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateSchema(data: any): data is StartRunBody {
  const keys = Object.keys(data);

  const startRunSchemaKeys = ['user', 'model_id', 'params', 'tests'];

  for (const key of keys) {
    if (!startRunSchemaKeys.includes(key)) {
      console.warn(key + ' is not part of the schema');
      return false;
    }
  }
  return true;
}
