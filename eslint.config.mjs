// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'uploads/',
      'eslint.config.mjs', // Bỏ qua chính file config này
      // Bỏ thêm các file .js hoặc .mjs cụ thể nếu cần, thay vì dùng wildcard '*.js'
    ],
  },

  eslint.configs.recommended,

  // Cấu hình chính cho TypeScript files
  // (Gộp "General configuration" và "TypeScript files configuration" vào một khối cho rõ ràng)
  {
    files: ['**/*.ts', '**/*.tsx'], // Áp dụng cho tất cả file TS và TSX
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser, // Chỉ định parser ở đây
      parserOptions: {
        project: ['./tsconfig.json'], // Hoặc ['./tsconfig.json', './tsconfig.node.json']
        tsconfigRootDir: import.meta.dirname,
        // ecmaFeatures thường được lấy từ tsconfig, không cần thiết ở đây nếu đã có trong tsconfig
        // ecmaFeatures: {
        //   experimentalDecorators: true,
        //   emitDecoratorMetadata: true,
        // },
      },
    },
    // Import các bộ rules của typescript-eslint vào đây để chúng áp dụng cho files: ['**/*.ts', '**/*.tsx']
    // Đây là cách tiếp cận hơi khác so với việc rải chúng ở global scope.
    // Một cách khác là để các ...tseslint.configs.recommended ở global và khối này chỉ override rules.
    // Tuy nhiên, đặt trong block files: [...] sẽ tường minh hơn.
    // Cách 1: Để configs ở global và khối này chỉ override (như bạn đang làm và cũng tốt)
    // Cách 2: Kéo configs vào đây (cần cẩn thận)
    // Ví dụ cho Cách 2 (cần thử nghiệm kỹ):
    // ...tseslint.configs.strictTypeChecked, // Hoặc recommendedTypeChecked, recommended
    // Nếu làm theo Cách 2 thì xóa các ...tseslint.configs.* ở scope global
    // --> Giữ nguyên cách của bạn là để `...tseslint.configs.recommended` và `...tseslint.configs.recommendedTypeChecked` ở global,
    // và khối này chỉ override hoặc thêm rules là một cách tiếp cận phổ biến và dễ hiểu.

    rules: {
      // General rules (áp dụng cho TS files do files pattern)
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // typescript-eslint sẽ xử lý
      'prefer-const': 'warn', // Đổi thành warn có thể dễ chịu hơn khi dev
      'no-var': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn', // Warn trong dev, error trong CI
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/ban-types': [
        'warn',
        {
          // Cân nhắc cấu hình này
          types: {
            Function: { message: 'Avoid using the `Function` type. Prefer a specific function type.' },
          },
          extendDefaults: true,
        },
      ],
      '@typescript-eslint/no-empty-function': 'off', // Có thể chấp nhận cho mocks hoặc abstract methods

      // NestJS specific or common preferences
      '@typescript-eslint/interface-name-prefix': 'off', // Common practice now
      '@typescript-eslint/parameter-properties': 'off', // NestJS sử dụng nhiều, tắt là OK

      // Thêm các rule type-checked
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: { arguments: false, attributes: false }, // Hoặc checksVoidReturn: false nếu đơn giản hơn
        },
      ],
      '@typescript-eslint/require-await': 'warn', // Warn thay vì error
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // Warn thay vì error
      '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true, allowBoolean: true }],
    },
  },
  // Khối `tseslint.configs.recommended` và `tseslint.configs.recommendedTypeChecked` ở global là OK.
  // Nó sẽ áp dụng trước, sau đó khối `files: ['**/*.ts']` ở trên sẽ override rules cho các file đó.

  // Xóa bỏ khối "TypeScript files configuration" thứ hai vì nó đã được gộp
  // hoặc các rules của nó đã được đưa vào khối cấu hình TS chính ở trên.
  // {
  //   files: ['**/*.ts', '**/*.tsx'], // KHỐI NÀY CÓ THỂ XÓA NẾU ĐÃ GỘP
  //   languageOptions: { /* ... */ }, // Không cần nếu đã có ở trên
  //   rules: { /* ... */ } // Các rules này nên được đưa vào khối TS chính
  // },

  // Test files configuration
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts', '**/__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest, // Hoặc vitest, mocha, etc.
        // ...globals.node, // Không cần nếu khối TS chính đã có globals.node và test file là .ts
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/require-await': 'off', // Chắc chắn tắt cho tests
      '@typescript-eslint/no-empty-function': 'off', // Cho phép mock rỗng
      'dot-notation': 'off', // Cho phép truy cập mock bằng key string
    },
  },

  // Prettier configuration (must be last)
  prettier,
);
