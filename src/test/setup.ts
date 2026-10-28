import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Whole-app renders with lazy-loaded screens: under a full parallel run, a second can be tight for the
// next screen to arrive. Three keeps findBy/waitFor patient without hiding a real hang.
configure({ asyncUtilTimeout: 3000 });
