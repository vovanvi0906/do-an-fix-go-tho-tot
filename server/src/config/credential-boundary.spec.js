import databaseConfig from './database.config';

jest.mock('dotenv/config', () => ({}));
jest.mock('cloudinary', () => ({ v2: { config: jest.fn() } }));
jest.mock('multer-storage-cloudinary', () => ({ CloudinaryStorage: class {} }));

it('does not fall back to embedded cloud upload credentials', () => {
  const keys = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    keys.forEach((key) => delete process.env[key]);
    jest.isolateModules(() => {
      const { v2 } = require('cloudinary');
      require('./cloudinary.config');
      expect(v2.config).toHaveBeenCalledWith({
        cloud_name: undefined,
        api_key: undefined,
        api_secret: undefined,
      });
    });
  } finally {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  }
});
it('uses only the explicitly supplied database URL', () => {
  const old = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    expect(databaseConfig()).toEqual({ url: undefined });
    process.env.DATABASE_URL = 'postgresql://127.0.0.1:1/offline';
    expect(databaseConfig().url).toBe(process.env.DATABASE_URL);
  } finally {
    if (old === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = old;
  }
});
