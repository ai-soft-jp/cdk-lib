import { configs } from '@ai-soft-jp/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(configs.aws_cdk, configs.cloudfront_function('functions/cloudfront/**/*'), {
  ignores: ['dist/**/*'],
});
