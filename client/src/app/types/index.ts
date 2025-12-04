export { APICallError } from './errors';
export { type UserComment } from './api';

export type Message = {
  role: string;
  content: string;
  id?: string;
};

export type MsgHistory = Message & { id: string; role: string };

export interface DefaultParam extends InferenceParametersObj {
  process_input?: boolean;
  process_output: boolean;
}

export interface InferenceParametersObj {
  decoding_method?: 'greedy' | 'sample';
  length_penalty?: {
    decay_factor: number;
    start_index: number;
  };
  max_new_tokens?: number;
  min_new_tokens?: number;
  random_seed?: number;
  stop_str?: string[];
  stream?: boolean;
  temperature?: number;
  time_limit?: number;
  top_k?: number;
  top_p?: number;
  typical_p?: number;
  repetition_penalty?: number;
  truncate_input_tokens?: number;
  beam_width?: number;
  return_options?: {
    input_text: boolean;
    generated_tokens: boolean;
    input_tokens: boolean;
    token_logprobs: boolean;
    token_ranks: boolean;
    top_n_tokens: number;
  };
  moderations?: {
    hap:
      | boolean
      | {
          input: boolean;
          output: boolean;
          threshold: number;
        };
  };
}

export type ModelConfig = {
  template: {
    name: string;
    system_template?: string;
    system_message: string;
    roles?: string[];
    messages?: unknown[];
    offset?: number;
    sep_style?: number;
    sep?: string;
    sep2?: string;
    stop_str?: string[] | string;
    stop_token_ids?: number[];
  };
  default_generate_params: {
    temperature: number;
    top_p: number;
    top_k: number;
    repetition_penalty: number;
    max_output_tokens?: number;
    max_new_tokens?: number;
  };
  tokenizer_optional_encode_args?: { [key: string]: string };
  tokenizer_optional_decode_args?: { [key: string]: string };
  autotokenizer_config?: {
    use_autotokenizer?: boolean;
    add_generation_prompt?: boolean;
  };
  adapter?: 'bigcode' | 'megatron' | 'dolomite' | 'llama-2';
  parameters_billions?: number;
  openai_compatible?: boolean;
};
