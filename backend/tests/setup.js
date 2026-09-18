process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-only';
// bcrypt at production cost makes every register/login take ~250ms; 4 is the minimum bcrypt allows.
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';
