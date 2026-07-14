import { configs } from '@ai-soft-jp/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  configs.aws_cdk,
  configs.cloudfront_function('functions/cloudfront/**/*', 'test/aws_cloudfront/function/**/*'),
  {
    ignores: ['dist/**/*'],
  },
  {
    files: ['test/aws_cloudfront/function/**/*'],
    rules: { 'import-x/newline-after-import': 'off' },
  },
);
