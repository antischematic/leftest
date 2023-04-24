import { cypress } from './cypress';

describe('cypress', () => {
  it('should work', () => {
    expect(cypress()).toEqual('cypress');
  });
});
