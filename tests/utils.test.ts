import { expect } from 'chai';
import { withErrorHandling } from '../src/lib/index.js';

describe('withErrorHandling', () => {
  let consoleErrorStub: typeof console.error;

  beforeEach(() => {
    consoleErrorStub = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    console.error = consoleErrorStub;
  });

  it('passes through successful handler result', async () => {
    const handler = async () => ({
      content: [{ type: 'text' as const, text: 'ok' }],
    });

    const wrapped = withErrorHandling(handler);
    const result = await wrapped({});

    expect(result.content[0]).to.deep.equal({ type: 'text', text: 'ok' });
    expect(result).to.not.have.property('isError');
  });

  it('catches errors and returns error result', async () => {
    const handler = async (): Promise<never> => {
      throw new Error('something failed');
    };

    const wrapped = withErrorHandling(handler);
    const result = await wrapped({});

    expect(result.isError).to.equal(true);
    expect(result.content[0]).to.have.property('text', 'Error: something failed');
  });

  it('handles non-Error throws', async () => {
    const handler = async (): Promise<never> => {
      throw 'string error';
    };

    const wrapped = withErrorHandling(handler);
    const result = await wrapped({});

    expect(result.isError).to.equal(true);
    expect(result.content[0]).to.have.property('text', 'Error: string error');
  });
});
