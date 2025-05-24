// @ts-check Notação para checagem de tipo opcional, pode ser omitida se causar problemas

import globals from "globals";
import eslintJs from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    // Configurações globais aplicáveis a todos os arquivos .js e .mjs
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022, // Pode ser ajustado para mais recente, ex: 2023 ou 2024
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
        // Outros globais customizados podem ser adicionados aqui se necessário
      }
    },
    // Não vamos incluir 'eslint-config-google' diretamente aqui
    // pois sua compatibilidade com flat config é incerta.
    // Começaremos com as regras recomendadas do ESLint e Prettier.
  },

  // Aplica as regras recomendadas do ESLint
  eslintJs.configs.recommended,

  // Aplica a configuração recomendada do eslint-plugin-prettier.
  // Isso inclui `eslint-config-prettier` para desativar regras conflitantes
  // e configura `prettier/prettier` como uma regra de erro.
  eslintPluginPrettierRecommended,

  {
    // Suas regras customizadas (traduzidas do .eslintrc.js)
    // Aplicáveis a todos os arquivos .js e .mjs
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      // 'prettier/prettier': ['error'], // Já é configurado por eslintPluginPrettierRecommended
      'comma-dangle': 'off', // Equivalente a 0
      'no-trailing-spaces': 'off',
      'guard-for-in': 'off',
      'no-invalid-this': 'off',
      'valid-jsdoc': 'off',
      'require-jsdoc': 'off',
      'arrow-parens': 'off',
      'operator-linebreak': [
        'error',
        'after',
        {
          overrides: { '?': 'ignore', ':': 'ignore', '+': 'ignore' }
        }
      ],
      indent: [
        'error',
        2,
        {
          CallExpression: { arguments: 'first' },
          ignoredNodes: [
            'CallExpression > CallExpression',
            'CallExpression > MemberExpression'
          ],
          SwitchCase: 1
        }
      ],
      'max-len': ['error', { code: 80, ignoreComments: true }]
      // Adicione outras regras customizadas do seu .eslintrc.js aqui
    }
  },
  {
   // Configuração para ignorar arquivos específicos (opcional, mas bom ter)
   ignores: [
       "node_modules/",
       "dist/", // Se houver um diretório de build
       "js/vendors/", // Manter ignorado como estava implicitamente antes
     ]
  }
];
