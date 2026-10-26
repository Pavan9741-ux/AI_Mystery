import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [js.configs.recommended, { files: ['src/**/*.{js,jsx}'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser }, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { react, 'react-hooks': hooks }, settings: { react: { version: 'detect' } }, rules: { ...react.configs.flat.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off', ...hooks.configs.recommended.rules } }];
